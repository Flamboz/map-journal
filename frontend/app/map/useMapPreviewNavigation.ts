import { useMemo, useState } from "react";
import type { MapEventGroup } from "./mapViewHelpers";

type UseMapPreviewNavigationResult = {
  selectedGroupIndex: number | null;
  selectedEventIndex: number;
  selectedGroup: MapEventGroup | null;
  clearSelection: () => void;
  openGroup: (groupIndex: number) => void;
  showNextEvent: () => void;
  showPreviousEvent: () => void;
};

export function useMapPreviewNavigation(groupedEvents: MapEventGroup[]): UseMapPreviewNavigationResult {
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);

  const selectedGroup = useMemo(() => {
    if (selectedGroupIndex === null) {
      return null;
    }

    return groupedEvents[selectedGroupIndex] ?? null;
  }, [groupedEvents, selectedGroupIndex]);

  function clearSelection() {
    setSelectedGroupIndex(null);
    setSelectedEventIndex(0);
  }

  function openGroup(groupIndex: number) {
    setSelectedGroupIndex(groupIndex);
    setSelectedEventIndex(0);
  }

  function showNextEvent() {
    if (!selectedGroup) {
      return;
    }

    setSelectedEventIndex((currentIndex) => (currentIndex + 1) % selectedGroup.events.length);
  }

  function showPreviousEvent() {
    if (!selectedGroup) {
      return;
    }

    setSelectedEventIndex(
      (currentIndex) => (currentIndex - 1 + selectedGroup.events.length) % selectedGroup.events.length,
    );
  }

  return {
    selectedGroupIndex,
    selectedEventIndex,
    selectedGroup,
    clearSelection,
    openGroup,
    showNextEvent,
    showPreviousEvent,
  };
}