import { useStore } from "@nanostores/react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PlaceType, placeTypeLabels } from "../types";
import { useEffect, useState } from "react";

// Fix Leaflet icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import {
  Utensils,
  Beer,
  Coffee,
  Trees,
  Landmark,
  MapPin,
  Tag,
} from "lucide-react";
import ReactDOMServer from "react-dom/server";
import {
  $filteredLocations,
  setCurrentLocation,
} from "@/store/locations.store";
import { Badge } from "./ui/badge";

// Add CSS styles for custom markers
const markerStyles = `
.custom-div-icon {
  background: none;
  border: none;
}
.marker-pin {
  position: relative;
  width: 30px;
  height: 30px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  left: 50%;
  top: 50%;
  margin: -15px 0 0 -15px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4);
}
.marker-pin::after {
  content: '';
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}
.marker-pin svg {
  position: absolute;
  width: 16px;
  height: 16px;
  margin: 3px;
  transform: rotate(45deg);
  z-index: 1;
}
.user-location-marker {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #007bff;
  border: 3px solid white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}
.user-location-accuracy {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: rgba(0, 123, 255, 0.2);
  border: 1px solid rgba(0, 123, 255, 0.4);
}
`;

// Add styles to document head once
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = markerStyles;
  document.head.appendChild(styleElement);
}

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Paris coordinates
const PARIS_COORDS: [number, number] = [48.8566, 2.3522];

// Create custom icons for different place types with improved visuals
const placeIcons: Record<PlaceType, L.DivIcon> = {
  restaurant: new L.DivIcon({
    className: "custom-div-icon",
    html: `
      <div class="marker-pin" style="background-color: #e25141;">
        ${ReactDOMServer.renderToString(<Utensils size={16} color="#e25141" />)}
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -35],
  }),
  bar: new L.DivIcon({
    className: "custom-div-icon",
    html: `
      <div class="marker-pin" style="background-color: #9c59d1;">
        ${ReactDOMServer.renderToString(<Beer size={16} color="#9c59d1" />)}
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -35],
  }),
  cafe: new L.DivIcon({
    className: "custom-div-icon",
    html: `
      <div class="marker-pin" style="background-color: #ff9933;">
        ${ReactDOMServer.renderToString(<Coffee size={16} color="#ff9933" />)}
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -35],
  }),
  park: new L.DivIcon({
    className: "custom-div-icon",
    html: `
      <div class="marker-pin" style="background-color: #45ad45;">
        ${ReactDOMServer.renderToString(<Trees size={16} color="#45ad45" />)}
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -35],
  }),
  attraction: new L.DivIcon({
    className: "custom-div-icon",
    html: `
      <div class="marker-pin" style="background-color: #ffcb29;">
        ${ReactDOMServer.renderToString(<Landmark size={16} color="#ffcb29" />)}
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -35],
  }),
  other: new L.DivIcon({
    className: "custom-div-icon",
    html: `
      <div class="marker-pin" style="background-color: #3388ff;">
        ${ReactDOMServer.renderToString(<MapPin size={16} color="#3388ff" />)}
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -35],
  }),
};

// User location component that uses the browser's geolocation API
function UserLocationMarker() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);
  const map = useMap();

  useEffect(() => {
    let watchId: number;

    // Request permission and start tracking
    if (navigator.geolocation) {
      // Get initial position and center map on it
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setPosition([latitude, longitude]);
          setAccuracy(accuracy);
        },
        (error) => {
          console.error("Error getting user location:", error);
        },
        { enableHighAccuracy: true }
      );

      // Watch position for changes
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setPosition([latitude, longitude]);
          setAccuracy(accuracy);
        },
        (error) => {
          console.error("Error watching user location:", error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    // Clean up on unmount
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [map]);

  if (!position) return null;

  return (
    <>
      {/* Accuracy circle */}
      <Marker
        position={position}
        icon={
          new L.DivIcon({
            className: "user-location-accuracy-container",
            html: `<div class="user-location-accuracy" style="width: ${
              accuracy / 5
            }px; height: ${accuracy / 5}px;"></div>`,
            iconSize: [accuracy / 2.5, accuracy / 2.5],
            iconAnchor: [accuracy / 5, accuracy / 5],
          })
        }
      />

      {/* User location dot */}
      <Marker
        position={position}
        icon={
          new L.DivIcon({
            className: "user-location-container",
            html: `<div class="user-location-marker"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })
        }
      >
        <Popup>
          <div>
            <h3 className="font-bold text-lg">Votre position</h3>
            <p className="text-sm text-gray-600">
              Précision: ~{Math.round(accuracy)} mètres
            </p>
          </div>
        </Popup>
      </Marker>
    </>
  );
}

// Control to center map on user location
function LocationButton() {
  const map = useMap();

  const centerOnLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 15);
        },
        (error) => {
          console.error("Error getting user location:", error);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ zIndex: 1000 }}>
      <div className="leaflet-control leaflet-bar">
        <button
          onClick={centerOnLocation}
          className="bg-white p-2 rounded shadow"
          title="Center on your location"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function MapView() {
  const locations = useStore($filteredLocations);

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 relative overflow-hidden z-10 rounded-xl shadow-sm">
        <MapContainer
          center={PARIS_COORDS}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* User location marker */}
          <UserLocationMarker />

          {/* Location center button */}
          <LocationButton />

          {/* Display markers for filtered places */}
          {locations.map((place) => (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={placeIcons[place.type]}
              eventHandlers={{
                click: () => setCurrentLocation(place),
              }}
            >
              <Popup>
                <div className="px-6 py-2">
                  <h3 className="font-bold text-lg">{place.name}</h3>
                  <div className="flex items-center mt-1">
                    <span
                      className="text-xs px-2 py-1 rounded-full mr-2"
                      style={{
                        backgroundColor:
                          place.type === "restaurant"
                            ? "#ffcccb"
                            : place.type === "bar"
                            ? "#e6e6fa"
                            : place.type === "cafe"
                            ? "#ffe4b5"
                            : place.type === "park"
                            ? "#c1ffc1"
                            : place.type === "attraction"
                            ? "#fffacd"
                            : "#add8e6",
                      }}
                    >
                      {placeTypeLabels[place.type]}
                    </span>
                  </div>
                  {place.tags && place.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <div className="flex items-center text-gray-500 text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        <span>Tags:</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {place.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-xs py-0 h-5"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
