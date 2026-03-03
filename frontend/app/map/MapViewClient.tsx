"use client";

import dynamic from "next/dynamic";

const DynamicMapView = dynamic(() => import("./MapView"), { ssr: false });

export default function MapViewClient() {
  return <DynamicMapView />;
}