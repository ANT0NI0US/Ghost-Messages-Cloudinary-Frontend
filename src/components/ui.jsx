import { useId, useState } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";

// the backend already translates its messages (accept-language), so they are shown as they come
export const errorText = (error, t) =>
  error?.message === "network" || !error?.message ? t("common.networkError") : error.message;

const buttonStyles = {
  primary: "bg-ink text-on-ink hover:bg-ink-soft",
  quiet: "bg-transparent text-ink border border-line hover:border-ink",
  glow: "bg-glow text-[#15112a] hover:brightness-95",
  danger: "bg-transparent text-alert border border-alert/40 hover:border-alert",
  link: "bg-transparent text-ink underline underline-offset-4 decoration-line hover:decoration-ink px-0 py-0",
};

// type defaults to "button" so a button inside a form never submits it by accident; submit buttons say so
export const Button = ({ variant = "primary", busy = false, className = "", children, disabled, type = "button", ...props }) => (
  <button
    {...props}
    type={type}
    disabled={disabled || busy}
    aria-busy={busy || undefined}
    className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${buttonStyles[variant]} ${className}`}
  >
    {busy && <Spinner small />}
    {children}
  </button>
);

export const Spinner = ({ small = false }) => (
  <span
    aria-hidden="true"
    className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${small ? "size-4" : "size-6"}`}
  />
);

export const Loading = () => {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 py-16 text-haze" role="status">
      <Spinner /> {t("common.loading")}
    </div>
  );
};

const inputStyles =
  "w-full rounded-xl border border-line bg-veil px-4 py-3 text-[15px] text-ink placeholder:text-haze/70 transition-colors focus:border-ink focus:outline-none aria-[invalid=true]:border-alert";

const EyeIcon = ({ crossed }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {crossed && <path d="M3 3l18 18" />}
  </svg>
);

export const Field = ({ label, hint, error, as = "input", children, className = "", type, ...props }) => {
  const id = useId();
  const { t } = useI18n();
  const [shown, setShown] = useState(false);
  const Tag = as;
  const isPassword = type === "password";

  const control = (
    <Tag
      id={id}
      type={isPassword && shown ? "text" : type}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error || hint ? `${id}-note` : undefined}
      className={`${inputStyles} ${as === "textarea" ? "min-h-36 resize-y leading-relaxed" : ""} ${isPassword ? "pe-12" : ""}`}
      {...props}
    >
      {children}
    </Tag>
  );

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {isPassword ? (
        <div className="relative">
          {control}
          <button
            type="button"
            onClick={() => setShown((value) => !value)}
            aria-label={t(shown ? "auth.hidePassword" : "auth.showPassword")}
            aria-pressed={shown}
            className="absolute inset-y-0 end-0 flex w-12 items-center justify-center rounded-e-xl text-haze hover:text-ink"
          >
            <EyeIcon crossed={shown} />
          </button>
        </div>
      ) : (
        control
      )}
      {(error || hint) && (
        <p id={`${id}-note`} className={`text-[13px] ${error ? "text-alert" : "text-haze"}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
};

export const Notice = ({ tone = "info", children }) => {
  const tones = {
    info: "border-line bg-veil text-ink",
    success: "border-glow bg-glow/15 text-glow-ink",
    error: "border-alert/40 bg-alert/8 text-alert",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-[14px] ${tones[tone]}`}>
      {children}
    </div>
  );
};

// segmented control for the list filters (received / sent, pending / accepted ...)
export const Tabs = ({ value, onChange, options, label }) => (
  <div role="tablist" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-veil p-1">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        role="tab"
        aria-selected={value === option.value}
        onClick={() => onChange(option.value)}
        className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
          value === option.value ? "bg-ink text-on-ink" : "text-haze hover:text-ink"
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export const Pagination = ({ data, onPage }) => {
  const { t } = useI18n();
  if (!data || data.totalPages <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-between gap-4 text-sm text-haze">
      <Button variant="quiet" disabled={!data.hasPreviousPage} onClick={() => onPage(data.currentPage - 1)}>
        {t("inbox.prev")}
      </Button>
      <span>{t("inbox.page", { page: data.currentPage, total: data.totalPages })}</span>
      <Button variant="quiet" disabled={!data.hasNextPage} onClick={() => onPage(data.currentPage + 1)}>
        {t("inbox.next")}
      </Button>
    </nav>
  );
};

export const Avatar = ({ user, size = 40 }) => {
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("");
  if (user?.image?.secure_url) {
    return (
      <img
        src={user.image.secure_url}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-ink text-on-ink font-medium"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials || <GhostMark size={size * 0.55} inverted />}
    </span>
  );
};

export const GhostMark = ({ size = 28, inverted = false }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
    <path
      d="M32 6C19.3 6 10 15.6 10 28.5V56l7-5 7.5 5L32 51l7.5 5L47 51l7 5V28.5C54 15.6 44.7 6 32 6Z"
      fill={inverted ? "var(--on-ink)" : "var(--ink)"}
    />
    <circle cx="24.5" cy="29" r="4" fill={inverted ? "var(--glow)" : "var(--ghost-eye)"} />
    <circle cx="39.5" cy="29" r="4" fill={inverted ? "var(--glow)" : "var(--ghost-eye)"} />
  </svg>
);

export const Attachments = ({ items = [] }) => {
  if (!items.length) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-3">
      {items.map((file) => {
        const isPdf = file.secure_url?.toLowerCase().endsWith(".pdf");
        return (
          <li key={file.public_id}>
            <a href={file.secure_url} target="_blank" rel="noreferrer" className="block">
              {isPdf ? (
                <span className="flex h-24 w-20 items-center justify-center rounded-lg border border-line bg-mist text-xs font-medium text-haze">
                  PDF
                </span>
              ) : (
                <img src={file.secure_url} alt="" className="h-24 w-24 rounded-lg border border-line object-cover" />
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

// a native file picker styled as a button, listing the picked files with a remove action
export const FilePicker = ({ files, onChange, max = 10, accept = "image/jpeg,image/png,application/pdf", label, hint, error }) => {
  const id = useId();
  const { t } = useI18n();
  const add = (event) => {
    onChange([...files, ...Array.from(event.target.files)].slice(0, max));
    event.target.value = "";
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={id}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-ink focus-within:outline-2 focus-within:outline-glow"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21.4 11.1 12.2 20.3a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />
          </svg>
          {label}
          <input id={id} type="file" multiple={max > 1} accept={accept} onChange={add} className="sr-only" />
        </label>
        {hint && <span className="text-[13px] text-haze">{hint}</span>}
      </div>
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-full bg-mist px-3 py-1 text-[13px]">
              <span className="max-w-44 truncate">{file.name}</span>
              <button
                type="button"
                className="text-haze hover:text-alert"
                aria-label={`${t("common.remove")} ${file.name}`}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-[13px] text-alert">{error}</p>}
    </div>
  );
};

export const PageTitle = ({ title, lead, children }) => (
  <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div className="max-w-xl">
      <h1 className="font-[family-name:var(--font-display)] text-[40px] leading-tight font-normal">{title}</h1>
      {lead && <p className="mt-2 text-haze">{lead}</p>}
    </div>
    {children}
  </header>
);
