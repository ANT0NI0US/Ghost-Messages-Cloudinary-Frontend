import { read, write } from "../lib/storage.js";

const BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const TOKENS_KEY = "gm.tokens";

let apiLanguage = 1;
let rotating = null;
let onSessionEnd = () => {};

export const setApiLanguage = (value) => {
  apiLanguage = value;
};

export const setSessionEndHandler = (handler) => {
  onSessionEnd = handler;
};

export const getTokens = () => read(TOKENS_KEY);
export const saveTokens = (tokens) => write(TOKENS_KEY, tokens);

// the backend answers { status_code, message, data } and on errors { message, issues: [{ path, message }] }
export class ApiError extends Error {
  constructor({ status, message, issues = [] }) {
    super(message);
    this.status = status;
    this.issues = issues;
    // zod paths look like ["body", "email"], mongoose paths like ["email"]: the last part is the field
    this.fields = Object.fromEntries(
      issues.filter((issue) => issue.path?.length).map((issue) => [issue.path.at(-1), issue.message]),
    );
  }
}

const send = async (path, { method = "GET", body, form, token } = {}) => {
  const headers = { "accept-language": String(apiLanguage) };
  if (token) headers.authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["content-type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError({ status: 0, message: "network" });
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError({ status: response.status, message: json.message, issues: json.issues });
  }
  return json;
};

// one rotation at a time: parallel requests that all got 401 wait for the same new pair of tokens
const rotateTokens = () => {
  rotating ??= (async () => {
    const refresh = getTokens()?.refresh_token;
    if (!refresh) throw new ApiError({ status: 401, message: "" });
    const { data } = await send("/auth/rotate-token", { method: "POST", token: refresh });
    saveTokens(data);
    return data;
  })().finally(() => {
    rotating = null;
  });
  return rotating;
};

/*
  api("/message/all")                         → authenticated if a session exists
  api("/message", { auth: false, form })      → never sends the token (anonymous message)
  On 401 the access token is rotated once with the refresh token and the request is retried.
  If that fails too (revoked, logged out everywhere, password reset) the session ends.
*/
export const api = async (path, { auth = true, ...options } = {}) => {
  const access = auth ? getTokens()?.access_token : undefined;
  try {
    return await send(path, { ...options, token: access });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || !access) throw error;
    try {
      const fresh = await rotateTokens();
      return await send(path, { ...options, token: fresh.access_token });
    } catch (retryError) {
      saveTokens(null);
      onSessionEnd();
      throw retryError;
    }
  }
};
