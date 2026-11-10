import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { conversations, messages } from "../api/endpoints.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { Attachments, Button, FilePicker, Loading, Notice, PageTitle, errorText } from "../components/ui.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { useSubmit } from "../lib/useSubmit.js";

// the conversation that opens on a message once its sender accepted the request
export const Chat = () => {
  const { messageId } = useParams();
  const { t, formatDate } = useI18n();
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const end = useRef(null);

  const load = useCallback(
    () =>
      conversations
        .messages(messageId)
        .then(({ data }) => setThread(data))
        .catch(setLoadError),
    [messageId],
  );

  const [origin, setOrigin] = useState(null);

  useEffect(() => {
    load();
    // only the receiver can read the original message; for the sender this quietly stays empty
    messages
      .one(messageId)
      .then(({ data }) => setOrigin(data))
      .catch(() => {});
  }, [load, messageId]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [thread]);

  const reply = useSubmit(async () => {
    await conversations.reply({ messageId, content: content.trim() || undefined, files });
    setContent("");
    setFiles([]);
    await load();
  });

  if (loadError) return <Notice tone="error">{loadError.status === 404 ? t("chat.notFound") : errorText(loadError, t)}</Notice>;
  if (!thread) return <Loading />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <PageTitle title={t("chat.title")} />

      {origin?.content && (
        <figure className="mb-8 border-s-2 border-glow ps-4">
          <figcaption className="text-[13px] text-haze">{t("chat.about")}</figcaption>
          <blockquote className="mt-1 text-[17px] leading-relaxed">{origin.content}</blockquote>
        </figure>
      )}

      {thread.length === 0 && <p className="text-haze">{t("chat.empty")}</p>}
      <ol className="flex flex-col gap-3">
        {thread.map((entry) => {
          const mine = entry.senderId?._id === user._id;
          return (
            <li key={entry._id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[85%] rounded-[20px] px-4 py-3 ${
                  mine ? "rounded-ee-md bg-ink text-on-ink" : "rounded-es-md border border-line bg-veil"
                }`}
              >
                {entry.content && <p className="whitespace-pre-wrap">{entry.content}</p>}
                <Attachments items={entry.attachments} />
              </div>
              <span className="mt-1 px-1 text-[12px] text-haze">
                {mine ? t("chat.you") : entry.senderId?.firstName ?? t("inbox.anonymous")} {formatDate(entry.time)}
              </span>
            </li>
          );
        })}
      </ol>
      <div ref={end} />

      <form
        className="sticky bottom-0 mt-8 flex flex-col gap-3 border-t border-line bg-mist pt-4 pb-4"
        onSubmit={(event) => {
          event.preventDefault();
          reply.run();
        }}
      >
        <textarea
          aria-label={t("chat.placeholder")}
          placeholder={t("chat.placeholder")}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={2}
          className="w-full resize-none rounded-2xl border border-line bg-veil px-4 py-3 focus:border-ink focus:outline-none"
        />
        {(reply.fields.content || reply.error) && (
          <p className="text-[13px] text-alert">{reply.fields.content ?? errorText(reply.error, t)}</p>
        )}
        <div className="flex items-center justify-between gap-3">
          <FilePicker files={files} onChange={setFiles} label={t("profile.attach")} />
          <Button type="submit" busy={reply.busy}>
            {t("chat.send")}
          </Button>
        </div>
      </form>
    </div>
  );
};
