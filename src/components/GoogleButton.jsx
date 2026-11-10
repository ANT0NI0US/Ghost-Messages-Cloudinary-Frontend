import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const WIDTH = 320;

const loadScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? Object.assign(document.createElement("script"), { src: SCRIPT_SRC, async: true });
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
    if (!existing) document.head.append(script);
  });

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5Z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7Z" />
    <path fill="#FBBC05" d="M10.6 28.7A14.5 14.5 0 0 1 9.8 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.8l7.9-6.1Z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.5-5 2.3-8.2 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48Z" />
  </svg>
);

/*
  Google draws its button inside an iframe we can't style, so its hover looks wrong on our dark theme.
  Our own button is what people see (our colors, our hover in both themes); Google's real button sits
  exactly on top of it, fully transparent, and receives the click. onToken gets the id token the
  backend verifies (/auth/signup-with-gmail).
*/
export const GoogleButton = ({ onToken }) => {
  const container = useRef(null);
  const { t, lang } = useI18n();
  const [hovered, setHovered] = useState(false);
  const wrapper = useRef(null);

  /*
    The pointer on Google's cross-origin iframe is invisible to our page: no :hover, no mouseover.
    What we do see: the mouseout (relatedTarget null) at the moment the pointer goes into the iframe,
    and pointermoves again once it comes back out onto our page.
  */
  useEffect(() => {
    const within = (event) => {
      const rect = wrapper.current?.getBoundingClientRect();
      return Boolean(rect) && event.clientX >= rect.left - 4 && event.clientX <= rect.right + 4 && event.clientY >= rect.top - 4 && event.clientY <= rect.bottom + 4;
    };
    const onMove = (event) => setHovered(within(event));
    const onOut = (event) => {
      if (!event.relatedTarget) setHovered(within(event));
    };
    // most browsers also report the iframe element itself as the mouseover target in our page
    const onOver = (event) => {
      if (event.target.tagName === "IFRAME" && wrapper.current?.contains(event.target)) setHovered(true);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("mouseover", onOver);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("mouseover", onOver);
    };
  }, []);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !container.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => onToken(response.credential),
        });
        container.current.replaceChildren();
        window.google.accounts.id.renderButton(container.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          width: WIDTH,
          locale: lang,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lang, onToken]);

  if (!CLIENT_ID) return null;
  return (
    <div ref={wrapper} className="group relative mx-auto h-11 w-full max-w-[320px]">
      <span
        aria-hidden="true"
        data-hovered={hovered}
        className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 rounded-full border border-line bg-veil text-[15px] font-medium text-ink transition-colors data-[hovered=true]:border-ink data-[hovered=true]:bg-mist group-focus-within:outline-2 group-focus-within:outline-offset-2 group-focus-within:outline-glow"
      >
        <GoogleG />
        {t("auth.google")}
      </span>
      {/* Google's button: invisible but clickable, stretched over ours */}
      <div ref={container} className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full opacity-[0.01]" />
    </div>
  );
};

export const hasGoogle = Boolean(CLIENT_ID);
