import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Nav } from "./nav";
import { PwaControls } from "../pwa-controls";
import { LanguageSwitcher } from "../i18n-provider";
import { ToastProvider } from "./toast-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await auth())) redirect("/login");
  return (
    <div
      className="mx-auto min-h-dvh max-w-xl px-4 pb-28"
      style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top, 0px))" }}
    >
      <div className="flex justify-end pb-2">
        <LanguageSwitcher />
      </div>
      <ToastProvider>
        <PwaControls />
        {children}
        <Nav />
      </ToastProvider>
    </div>
  );
}
