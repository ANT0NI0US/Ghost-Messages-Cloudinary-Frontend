import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, users } from "../api/endpoints.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useToast } from "../components/Toast.jsx";
import { Avatar, Button, Field, FilePicker, Notice, PageTitle, errorText } from "../components/ui.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { GenderEnum, LogoutEnum, ProviderEnum } from "../lib/enums.js";
import { useSubmit } from "../lib/useSubmit.js";

const Section = ({ title, children }) => (
  <section className="grid gap-6 border-t border-line py-9 md:grid-cols-[14rem_1fr]">
    <h2 className="text-[19px] font-medium">{title}</h2>
    <div className="flex min-w-0 flex-col gap-5">{children}</div>
  </section>
);

const ProfileForm = () => {
  const { t } = useI18n();
  const toast = useToast();
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    phone: user.phone ?? "",
    DOB: user.DOB ? user.DOB.slice(0, 10) : "",
    gender: String(user.gender ?? GenderEnum.MALE),
  });
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const { run, busy, error, fields } = useSubmit(async () => {
    // send only what changed: the backend schema is strict and every field is optional
    const original = { ...user, DOB: user.DOB?.slice(0, 10) ?? "", gender: String(user.gender) };
    const changes = Object.fromEntries(
      Object.entries(form).filter(([key, value]) => value !== "" && value !== (original[key] ?? "")),
    );
    if (changes.gender) changes.gender = Number(changes.gender);
    if (!Object.keys(changes).length) return;
    const { data, message } = await users.update(changes);
    setUser({ ...user, ...data });
    toast(message);
  });

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        run();
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("settings.firstName")} value={form.firstName} onChange={set("firstName")} error={fields.firstName} />
        <Field label={t("settings.lastName")} value={form.lastName} onChange={set("lastName")} error={fields.lastName} />
      </div>
      <Field label={t("auth.phone")} hint={t("auth.phoneHint")} type="tel" dir="ltr" value={form.phone} onChange={set("phone")} error={fields.phone} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("auth.DOB")} type="date" value={form.DOB} onChange={set("DOB")} error={fields.DOB} />
        <Field label={t("auth.gender")} as="select" value={form.gender} onChange={set("gender")} error={fields.gender}>
          <option value={GenderEnum.MALE}>{t("auth.male")}</option>
          <option value={GenderEnum.FEMALE}>{t("auth.female")}</option>
        </Field>
      </div>
      {error && !Object.keys(fields).length && <Notice tone="error">{errorText(error, t)}</Notice>}
      <Button type="submit" busy={busy} className="self-start">
        {t("settings.save")}
      </Button>
    </form>
  );
};

const Images = () => {
  const { t } = useI18n();
  const toast = useToast();
  const { user, setUser } = useAuth();
  const [covers, setCovers] = useState([]);

  const photo = useSubmit(async (file) => {
    const { data, message } = await users.uploadPhoto(file);
    setUser({ ...user, image: data });
    toast(message);
  });
  const removePhoto = useSubmit(async () => {
    const { message } = await users.deletePhoto();
    setUser({ ...user, image: undefined });
    toast(message);
  });
  const uploadCovers = useSubmit(async () => {
    const { data, message } = await users.uploadCovers(covers);
    setUser({ ...user, coverImages: data });
    setCovers([]);
    toast(message);
  });

  // each control shows its own errors under it
  const photoFailure = photo.error ?? removePhoto.error;

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar user={user} size={84} />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:border-ink focus-within:outline-2 focus-within:outline-glow">
            {photo.busy ? t("common.loading") : t("settings.changePhoto")}
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files[0];
                event.target.value = "";
                if (file) photo.run(file);
              }}
            />
          </label>
          {user.image?.secure_url && (
            <Button variant="link" busy={removePhoto.busy} onClick={() => removePhoto.run()}>
              {t("settings.removePhoto")}
            </Button>
          )}
        </div>
        {photoFailure && <Notice tone="error">{errorText(photoFailure, t)}</Notice>}
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-medium">{t("settings.covers")}</h3>
        {user.coverImages?.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {user.coverImages.map((image) => (
              <img key={image.public_id} src={image.secure_url} alt="" className="h-24 w-40 shrink-0 rounded-xl border border-line object-cover" />
            ))}
          </div>
        )}
        <FilePicker files={covers} onChange={setCovers} max={5} accept="image/jpeg,image/png" label={t("profile.attach")} hint={t("settings.coversHint")} />
        {covers.length > 0 && (
          <Button variant="quiet" busy={uploadCovers.busy} className="self-start" onClick={() => uploadCovers.run()}>
            {t("settings.uploadCovers")}
          </Button>
        )}
        {uploadCovers.error && <Notice tone="error">{errorText(uploadCovers.error, t)}</Notice>}
      </div>
    </>
  );
};

const TwoStep = () => {
  const { t } = useI18n();
  const toast = useToast();
  const { user, setUser } = useAuth();
  const [waitingForCode, setWaitingForCode] = useState(false);
  const [otp, setOtp] = useState("");

  const enable = useSubmit(async () => {
    const { message } = await auth.enableTwoStep();
    setWaitingForCode(true);
    toast(message);
  });
  const confirm = useSubmit(async () => {
    const { message } = await auth.confirmTwoStep(otp);
    setUser({ ...user, twoStepVerification: true });
    setWaitingForCode(false);
    toast(message);
  });

  const failure = enable.error ?? confirm.error;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-medium">{t("settings.twoStep")}</h3>
        <p className="text-haze">{t(user.twoStepVerification ? "settings.twoStepOn" : "settings.twoStepOff")}</p>
      </div>
      {!user.twoStepVerification && !waitingForCode && (
        <Button variant="quiet" className="self-start" busy={enable.busy} onClick={() => enable.run()}>
          {t("settings.enable")}
        </Button>
      )}
      {waitingForCode && (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            confirm.run();
          }}
        >
          <Field
            label={t("settings.codeSent")}
            inputMode="numeric"
            maxLength={6}
            dir="ltr"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            error={confirm.fields.otp}
            className="w-56"
          />
          <Button type="submit" busy={confirm.busy}>
            {t("settings.confirm")}
          </Button>
        </form>
      )}
      {failure && !confirm.fields.otp && <Notice tone="error">{errorText(failure, t)}</Notice>}
    </div>
  );
};

const Sessions = () => {
  const { t } = useI18n();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);

  const leave = async (action) => {
    setBusy(action);
    await logout(action).catch(() => {});
    navigate("/login");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <Button variant="quiet" busy={busy === LogoutEnum.DEVICE} onClick={() => leave(LogoutEnum.DEVICE)}>
          {t("settings.logoutHere")}
        </Button>
        <Button variant="danger" busy={busy === LogoutEnum.ALL} onClick={() => leave(LogoutEnum.ALL)}>
          {t("settings.logoutAll")}
        </Button>
      </div>
      <p className="text-[14px] text-haze">{t("settings.logoutAllHint")}</p>
    </div>
  );
};

export const Settings = () => {
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <div className="max-w-4xl">
      <PageTitle title={t("settings.title")} />
      <Section title={t("settings.profile")}>
        <ProfileForm />
      </Section>
      <Section title={t("settings.photo")}>
        <Images />
      </Section>
      <Section title={t("settings.security")}>
        {user.provider === ProviderEnum.GOOGLE ? <p className="text-haze">{t("settings.googleNote")}</p> : <TwoStep />}
      </Section>
      <Section title={t("settings.sessions")}>
        <Sessions />
      </Section>
    </div>
  );
};
