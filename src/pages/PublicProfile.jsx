import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { messages, users } from "../api/endpoints.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { CopyLink } from "../components/CopyLink.jsx";
import { Avatar, Button, Field, FilePicker, Loading, Notice, Tabs, errorText } from "../components/ui.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { useSubmit } from "../lib/useSubmit.js";

// the page behind someone's shared link: anyone can write here, signed in or not
export const PublicProfile = () => {
  const { userId } = useParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const [owner, setOwner] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [named, setNamed] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setOwner(null);
    setLoadError(null);
    users
      .publicProfile(userId)
      .then(({ data }) => setOwner(data))
      .catch(setLoadError);
  }, [userId]);

  const { run, busy, error, fields } = useSubmit(async () => {
    await messages.send({ receiverId: userId, content: content.trim() || undefined, files, named: Boolean(user && named) });
    setSent(true);
    setContent("");
    setFiles([]);
  });

  if (loadError) return <Notice tone="error">{loadError.status === 404 || loadError.status === 400 ? t("profile.notFound") : errorText(loadError, t)}</Notice>;
  if (!owner) return <Loading />;

  const name = owner.firstName;
  const isOwn = user?._id === owner._id;
  const cover = owner.coverImages?.[0]?.secure_url;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative">
        <div className="h-44 overflow-hidden rounded-[28px] border border-line bg-ink sm:h-56">
          {cover ? (
            <img src={cover} alt="" className="size-full object-cover" />
          ) : (
            <div aria-hidden="true" className="lantern size-full [--x:75%] [--y:30%]">
              <div className="lantern-glow size-full" />
            </div>
          )}
        </div>
        <div className="-mt-12 flex items-end gap-4 px-5">
          <span className="rounded-full border-4 border-mist">
            <Avatar user={owner} size={96} />
          </span>
          <h1 className="pb-2 font-[family-name:var(--font-display)] text-[34px] leading-tight font-normal">
            {owner.firstName} {owner.lastName}
          </h1>
        </div>
      </div>

      {isOwn && (
        <div className="mt-8 flex flex-col gap-3">
          <Notice>{t("profile.ownLink")}</Notice>
          <CopyLink userId={owner._id} />
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-[22px] font-medium">{t("profile.sendTitle", { name })}</h2>
        <p className="mt-1 text-haze">{t("profile.sendLead", { name })}</p>

        {sent ? (
          <div className="mt-6 flex flex-col items-start gap-4">
            <Notice tone="success">{t("profile.sent", { name })}</Notice>
            <Button variant="quiet" onClick={() => setSent(false)}>
              {t("profile.sendAnother")}
            </Button>
          </div>
        ) : (
          <form
            className="mt-6 flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              run();
            }}
          >
            <Field
              as="textarea"
              label={t("profile.sendTitle", { name })}
              className="[&>label]:sr-only"
              placeholder={t("profile.placeholder")}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              error={fields.content}
            />
            <FilePicker files={files} onChange={setFiles} label={t("profile.attach")} hint={t("profile.attachHint")} error={fields.files} />
            {error && !Object.keys(fields).length && <Notice tone="error">{errorText(error, t)}</Notice>}
            <div className="flex flex-wrap items-center gap-4">
              {user && !isOwn && (
                <Tabs
                  label={t("profile.sendAnon")}
                  value={named}
                  onChange={setNamed}
                  options={[
                    { value: false, label: t("profile.sendAnon") },
                    { value: true, label: t("profile.sendNamed") },
                  ]}
                />
              )}
              <Button type="submit" busy={busy} className="ms-auto">
                {t("profile.sendButton")}
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};
