"use client";

import React from "react";
import { GoogleMap, OverlayView, useJsApiLoader } from "@react-google-maps/api";
import { PiNavigationArrowBold } from "react-icons/pi";

const center = { lat: 48.155546544069075, lng: 16.349361136005307 };
// Soft teal-tinted theme matching the site's brand palette (--color-emmaus)
const mapStyles = [
  {
    elementType: "geometry",
    stylers: [{ color: "#eef3f1" }], // Teal-tinted off-white base, matches site background
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#5b6d6c" }], // Muted teal-gray for text
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#f6f9f8" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c8d4d1" }],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }], // Hide points of interest
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ visibility: "on" }, { color: "#d5e6dc" }], // Soft green parks
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ visibility: "on" }, { color: "#5a8272" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry",
    stylers: [{ color: "#e9efed" }], // Slightly deeper tint for built-up areas
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ visibility: "off" }], // No road outlines for a cleaner look
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7d8c8a" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#fdfdfc" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#cfdedb" }], // Teal-washed highways instead of harsh gray
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#b5cac6" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#b9d6d4" }], // Brand-teal water
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3a7276" }], // --color-emmaus
  },
];
function MyComponent() {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });
  const [infoWindowOpen, setInfoWindowOpen] = React.useState(true);

  return isLoaded ? (
    <GoogleMap
      mapContainerClassName="rounded-md h-[600px] mb-32 shadow-xl"
      center={center}
      zoom={16}
      options={{
        styles: mapStyles,
        disableDefaultUI: true, // Optional: Disable default UI controls
        zoomControl: true, // Optional: Enable specific controls
      }}
    >
      {/* Custom Overlay for the church logo */}
      <OverlayView
        position={center}
        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      >
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          onClick={() => setInfoWindowOpen((x) => !x)} // Open InfoWindow on click
        >
          <img
            src="/logo.png" // Replace with "/logo.svg" if needed
            alt="Logo"
            className="aspect-square w-10 cursor-pointer rounded-full shadow"
          />
          {infoWindowOpen && (
            <div className="absolute top-0 -right-4 w-max translate-x-full rounded-md bg-white px-4 py-2 font-sans text-sm shadow-sm">
              <div className="font-semibold">Tesarekplatz 2, 1100 Wien</div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emmaus flex items-center gap-1 font-bold"
              >
                <PiNavigationArrowBold /> Navigation öffnen
              </a>
            </div>
          )}
        </div>
      </OverlayView>

      <></>
    </GoogleMap>
  ) : (
    <></>
  );
}

export default React.memo(MyComponent);
