"use client";

import { Card } from "./ui";

export function ConfigWarning() {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <h2 className="font-semibold text-amber-900">Supabase not configured</h2>
      <p className="mt-2 text-sm text-amber-800">
        Copy <code className="rounded bg-amber-100 px-1">.env.example</code> to{" "}
        <code className="rounded bg-amber-100 px-1">.env.local</code> and set your
        Supabase URL and anon key. See the README for setup steps.
      </p>
    </Card>
  );
}
