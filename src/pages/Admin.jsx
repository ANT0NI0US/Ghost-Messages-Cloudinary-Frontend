import { useEffect, useState } from "react";
import { users } from "../api/endpoints.js";
import { useToast } from "../components/Toast.jsx";
import { Avatar, Button, Loading, Notice, PageTitle, Pagination, Tabs, errorText } from "../components/ui.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { AccountStatusEnum, ProviderEnum, UsersByAccountStatusEnum } from "../lib/enums.js";

export const Admin = () => {
  const { t, formatDate } = useI18n();
  const toast = useToast();
  const [type, setType] = useState(UsersByAccountStatusEnum.ALL);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setResult(null);
    setError(null);
    users
      .all({ type, page, limit: 10 })
      .then(({ data }) => setResult(data))
      .catch(setError);
  }, [type, page, reload]);

  const run = async (userId, action) => {
    setActing(userId);
    try {
      const { message } = await action();
      toast(message);
      setReload((n) => n + 1);
    } catch (caught) {
      toast(errorText(caught, t), "error");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="max-w-4xl">
      <PageTitle title={t("admin.title")} lead={t("admin.lead")} />
      <Tabs
        label={t("admin.title")}
        value={type}
        onChange={(value) => {
          setType(value);
          setPage(1);
        }}
        options={[
          { value: UsersByAccountStatusEnum.ALL, label: t("admin.all") },
          { value: UsersByAccountStatusEnum.ACTIVE, label: t("admin.active") },
          { value: UsersByAccountStatusEnum.ARCHIVE, label: t("admin.archived") },
        ]}
      />

      <div className="mt-8">
        {error && <Notice tone="error">{errorText(error, t)}</Notice>}
        {!error && !result && <Loading />}
        {result?.docs.length === 0 && <p className="text-haze">{t("admin.empty")}</p>}

        <ul className="divide-y divide-line">
          {result?.docs.map((person) => {
            const archived = person.status === AccountStatusEnum.ARCHIVE;
            const name = `${person.firstName} ${person.lastName ?? ""}`.trim();
            return (
              <li key={person._id} className="flex flex-wrap items-center gap-4 py-5">
                <Avatar user={person} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {name}
                    <span
                      className={`ms-2 rounded-full px-2 py-0.5 align-middle text-[12px] ${
                        archived ? "bg-alert/10 text-alert" : "bg-glow/20 text-glow-ink"
                      }`}
                    >
                      {t(archived ? "admin.statusArchived" : "admin.statusActive")}
                    </span>
                  </p>
                  <p className="truncate text-[13px] text-haze" dir="auto">
                    {person.email}
                  </p>
                  <p className="text-[13px] text-haze">
                    {t("admin.joined", { date: formatDate(person.createdAt) })}{" "}
                    <span className="mx-1 text-line">|</span>{" "}
                    {t(person.provider === ProviderEnum.GOOGLE ? "admin.google" : "admin.system")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="quiet"
                    busy={acting === person._id}
                    onClick={() =>
                      run(person._id, () =>
                        users.setStatus(person._id, archived ? AccountStatusEnum.ACTIVE : AccountStatusEnum.ARCHIVE),
                      )
                    }
                  >
                    {t(archived ? "admin.restore" : "admin.archive")}
                  </Button>
                  {archived && (
                    <Button
                      variant="danger"
                      disabled={acting === person._id}
                      onClick={() => {
                        if (window.confirm(t("admin.confirmDelete", { name }))) run(person._id, () => users.remove(person._id));
                      }}
                    >
                      {t("admin.delete")}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <Pagination data={result} onPage={setPage} />
      </div>
    </div>
  );
};
