import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { conversations, messages, requests } from "../api/endpoints.js";
import { useToast } from "../components/Toast.jsx";
import { Attachments, Avatar, Button, GhostMark, Loading, Notice, errorText } from "../components/ui.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { markOpened } from "../lib/opened.js";
import { useSubmit } from "../lib/useSubmit.js";

export const MessageDetail = () => {
  const { messageId } = useParams();
  const { t, formatDate } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [loadError, setLoadError] = useState(null);
  // "unknown" until we check: "chat" (a conversation exists), "none", "requested"
  const [chatState, setChatState] = useState("unknown");

  useEffect(() => {
    markOpened(messageId);
    messages
      .one(messageId)
      .then(({ data }) => {
        setMessage(data);
        if (!data.senderId) return;
        // a conversation exists only after the sender accepted a request
        conversations
          .messages(messageId)
          .then(() => setChatState("chat"))
          .catch(() => setChatState("none"));
      })
      .catch(setLoadError);
  }, [messageId]);

  const ask = useSubmit(async () => {
    try {
      await requests.create(messageId);
      setChatState("requested");
    } catch (error) {
      // already asked earlier: same outcome for the reader
      if (error.status === 400 && error.message) {
        setChatState("requested");
        return;
      }
      throw error;
    }
  });

  const remove = useSubmit(async () => {
    if (!window.confirm(t("message.confirmDelete"))) return;
    await messages.remove(messageId);
    toast(t("message.deleted"));
    navigate("/inbox");
  });

  if (loadError) return <Notice tone="error">{errorText(loadError, t)}</Notice>;
  if (!message) return <Loading />;

  const sender = message.senderId;
  const senderName = sender ? `${sender.firstName} ${sender.lastName}` : null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/inbox" className="text-[15px] text-haze hover:text-ink">
        {t("message.back")}
      </Link>

      <article className="mt-6 rounded-[28px] border border-line bg-veil p-6 sm:p-9">
        <header className="flex items-center gap-3">
          {sender ? (
            <Avatar user={sender} size={44} />
          ) : (
            <span className="flex size-11 items-center justify-center rounded-full bg-glow/25">
              <GhostMark size={26} />
            </span>
          )}
          <div>
            <p className="font-medium">{sender ? t("message.from", { name: senderName }) : t("message.anonymousFrom")}</p>
            <p className="text-[13px] text-haze">{formatDate(message.time)}</p>
          </div>
        </header>

        {message.content && <p className="mt-6 text-[20px] leading-relaxed whitespace-pre-wrap">{message.content}</p>}
        <Attachments items={message.attachments} />
      </article>

      <div className="mt-8 flex flex-col gap-4">
        {!sender && <p className="text-haze">{t("message.anonymousNote")}</p>}

        {sender && chatState === "chat" && (
          <Link to={`/chat/${messageId}`} className="self-start rounded-full bg-ink px-5 py-2.5 font-medium text-on-ink hover:bg-ink-soft">
            {t("message.openChat")}
          </Link>
        )}
        {sender && chatState === "none" && (
          <div className="flex flex-col items-start gap-2">
            <Button variant="glow" busy={ask.busy} onClick={() => ask.run()}>
              {t("message.askChat")}
            </Button>
            <p className="text-[14px] text-haze">{t("message.askChatHint", { name: sender.firstName })}</p>
          </div>
        )}
        {sender && chatState === "requested" && <Notice tone="success">{t("message.requested", { name: sender.firstName })}</Notice>}
        {ask.error && <Notice tone="error">{errorText(ask.error, t)}</Notice>}

        <div className="mt-6 border-t border-line pt-6">
          <Button variant="danger" busy={remove.busy} onClick={() => remove.run()}>
            {t("message.delete")}
          </Button>
          {remove.error && <div className="mt-3"><Notice tone="error">{errorText(remove.error, t)}</Notice></div>}
        </div>
      </div>
    </div>
  );
};
