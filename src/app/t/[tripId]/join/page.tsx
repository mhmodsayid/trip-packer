import { Suspense } from "react";
import { JoinForm } from "./JoinForm";

interface JoinPageProps {
  params: Promise<{ tripId: string }>;
}

export default function JoinPage({ params }: JoinPageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </main>
      }
    >
      <JoinForm params={params} />
    </Suspense>
  );
}
