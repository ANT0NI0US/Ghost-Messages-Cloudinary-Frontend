import { useCallback, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { auth } from "../api/endpoints.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { GoogleButton, hasGoogle } from "../components/GoogleButton.jsx";
import { useToast } from "../components/Toast.jsx";
import { Button, Field, Notice, errorText } from "../components/ui.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { GenderEnum } from "../lib/enums.js";
import { useSubmit } from "../lib/useSubmit.js";

const AuthCard = ({ title, lead, children, footer }) => (
  <div className="mx-auto max-w-md">
    <h1 className="font-[family-name:var(--font-display)] text-[40px] leading-tight font-normal">{title}</h1>
    {lead && <p className="mt-2 text-haze">{lead}</p>}
    <div className="mt-8 flex flex-col gap-5">{children}</div>
    {footer && <div className="mt-8 border-t border-line pt-5 text-[15px] text-haze">{footer}</div>}
  </div>
);

const useGoogleSignIn = () => {
  const { startSession } = useAuth();
  const navigate = useNavigate();
  const { run, error } = useSubmit(
    useCallback(
      async (idToken) => {
        const { data } = await auth.google(idToken);
        await startSession(data);
        navigate("/inbox");
      },
      [startSession, navigate],
    ),
  );
  return { onToken: run, error };
};

const GoogleSection = () => {
  const { t } = useI18n();
  const google = useGoogleSignIn();
  if (!hasGoogle) return null;
  return (
    <>
      <div className="flex items-center gap-3 text-[13px] text-haze">
        <span className="h-px flex-1 bg-line" />
        {t("auth.or")}
        <span className="h-px flex-1 bg-line" />
      </div>
      <GoogleButton onToken={google.onToken} />
      {google.error && <Notice tone="error">{errorText(google.error, t)}</Notice>}
    </>
  );
};

export const Login = () => {
  const { t } = useI18n();
  const { startSession, sessionEnded, clearSessionEnded } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });

  const { run, busy, error, fields } = useSubmit(async () => {
    const response = await auth.login(form);
    clearSessionEnded();
    // two-step verification on: the backend sends a code instead of tokens
    if (!response.data) {
      navigate(`/login/verify?email=${encodeURIComponent(form.email)}`);
      return;
    }
    await startSession(response.data);
    navigate(location.state?.from ?? "/inbox", { replace: true });
  });

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  return (
    <AuthCard
      title={t("auth.loginTitle")}
      lead={t("auth.loginLead")}
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link to="/signup" className="text-ink underline underline-offset-4">
            {t("nav.signup")}
          </Link>
        </>
      }
    >
      {sessionEnded && <Notice>{t("common.sessionEnded")}</Notice>}
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          run();
        }}
      >
        <Field label={t("auth.email")} type="email" autoComplete="email" required value={form.email} onChange={set("email")} error={fields.email} />
        <Field
          label={t("auth.password")}
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={set("password")}
          error={fields.password}
        />
        {error && !Object.keys(fields).length && <Notice tone="error">{errorText(error, t)}</Notice>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="submit" busy={busy}>
            {t("auth.loginButton")}
          </Button>
          <Link to="/forgot-password" className="text-[15px] text-haze hover:text-ink">
            {t("auth.forgot")}
          </Link>
        </div>
      </form>
      <GoogleSection />
    </AuthCard>
  );
};

export const Signup = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    DOB: "",
    gender: String(GenderEnum.MALE),
    password: "",
    confirmPassword: "",
  });

  const { run, busy, error, fields } = useSubmit(async () => {
    await auth.signup({ ...form, gender: Number(form.gender) });
    navigate(`/confirm-email?email=${encodeURIComponent(form.email)}`);
  });

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  return (
    <AuthCard
      title={t("auth.signupTitle")}
      lead={t("auth.signupLead")}
      footer={
        <>
          {t("auth.haveAccount")}{" "}
          <Link to="/login" className="text-ink underline underline-offset-4">
            {t("nav.login")}
          </Link>
        </>
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          run();
        }}
      >
        <Field label={t("auth.username")} hint={t("auth.usernameHint")} autoComplete="name" required value={form.username} onChange={set("username")} error={fields.username} />
        <Field label={t("auth.email")} type="email" autoComplete="email" required value={form.email} onChange={set("email")} error={fields.email} />
        <Field label={t("auth.phone")} hint={t("auth.phoneHint")} type="tel" dir="ltr" autoComplete="tel" required value={form.phone} onChange={set("phone")} error={fields.phone} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("auth.DOB")} type="date" required value={form.DOB} onChange={set("DOB")} error={fields.DOB} />
          <Field label={t("auth.gender")} as="select" value={form.gender} onChange={set("gender")} error={fields.gender}>
            <option value={GenderEnum.MALE}>{t("auth.male")}</option>
            <option value={GenderEnum.FEMALE}>{t("auth.female")}</option>
          </Field>
        </div>
        <Field
          label={t("auth.password")}
          hint={t("auth.passwordHint")}
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={set("password")}
          error={fields.password}
        />
        <Field
          label={t("auth.confirmPassword")}
          type="password"
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          onChange={set("confirmPassword")}
          error={fields.confirmPassword}
        />
        {error && !Object.keys(fields).length && <Notice tone="error">{errorText(error, t)}</Notice>}
        <Button type="submit" busy={busy} className="self-start">
          {t("auth.signupButton")}
        </Button>
      </form>
      <GoogleSection />
    </AuthCard>
  );
};

// shared by "confirm email" (after sign up) and "two-step verification" (after log in)
const OtpForm = ({ mode }) => {
  const { t } = useI18n();
  const toast = useToast();
  const { startSession } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [otp, setOtp] = useState("");

  const confirm = useSubmit(async () => {
    const body = { email, otp };
    const { data } = mode === "confirm" ? await auth.confirmEmail(body) : await auth.loginConfirmation(body);
    await startSession(data);
    navigate("/inbox", { replace: true });
  });

  const resend = useSubmit(async () => {
    const { message } = await auth.resendConfirmEmail(email);
    toast(message);
  });

  const confirmMode = mode === "confirm";
  const failure = confirm.error ?? resend.error;
  const fields = { ...resend.fields, ...confirm.fields };

  return (
    <AuthCard
      title={t(confirmMode ? "auth.confirmTitle" : "auth.verifyTitle")}
      lead={t(confirmMode ? "auth.confirmLead" : "auth.verifyLead", { email: email || "…" })}
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          confirm.run();
        }}
      >
        {!params.get("email") && (
          <Field label={t("auth.email")} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} error={fields.email} />
        )}
        <Field
          label={t("auth.otp")}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          dir="ltr"
          required
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
          error={fields.otp}
          className="[&_input]:text-center [&_input]:text-[22px] [&_input]:tracking-[0.5em]"
        />
        {failure && !Object.keys(fields).length && <Notice tone="error">{errorText(failure, t)}</Notice>}
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" busy={confirm.busy}>
            {t(confirmMode ? "auth.confirmButton" : "auth.verifyButton")}
          </Button>
          {confirmMode && (
            <Button type="button" variant="link" busy={resend.busy} disabled={!email} onClick={() => resend.run()}>
              {t("auth.resend")}
            </Button>
          )}
        </div>
      </form>
    </AuthCard>
  );
};

export const ConfirmEmail = () => <OtpForm mode="confirm" />;
export const LoginVerify = () => <OtpForm mode="verify" />;

export const ForgotPassword = () => {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { run, busy, error, fields } = useSubmit(async () => {
    await auth.forgotPassword(email);
    setSent(true);
  });

  return (
    <AuthCard
      title={t("auth.forgotTitle")}
      lead={t("auth.forgotLead")}
      footer={
        <Link to="/login" className="text-ink underline underline-offset-4">
          {t("auth.backToLogin")}
        </Link>
      }
    >
      {sent ? (
        <Notice tone="success">{t("auth.forgotSent")}</Notice>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            run();
          }}
        >
          <Field label={t("auth.email")} type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} error={fields.email} />
          {error && !Object.keys(fields).length && <Notice tone="error">{errorText(error, t)}</Notice>}
          <Button type="submit" busy={busy} className="self-start">
            {t("auth.forgotButton")}
          </Button>
        </form>
      )}
    </AuthCard>
  );
};

// the page the reset email links to: FRONTEND_URL/reset-password/<token>
export const ResetPassword = () => {
  const { t } = useI18n();
  const { token } = useParams();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [done, setDone] = useState(false);
  const { run, busy, error, fields } = useSubmit(async () => {
    await auth.resetPasswordFromLink(token, form);
    setDone(true);
  });
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  return (
    <AuthCard
      title={t("auth.resetTitle")}
      lead={t("auth.resetLead")}
      footer={
        <Link to="/login" className="text-ink underline underline-offset-4">
          {t("auth.backToLogin")}
        </Link>
      }
    >
      {done ? (
        <Notice tone="success">{t("auth.resetDone")}</Notice>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            run();
          }}
        >
          <Field
            label={t("auth.password")}
            hint={t("auth.passwordHint")}
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={set("password")}
            error={fields.password}
          />
          <Field
            label={t("auth.confirmPassword")}
            type="password"
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            error={fields.confirmPassword}
          />
          {/* an invalid or used token comes back as a params issue, show it as a general error */}
          {(fields.token || (error && !Object.keys(fields).length)) && (
            <Notice tone="error">{fields.token ?? errorText(error, t)}</Notice>
          )}
          <Button type="submit" busy={busy} className="self-start">
            {t("auth.resetButton")}
          </Button>
        </form>
      )}
    </AuthCard>
  );
};
