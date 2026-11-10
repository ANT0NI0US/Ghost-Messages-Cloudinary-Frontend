import { useState } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { GhostMark } from "./ui.jsx";

/*
  A message that arrives behind a veil. The text is blurred until the reader opens it.
  The whole card is the control; onReveal runs on open (e.g. to go to the message page).
  Without onReveal and once revealed, it is plain content (sent messages).
*/
export const VeiledMessage = ({ name, text, meta, revealed: initiallyRevealed = false, onReveal, footer, showHint = true }) => {
  const { t } = useI18n();
  const [revealed, setRevealed] = useState(initiallyRevealed);
  const interactive = Boolean(onReveal) || !revealed;

  const reveal = () => {
    if (!revealed) setRevealed(true);
    onReveal?.();
  };

  // still veiled: a raised card ringed in glow; already read: a quiet row that steps back
  const shell = revealed
    ? "rounded-[22px] border border-transparent px-5 py-4 sm:px-6"
    : "rounded-[22px] border border-glow/70 bg-veil p-5 shadow-[0_18px_40px_-28px_rgba(14,92,73,0.55)] sm:p-6";

  const body = (
    <>
      <span className="flex items-center gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${revealed ? "bg-veil" : "bg-glow/25"}`}>
          <GhostMark size={24} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium">{name}</span>
          {meta && <span className="block text-[13px] text-haze">{meta}</span>}
        </span>
        {!revealed && <span className="ms-auto size-2.5 shrink-0 rounded-full bg-glow" aria-hidden="true" />}
      </span>

      <span className="veil-text mt-4 line-clamp-4 block text-[17px] leading-relaxed" data-revealed={revealed}>
        {text}
      </span>
      {!revealed && showHint && (
        <span className="mt-3 inline-block rounded-full border border-line px-3 py-1 text-[13px] text-haze">{t("landing.demoHint")}</span>
      )}
      {footer}
    </>
  );

  return (
    <article className={shell}>
      {interactive ? (
        <button
          type="button"
          onClick={reveal}
          aria-label={revealed ? undefined : `${name}: ${t("landing.demoHint")}`}
          className={`block w-full text-start ${revealed ? "rounded-xl hover:opacity-80" : ""}`}
        >
          {body}
        </button>
      ) : (
        <div>{body}</div>
      )}
    </article>
  );
};
