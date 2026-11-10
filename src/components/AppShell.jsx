import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { read, write } from "../lib/storage.js";
import { GhostMark } from "./ui.jsx";

const ThemeToggle = () => {
  const { t } = useI18n();
  const [theme, setTheme] = useState(() => read("gm.theme"));

  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
    write("gm.theme", theme);
  }, [theme]);

  const toggle = () => {
    const systemDark = matchMedia("(prefers-color-scheme: dark)").matches;
    const current = theme ?? (systemDark ? "dark" : "light");
    setTheme(current === "dark" ? "light" : "dark");
  };

  return (
    <button onClick={toggle} aria-label={t("nav.theme")} className="rounded-full p-2 text-haze hover:text-ink">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    </button>
  );
};

const navClass = ({ isActive }) =>
  `rounded-full px-3 py-1.5 text-[15px] transition-colors ${isActive ? "bg-veil text-ink" : "text-haze hover:text-ink"}`;

export const AppShell = () => {
  const { user, isAdmin, logout } = useAuth();
  const { t, toggleLang } = useI18n();
  const navigate = useNavigate();

  const signOut = async () => {
    await logout().catch(() => {});
    navigate("/");
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:gap-x-6 sm:px-6">
          <Link to={user ? "/inbox" : "/"} className="flex items-center gap-2 font-semibold tracking-tight">
            <GhostMark size={30} />
            <span className="hidden text-[17px] min-[400px]:inline">{t("app.name")}</span>
          </Link>

          {user && (
            <nav className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
              <NavLink to="/inbox" className={navClass}>
                {t("nav.inbox")}
              </NavLink>
              <NavLink to="/requests" className={navClass}>
                {t("nav.requests")}
              </NavLink>
              <NavLink to={`/u/${user._id}`} className={navClass}>
                {t("nav.myLink")}
              </NavLink>
              <NavLink to="/settings" className={navClass}>
                {t("nav.settings")}
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className={navClass}>
                  {t("nav.admin")}
                </NavLink>
              )}
            </nav>
          )}

          <div className="ms-auto flex items-center gap-1">
            <button onClick={toggleLang} className="rounded-full px-3 py-1.5 text-[15px] text-haze hover:text-ink">
              {t("nav.language")}
            </button>
            <ThemeToggle />
            {user ? (
              <button onClick={signOut} className="rounded-full px-3 py-1.5 text-[15px] text-haze hover:text-ink">
                {t("nav.logout")}
              </button>
            ) : (
              <Link to="/login" className="rounded-full px-3 py-1.5 text-[15px] text-ink hover:underline">
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
};
