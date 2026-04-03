import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth.config";
import { fetchUserEvents } from "../map/api";
import TimelineClient from "./TimelineClient";

export default async function TimelinePage() {
  const session = await getServerSession(authOptions);
  const authToken = session?.accessToken ?? "";

  if (!authToken) {
    redirect("/auth/signin");
  }

  const events = await fetchUserEvents(authToken);

  return <TimelineClient initialEvents={events} />;
}
