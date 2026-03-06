import MapViewClient from "./map/MapViewClient";

type HomePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const initialError = params.error === "event-not-found" ? "Event no longer exists." : null;

  return <MapViewClient initialError={initialError} />;
}
