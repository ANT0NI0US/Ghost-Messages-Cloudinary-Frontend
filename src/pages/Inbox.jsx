import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { messages } from "../api/endpoints.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { CopyLink } from "../components/CopyLink.jsx";
import { VeiledMessage } from "../components/VeiledMessage.jsx";
import { Button, Loading, Notice, PageTitle, Pagination, Tabs, errorText } from "../components/ui.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { MessageTypeEnum } from "../lib/enums.js";
import { isOpened, markOpened } from "../lib/opened.js";

const fullName = (person) => [person?.firstName, person?.lastName].filter(Boolean).join(" ");

export const Inbox = () => {
  const { t, formatDate } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState(MessageTypeEnum.RECEIVER);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setResult(null);
    setError(null);
    messages
      .all({ type, page, limit: 8 })
      .then(({ data }) => setResult(data))
      .catch(setError);
  }, [type, page, attempt]);

  const changeType = (value) => {
    setType(value);
    setPage(1);
  };

  const received = type === MessageTypeEnum.RECEIVER;

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0">
        <PageTitle title={t("inbox.title")}>
          <Tabs
            label={t("inbox.title")}
            value={type}
            onChange={changeType}
            options={[
              { value: MessageTypeEnum.RECEIVER, label: t("inbox.received") },
              { value: MessageTypeEnum.SENDER, label: t("inbox.sent") },
            ]}
          />
        </PageTitle>

        {error && (
          <div className="flex flex-col items-start gap-3">
            <Notice tone="error">{errorText(error, t)}</Notice>
            <Button variant="quiet" onClick={() => setAttempt((n) => n + 1)}>
              {t("common.retry")}
            </Button>
          </div>
        )}
        {!error && !result && <Loading />}

        {result && result.docs.length === 0 && (
          <p className="max-w-md text-[17px] text-haze">{t(received ? "inbox.emptyReceived" : "inbox.emptySent")}</p>
        )}

        {result && result.docs.length > 0 && (
          <ul className="flex flex-col gap-4">
            {result.docs.map((message) => {
              const files = message.attachments?.length ?? 0;
              const meta = formatDate(message.time);
              const footer = files ? (
                <span className="mt-4 flex items-center gap-1.5 text-[13px] text-haze">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M21.4 11.1 12.2 20.3a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />
                  </svg>
                  {t("inbox.attachments", { count: files })}
                </span>
              ) : null;
              return (
                <li key={message._id}>
                  {received ? (
                    <VeiledMessage
                      name={message.senderId ? fullName(message.senderId) : t("inbox.anonymous")}
                      text={message.content || t("inbox.attachments", { count: files })}
                      meta={meta}
                      footer={footer}
                      revealed={isOpened(message._id)}
                      showHint={false}
                      onReveal={() => {
                        markOpened(message._id);
                        navigate(`/messages/${message._id}`);
                      }}
                    />
                  ) : (
                    // your own sent messages have nothing to hide
                    <VeiledMessage
                      name={t("inbox.to", { name: fullName(message.receiverId) || "—" })}
                      text={message.content || t("inbox.attachments", { count: files })}
                      meta={meta}
                      footer={footer}
                      revealed
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <Pagination data={result} onPage={setPage} />
      </div>

      <aside className="flex min-w-0 flex-col gap-3 lg:pt-24">
        <h2 className="text-[17px] font-medium">{t("inbox.shareTitle")}</h2>
        <CopyLink userId={user._id} />
      </aside>
    </div>
  );
};
