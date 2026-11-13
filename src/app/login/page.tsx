"use client";

import { signInWithGoogle } from "./actions";
import { LanguageSwitcher, useI18n } from "../i18n-provider";

export default function Login() {
  const { t } = useI18n();
  return (
    <div className="relative flex min-h-dvh flex-col justify-center px-6">
      <div
        className="absolute right-6"
        style={{ top: "calc(1rem + env(safe-area-inset-top, 0px))" }}
      >
        <LanguageSwitcher />
      </div>
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold leading-tight">
            {t("Badminton payments")}
          </h1>
          <p className="text-muted">
            {t("Sign in to manage sessions and see who still owes.")}
          </p>
        </div>
        <form action={signInWithGoogle}>
          <button className="btn btn-primary w-full">
            {t("Sign in with Google")}
          </button>
        </form>
      </div>
    </div>
  );
}
