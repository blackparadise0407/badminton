import { signIn } from "@/auth";

export default function Login() {
  return (
    <div className="flex min-h-dvh flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold leading-tight">
            Badminton payments
          </h1>
          <p className="text-muted">
            Sign in to manage sessions and see who still owes.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button className="btn btn-primary w-full">
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
}
