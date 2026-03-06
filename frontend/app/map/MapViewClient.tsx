"use client";

import dynamic from "next/dynamic";

const DynamicMapView = dynamic(() => import("./MapView"), { ssr: false });

type MapViewClientProps = {
  initialError?: string | null;
};

export default function MapViewClient({ initialError = null }: MapViewClientProps) {
  return <DynamicMapView initialError={initialError} />;
}