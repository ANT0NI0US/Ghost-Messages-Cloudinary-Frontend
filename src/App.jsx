import { Link, Route, Routes } from "react-router-dom";
import { GuestOnly, RequireAuth } from "./auth/RequireAuth.jsx";
import { AppShell } from "./components/AppShell.jsx";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { Admin } from "./pages/Admin.jsx";
import { ConfirmEmail, ForgotPassword, Login, LoginVerify, ResetPassword, Signup } from "./pages/Auth.jsx";
import { Chat } from "./pages/Chat.jsx";
import { Inbox } from "./pages/Inbox.jsx";
import { Landing } from "./pages/Landing.jsx";
import { MessageDetail } from "./pages/MessageDetail.jsx";
import { PublicProfile } from "./pages/PublicProfile.jsx";
import { Requests } from "./pages/Requests.jsx";
import { Settings } from "./pages/Settings.jsx";

const NotFound = () => {
  const { t } = useI18n();
  return (
    <div className="py-16">
      <h1 className="font-[family-name:var(--font-display)] text-[44px] font-normal">{t("common.notFoundTitle")}</h1>
      <Link to="/" className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-on-ink">
        {t("common.home")}
      </Link>
    </div>
  );
};

const guest = (page) => <GuestOnly>{page}</GuestOnly>;
const signedIn = (page) => <RequireAuth>{page}</RequireAuth>;

export const App = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route index element={guest(<Landing />)} />
      <Route path="login" element={guest(<Login />)} />
      <Route path="login/verify" element={guest(<LoginVerify />)} />
      <Route path="signup" element={guest(<Signup />)} />
      <Route path="confirm-email" element={guest(<ConfirmEmail />)} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      {/* the backend emails FRONTEND_URL/reset-password/<token> */}
      <Route path="reset-password/:token" element={<ResetPassword />} />
      <Route path="u/:userId" element={<PublicProfile />} />

      <Route path="inbox" element={signedIn(<Inbox />)} />
      <Route path="messages/:messageId" element={signedIn(<MessageDetail />)} />
      <Route path="requests" element={signedIn(<Requests />)} />
      <Route path="chat/:messageId" element={signedIn(<Chat />)} />
      <Route path="settings" element={signedIn(<Settings />)} />
      <Route
        path="admin"
        element={
          <RequireAuth admin>
            <Admin />
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);
