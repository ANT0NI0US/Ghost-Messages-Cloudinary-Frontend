import { useEffect, useRef } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";

// hand-placed so the room never looks like a grid: [left %, top %, rotation deg, size px]
// they stay in the upper part of the room; the headline owns the bottom
const spots = [
  [5, 4, -4, 19],
  [55, 2, 3, 17],
  [28, 17, -2, 22],
  [70, 20, 5, 18],
  [3, 33, 2, 17],
  [44, 37, -5, 20],
  [76, 43, -2, 17],
  [16, 50, 4, 18],
  [58, 55, 1, 16],
];

const Fragments = ({ items }) =>
  items.map((text, index) => {
    const [left, top, rotate, size] = spots[index % spots.length];
    return (
      <p
        key={text}
        // a phone-width room holds only the first five
        className={`absolute max-w-[17rem] leading-snug ${index >= 5 ? "max-sm:hidden" : ""}`}
        style={{ insetInlineStart: `${left}%`, top: `${top}%`, rotate: `${rotate}deg`, fontSize: size }}
      >
        “{text}”
      </p>
    );
  });

/*
  A dark room full of anonymous messages. The pointer (or finger) is a lantern that brings
  the ones under it into focus. Until someone moves, the light drifts on its own; with
  reduced motion it stays still in the middle.
*/
export const LanternHero = ({ children }) => {
  const { t } = useI18n();
  const room = useRef(null);
  const fragments = t("landing.fragments");

  useEffect(() => {
    const node = room.current;
    if (!node) return;
    const place = (x, y) => {
      node.style.setProperty("--x", `${x}px`);
      node.style.setProperty("--y", `${y}px`);
    };

    let frame;
    let drifting = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const drift = (now) => {
      if (!drifting) return;
      const { width, height } = node.getBoundingClientRect();
      const time = (now - start) / 1000;
      place(width * (0.5 + 0.32 * Math.sin(time * 0.45)), height * (0.5 + 0.28 * Math.sin(time * 0.7 + 1)));
      frame = requestAnimationFrame(drift);
    };
    frame = requestAnimationFrame(drift);

    const follow = (event) => {
      drifting = false;
      const rect = node.getBoundingClientRect();
      place(event.clientX - rect.left, event.clientY - rect.top);
    };
    node.addEventListener("pointermove", follow);
    node.addEventListener("pointerdown", follow);
    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener("pointermove", follow);
      node.removeEventListener("pointerdown", follow);
    };
  }, []);

  return (
    <section
      ref={room}
      className="lantern relative isolate -mx-4 overflow-hidden px-6 py-16 sm:-mx-6 sm:rounded-[36px] sm:px-12 sm:py-20"
      style={{ touchAction: "pan-y" }}
    >
      <div aria-hidden="true" className="lantern-glow pointer-events-none absolute inset-0" />
      {/* the messages fade out before they reach the headline */}
      <div aria-hidden="true" className="lantern-fade pointer-events-none absolute inset-0 select-none">
        <div className="lantern-dim absolute inset-0">
          <Fragments items={fragments} />
        </div>
        <div className="lantern-lit absolute inset-0 text-[#f1eefa]">
          <Fragments items={fragments} />
        </div>
      </div>

      <div className="relative flex min-h-[560px] flex-col justify-end sm:min-h-[620px]">{children}</div>
      <p className="relative mt-6 text-[14px] text-[#a39dbb]">{t("landing.lanternHint")}</p>
    </section>
  );
};
