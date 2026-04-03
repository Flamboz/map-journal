import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth.config";
import { fetchEventById } from "../../map/api";
import { isApiErrorCode } from "../../map/apiErrors";
import EventDetailsClient from "./EventDetailsClient";

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

  let event;
  try {
    event = await fetchEventById(eventId, authToken);
  } catch (error) {
    if (isApiErrorCode(error, "EVENT_NOT_FOUND")) {
      redirect("/?error=event-not-found");
    }

    throw error;
  }

  return <EventDetailsClient initialEvent={event} authToken={authToken} currentUserEmail={currentUserEmail} />;
}
