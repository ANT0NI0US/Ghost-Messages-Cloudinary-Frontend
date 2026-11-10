import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { requests } from "../api/endpoints.js";
import { useToast } from "../components/Toast.jsx";
import { Avatar, Button, Loading, Notice, PageTitle, Pagination, Tabs, errorText } from "../components/ui.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { ActionInRequestEnum, RequestStatusEnum, RequestsTypeEnum } from "../lib/enums.js";

const statusLabel = {
  [RequestStatusEnum.PENDING]: "requests.statusPending",
  [RequestStatusEnum.ACCEPTED]: "requests.statusAccepted",
  [RequestStatusEnum.REJECTED]: "requests.statusRejected",
};

export const Requests = () => {
  const { t, formatDate } = useI18n();
  const toast = useToast();
  const [type, setType] = useState(RequestsTypeEnum.PENDING);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(null);

  useEffect(() => {
    setResult(null);
    setError(null);
    requests
      .all({ type, page, limit: 10 })
      .then(({ data }) => setResult(data))
      .catch(setError);
  }, [type, page]);

  const act = async (request, action) => {
    setActing(request._id);
    try {
      const { message, data } = await requests.act(request._id, action);
      toast(message);
      setResult((current) => ({
        ...current,
        docs: current.docs.map((item) => (item._id === request._id ? { ...item, status: data.status } : item)),
      }));
    } catch (caught) {
      toast(errorText(caught, t), "error");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageTitle title={t("requests.title")} lead={t("requests.lead")} />
      <Tabs
        label={t("requests.title")}
        value={type}
        onChange={(value) => {
          setType(value);
          setPage(1);
        }}
        options={[
          { value: RequestsTypeEnum.PENDING, label: t("requests.pending") },
          { value: RequestsTypeEnum.ACCEPTED, label: t("requests.accepted") },
          { value: RequestsTypeEnum.REJECTED, label: t("requests.rejected") },
          { value: RequestsTypeEnum.ALL, label: t("requests.all") },
        ]}
      />

      <div className="mt-8">
        {error && <Notice tone="error">{errorText(error, t)}</Notice>}
        {!error && !result && <Loading />}
        {result?.docs.length === 0 && <p className="text-haze">{t("requests.empty")}</p>}

        <ul className="divide-y divide-line">
          {result?.docs.map((request) => {
            const requester = request.requesterId;
            const name = requester ? `${requester.firstName} ${requester.lastName}` : t("inbox.anonymous");
            return (
              <li key={request._id} className="flex flex-wrap items-center gap-4 py-5">
                <Avatar user={requester} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t("requests.wantsToChat", { name })}</p>
                  <p className="text-[13px] text-haze">
                    {formatDate(request.createdAt)} <span className="mx-1 text-line">|</span> {t(statusLabel[request.status])}
                  </p>
                </div>
                {request.status === RequestStatusEnum.PENDING && (
                  <div className="flex gap-2">
                    <Button variant="glow" busy={acting === request._id} onClick={() => act(request, ActionInRequestEnum.ACCEPTED)}>
                      {t("requests.accept")}
                    </Button>
                    <Button variant="quiet" disabled={acting === request._id} onClick={() => act(request, ActionInRequestEnum.REJECTED)}>
                      {t("requests.reject")}
                    </Button>
                  </div>
                )}
                {request.status === RequestStatusEnum.ACCEPTED && (
                  <Link to={`/chat/${request.messageId}`} className="rounded-full bg-ink px-5 py-2.5 font-medium text-on-ink hover:bg-ink-soft">
                    {t("requests.openChat")}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
        <Pagination data={result} onPage={setPage} />
      </div>
    </div>
  );
};
