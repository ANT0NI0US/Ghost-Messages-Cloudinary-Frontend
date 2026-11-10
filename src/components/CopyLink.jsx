import { useToast } from "./Toast.jsx";
import { Button } from "./ui.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";

export const profileLink = (userId) => `${window.location.origin}/u/${userId}`;

export const CopyLink = ({ userId }) => {
  const { t } = useI18n();
  const toast = useToast();
  const link = profileLink(userId);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast(t("inbox.copied"));
    } catch {
      // clipboard blocked: the link is selectable in the box
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-veil p-2 ps-4">
      <span dir="ltr" className="min-w-0 flex-1 truncate text-[15px] text-haze select-all">
        {link}
      </span>
      <Button variant="glow" onClick={copy}>
        {t("inbox.copy")}
      </Button>
    </div>
  );
};
