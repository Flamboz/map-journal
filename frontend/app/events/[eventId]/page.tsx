import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth.config";
import EventDetailsLoadingView from "./EventDetailsLoadingView";
import EventDetailsPageContent from "./EventDetailsPageContent";

type EventDetailsPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  const authToken = session?.accessToken ?? "";
  const currentUserEmail = session?.user?.email ?? null;

  if (!authToken) {
    redirect("/auth/signin");
  }

  return (
    <Suspense fallback={<EventDetailsLoadingView />}>
      <EventDetailsPageContent eventId={eventId} authToken={authToken} currentUserEmail={currentUserEmail} />
    </Suspense>
  );
}
