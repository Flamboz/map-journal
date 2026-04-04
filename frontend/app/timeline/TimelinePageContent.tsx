import { fetchUserEvents } from "../map/api";
import TimelineClient from "./TimelineClient";
import TimelineList from "./TimelineList";
import { buildTimelineViewModel } from "./timelineViewModel";

type TimelinePageContentProps = {
  authToken: string;
};

export default async function TimelinePageContent({ authToken }: TimelinePageContentProps) {
  const events = await fetchUserEvents(authToken);
  const viewModel = buildTimelineViewModel(events);

  return (
    <TimelineClient labels={viewModel.labels} stats={viewModel.stats}>
      <TimelineList years={viewModel.years} />
    </TimelineClient>
  );
}
