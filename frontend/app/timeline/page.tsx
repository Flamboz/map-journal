import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth.config";
import TimelineLoadingView from "./TimelineLoadingView";
import TimelinePageContent from "./TimelinePageContent";

export default async function TimelinePage() {
  const session = await getServerSession(authOptions);
  const authToken = session?.accessToken ?? "";

  if (!authToken) {
    redirect("/auth/signin");
  }

  return (
    <Suspense fallback={<TimelineLoadingView />}>
      <TimelinePageContent authToken={authToken} />
    </Suspense>
  );
}
