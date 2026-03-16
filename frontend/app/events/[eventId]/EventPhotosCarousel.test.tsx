import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EventPhotosCarousel from "./EventPhotosCarousel";

describe("EventPhotosCarousel", () => {
  it("shows fallback when there are no photos", () => {
    render(<EventPhotosCarousel photos={[]} eventName="Empty Event" />);

    expect(screen.getByText("No attachments available")).toBeInTheDocument();
  });

  it("cycles through all photos using previous/next controls", () => {
    render(
      <EventPhotosCarousel
        eventName="River Walk"
        photos={[
          {
            id: "550e8400-e29b-41d4-a716-446655440011",
            path: "a.jpg",
            url: "/uploads/user-1/event-550e8400-e29b-41d4-a716-446655440001/a.jpg",
            createdAt: "2026-03-01T10:00:00.000Z",
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440012",
            path: "b.jpg",
            url: "/uploads/user-1/event-550e8400-e29b-41d4-a716-446655440001/b.jpg",
            createdAt: "2026-03-01T10:01:00.000Z",
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440013",
            path: "c.jpg",
            url: "/uploads/user-1/event-550e8400-e29b-41d4-a716-446655440001/c.jpg",
            createdAt: "2026-03-01T10:02:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByAltText("River Walk attachment 1")).toBeInTheDocument();
    expect(screen.getByText("Attachment 1 of 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next attachment" }));
    expect(screen.getByAltText("River Walk attachment 2")).toBeInTheDocument();
    expect(screen.getByText("Attachment 2 of 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next attachment" }));
    expect(screen.getByAltText("River Walk attachment 3")).toBeInTheDocument();
    expect(screen.getByText("Attachment 3 of 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Previous attachment" }));
    expect(screen.getByAltText("River Walk attachment 2")).toBeInTheDocument();
    expect(screen.getByText("Attachment 2 of 3")).toBeInTheDocument();
  });

  it("opens image in a larger modal and supports carousel navigation", () => {
    render(
      <EventPhotosCarousel
        eventName="River Walk"
        photos={[
          {
            id: "550e8400-e29b-41d4-a716-446655440011",
            path: "a.jpg",
            url: "/uploads/user-1/event-550e8400-e29b-41d4-a716-446655440001/a.jpg",
            createdAt: "2026-03-01T10:00:00.000Z",
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440012",
            path: "b.jpg",
            url: "/uploads/user-1/event-550e8400-e29b-41d4-a716-446655440001/b.jpg",
            createdAt: "2026-03-01T10:01:00.000Z",
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440013",
            path: "c.jpg",
            url: "/uploads/user-1/event-550e8400-e29b-41d4-a716-446655440001/c.jpg",
            createdAt: "2026-03-01T10:02:00.000Z",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open attachment viewer" }));
    const modal = screen.getByRole("dialog", { name: "Attachment viewer" });
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText("Attachment 1 of 3")).toBeInTheDocument();

    fireEvent.click(within(modal).getByRole("button", { name: "Next attachment in modal" }));
    expect(within(modal).getByText("Attachment 2 of 3")).toBeInTheDocument();

    fireEvent.click(within(modal).getByRole("button", { name: "Previous attachment in modal" }));
    expect(within(modal).getByText("Attachment 1 of 3")).toBeInTheDocument();

    fireEvent.click(within(modal).getByRole("button", { name: "Close attachment viewer" }));
    expect(screen.queryByRole("dialog", { name: "Attachment viewer" })).not.toBeInTheDocument();
  });

  it("supports add, delete, and set preview actions in carousel", () => {
    const onAddPhotos = vi.fn();
    const onDeletePhoto = vi.fn();
    const onSetPreviewPhoto = vi.fn();

    render(
      <EventPhotosCarousel
        eventName="River Walk"
        photos={[
          {
            id: "550e8400-e29b-41d4-a716-446655440011",
            path: "a.jpg",
            url: "/uploads/user-1/event-550e8400-e29b-41d4-a716-446655440001/a.jpg",
            createdAt: "2026-03-01T10:00:00.000Z",
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440012",
            path: "b.jpg",
            url: "/uploads/user-1/event-550e8400-e29b-41d4-a716-446655440001/b.jpg",
            createdAt: "2026-03-01T10:01:00.000Z",
          },
        ]}
        onAddPhotos={onAddPhotos}
        onDeletePhoto={onDeletePhoto}
        onSetPreviewPhoto={onSetPreviewPhoto}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next attachment" }));
    fireEvent.click(screen.getByRole("button", { name: "Set as preview" }));
    expect(onSetPreviewPhoto).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440012");

    fireEvent.click(screen.getByRole("button", { name: "Delete attachment" }));
    expect(onDeletePhoto).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440012");

    const input = screen.getByLabelText("Add attachment") as HTMLInputElement;
    const file = new File(["content"], "new.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onAddPhotos).toHaveBeenCalledTimes(1);
    expect(onAddPhotos.mock.calls[0]?.[0]).toHaveLength(1);
  });
});
