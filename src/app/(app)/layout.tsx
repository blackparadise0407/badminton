import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Nav } from "./nav";
import { PwaControls } from "../pwa-controls";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await auth())) redirect("/login");
  return (
    <div className="mx-auto min-h-dvh max-w-xl px-4 pb-28 pt-5">
      <PwaControls />
      {children}
      <Nav />
    </div>
  );
}
