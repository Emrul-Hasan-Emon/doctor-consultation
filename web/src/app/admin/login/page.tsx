import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Admin login" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Admin sign in</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Doctor Consultation platform
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
