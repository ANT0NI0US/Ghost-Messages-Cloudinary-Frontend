import { api } from "./client.js";

// files go as multipart under the same field names the backend's multer expects
const toForm = (fields = {}, files = [], fileField = "attachments") => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== "") form.append(key, value);
  });
  files.forEach((file) => form.append(fileField, file));
  return form;
};

const query = (params) => {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
  );
  return search.size ? `?${search}` : "";
};

export const auth = {
  signup: (body) => api("/auth/signup", { method: "POST", body, auth: false }),
  confirmEmail: (body) => api("/auth/confirm-email", { method: "PATCH", body, auth: false }),
  resendConfirmEmail: (email) =>
    api("/auth/resend-confirm-email", { method: "PATCH", body: { email }, auth: false }),
  login: (body) => api("/auth/login", { method: "POST", body, auth: false }),
  loginConfirmation: (body) => api("/auth/login-confirmation", { method: "PATCH", body, auth: false }),
  google: (idToken) => api("/auth/signup-with-gmail", { method: "POST", body: { idToken }, auth: false }),
  forgotPassword: (email) => api("/auth/forgot-password", { method: "POST", body: { email }, auth: false }),
  resetPasswordFromLink: (token, body) =>
    api(`/auth/reset-password/${token}`, { method: "PATCH", body, auth: false }),
  enableTwoStep: () => api("/auth/enable-two-step-verification", { method: "POST" }),
  confirmTwoStep: (otp) => api("/auth/confirm-two-step-verification", { method: "PATCH", body: { otp } }),
  logout: (action) => api("/auth/logout", { method: "POST", body: { action } }),
};

export const users = {
  me: () => api("/user/profile"),
  publicProfile: (userId) => api(`/user/${userId}/share-profile`, { auth: false }),
  update: (body) => api("/user/update", { method: "PATCH", body }),
  uploadPhoto: (file) =>
    api("/user/profile-image", { method: "PATCH", form: toForm({}, [file], "attachment") }),
  deletePhoto: () => api("/user/profile-image", { method: "DELETE" }),
  uploadCovers: (files) => api("/user/cover-images", { method: "PATCH", form: toForm({}, files) }),
  all: ({ type, page, limit }) => api(`/user/all${query({ type, page, limit })}`),
  setStatus: (userId, status) => api(`/user/${userId}/status`, { method: "PATCH", body: { status } }),
  remove: (userId) => api(`/user/${userId}`, { method: "DELETE" }),
};

export const messages = {
  // named = true sends the session token so the receiver can see who wrote it
  send: ({ receiverId, content, files, named }) =>
    api("/message", {
      method: "POST",
      auth: named,
      form: toForm({ receiverId, content }, files),
    }),
  all: ({ type, page, limit }) => api(`/message/all${query({ type, page, limit })}`),
  one: (messageId) => api(`/message/${messageId}`),
  remove: (messageId) => api(`/message/${messageId}`, { method: "DELETE" }),
};

export const requests = {
  all: ({ type, page, limit }) => api(`/request/all${query({ type, page, limit })}`),
  create: (messageId) => api("/request/create", { method: "POST", body: { messageId } }),
  act: (requestId, action) => api("/request/action", { method: "POST", body: { requestId, action } }),
};

export const conversations = {
  messages: (messageId) => api(`/conversation/all${query({ messageId })}`),
  reply: ({ messageId, content, files }) =>
    api("/conversation/create", { method: "POST", form: toForm({ messageId, content }, files) }),
};
