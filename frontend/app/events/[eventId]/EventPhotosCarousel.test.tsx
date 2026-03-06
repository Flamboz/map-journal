import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EventPhotosCarousel from "./EventPhotosCarousel";

describe("EventPhotosCarousel", () => {
  it("shows fallback when there are no photos", () => {
    render(<EventPhotosCarousel photos={[]} eventName="Empty Event" />);

    expect(screen.getByText("No photos available")).toBeInTheDocument();
  });

  it("cycles through all photos using previous/next controls", () => {
    render(
      <EventPhotosCarousel
        eventName="River Walk"
        photos={[
          { id: 1, path: "a.jpg", url: "/uploads/user-1/event-10/a.jpg", createdAt: "2026-03-01T10:00:00.000Z" },
          { id: 2, path: "b.jpg", url: "/uploads/user-1/event-10/b.jpg", createdAt: "2026-03-01T10:01:00.000Z" },
          { id: 3, path: "c.jpg", url: "/uploads/user-1/event-10/c.jpg", createdAt: "2026-03-01T10:02:00.000Z" },
        ]}
      />,
    );

    expect(screen.getByAltText("River Walk photo 1")).toBeInTheDocument();
    expect(screen.getByText("Photo 1 of 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(screen.getByAltText("River Walk photo 2")).toBeInTheDocument();
    expect(screen.getByText("Photo 2 of 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(screen.getByAltText("River Walk photo 3")).toBeInTheDocument();
    expect(screen.getByText("Photo 3 of 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Previous photo" }));
    expect(screen.getByAltText("River Walk photo 2")).toBeInTheDocument();
    expect(screen.getByText("Photo 2 of 3")).toBeInTheDocument();
  });

  it("opens image in a larger modal and supports carousel navigation", () => {
    render(
      <EventPhotosCarousel
        eventName="River Walk"
        photos={[
          { id: 1, path: "a.jpg", url: "/uploads/user-1/event-10/a.jpg", createdAt: "2026-03-01T10:00:00.000Z" },
          { id: 2, path: "b.jpg", url: "/uploads/user-1/event-10/b.jpg", createdAt: "2026-03-01T10:01:00.000Z" },
          { id: 3, path: "c.jpg", url: "/uploads/user-1/event-10/c.jpg", createdAt: "2026-03-01T10:02:00.000Z" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open photo viewer" }));
    const modal = screen.getByRole("dialog", { name: "Photo viewer" });
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText("Photo 1 of 3")).toBeInTheDocument();

    fireEvent.click(within(modal).getByRole("button", { name: "Next photo in modal" }));
    expect(within(modal).getByText("Photo 2 of 3")).toBeInTheDocument();

    fireEvent.click(within(modal).getByRole("button", { name: "Previous photo in modal" }));
    expect(within(modal).getByText("Photo 1 of 3")).toBeInTheDocument();

    fireEvent.click(within(modal).getByRole("button", { name: "Close photo viewer" }));
    expect(screen.queryByRole("dialog", { name: "Photo viewer" })).not.toBeInTheDocument();
  });

  it("supports add, delete, and set preview actions in carousel", () => {
    const onAddPhotos = vi.fn();
    const onDeletePhoto = vi.fn();
    const onSetPreviewPhoto = vi.fn();

    render(
      <EventPhotosCarousel
        eventName="River Walk"
        photos={[
          { id: 1, path: "a.jpg", url: "/uploads/user-1/event-10/a.jpg", createdAt: "2026-03-01T10:00:00.000Z" },
          { id: 2, path: "b.jpg", url: "/uploads/user-1/event-10/b.jpg", createdAt: "2026-03-01T10:01:00.000Z" },
        ]}
        onAddPhotos={onAddPhotos}
        onDeletePhoto={onDeletePhoto}
        onSetPreviewPhoto={onSetPreviewPhoto}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    fireEvent.click(screen.getByRole("button", { name: "Set as preview" }));
    expect(onSetPreviewPhoto).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByRole("button", { name: "Delete photo" }));
    expect(onDeletePhoto).toHaveBeenCalledWith(2);

    const input = screen.getByLabelText("Add photos") as HTMLInputElement;
    const file = new File(["content"], "new.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onAddPhotos).toHaveBeenCalledTimes(1);
    expect(onAddPhotos.mock.calls[0]?.[0]).toHaveLength(1);
  });
});
