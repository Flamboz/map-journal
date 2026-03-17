import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth.config";
import { fetchUserEvents } from "../map/api";
import TimelineClient from "./TimelineClient";

export default async function TimelinePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? String(session.user.id) : "";

  if (!userId) {
    redirect("/auth/signin");
  }

  const events = await fetchUserEvents(userId);

  return <TimelineClient initialEvents={events} userId={userId} />;
}
