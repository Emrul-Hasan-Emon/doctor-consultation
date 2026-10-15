"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier: form.get("identifier"),
        password: form.get("password"),
      }),
    });
    if (res.ok) {
      // Only follow same-site admin paths.
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
      return;
    }
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message)
      ? body.message.join(". ")
      : body?.message;
    setError(message ?? "Could not sign in");
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <Field label="Mobile or email" required>
        <Input name="identifier" autoComplete="username" required autoFocus />
      </Field>
      <Field label="Password" required>
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
        />
      </Field>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" loading={loading}>
        Sign in
      </Button>
    </form>
  );
}
