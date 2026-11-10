import { Link } from "react-router-dom";
import { LanternHero } from "../components/LanternHero.jsx";
import { VeiledMessage } from "../components/VeiledMessage.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";

export const Landing = () => {
  const { t } = useI18n();
  const steps = t("landing.steps");

  return (
    <div className="-mt-6 flex flex-col gap-24 pb-10">
      <LanternHero>
        <div className="max-w-2xl">
          <h1 className="font-[family-name:var(--font-display)] text-[54px] leading-[1.05] font-normal sm:text-[84px]">
            {t("landing.title")}
          </h1>
          <p className="mt-5 max-w-lg text-[18px] text-[#d8d2ee]">{t("landing.lead")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup" className="rounded-full bg-[#6fe3c1] px-6 py-3 font-medium text-[#120e24] hover:brightness-95">
              {t("landing.primary")}
            </Link>
            <Link to="/login" className="rounded-full border border-[#4a4170] px-6 py-3 font-medium text-[#f1eefa] hover:border-[#f1eefa]">
              {t("landing.secondary")}
            </Link>
          </div>
        </div>
      </LanternHero>

      <section className="grid items-start gap-12 md:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-[38px] leading-tight font-normal">{t("landing.howTitle")}</h2>
          {/* a real sequence: share, read, talk */}
          <ol className="mt-8 flex flex-col gap-7">
            {steps.map((step, index) => (
              <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-x-3">
                <span className="font-[family-name:var(--font-display)] text-[28px] leading-none text-haze">{index + 1}</span>
                <div>
                  <h3 className="text-[19px] font-medium">{step.title}</h3>
                  <p className="mt-1 text-haze">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* the same component the inbox uses: tap it to lift the veil */}
        <div className="md:pt-16">
          <VeiledMessage name={t("landing.demoName")} text={t("landing.demoText")} />
        </div>
      </section>
    </div>
  );
};
