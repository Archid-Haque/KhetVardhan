import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polygon,
  useMapEvents,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "./FieldMap.css";

const DEFAULT_CENTER = [26.1445, 91.7362];

function MapInteraction({
  onLocationSelect,
  onBoundaryChange,
  drawBoundary,
}) {
  useMapEvents({
    click(event) {
      const coordinates = {
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      };

      // Boundary drawing mode
      if (drawBoundary && onBoundaryChange) {
        onBoundaryChange((currentBoundary) => [
          ...currentBoundary,
          coordinates,
        ]);

        return;
      }

      // Normal location selection
      if (onLocationSelect) {
        onLocationSelect(coordinates);
      }
    },
  });

  return null;
}

function FieldMap({
  position = null,
  onLocationSelect,
  boundary = [],
  onBoundaryChange,
  drawBoundary = false,
}) {
  const mapCenter = position
    ? [position.lat, position.lng]
    : DEFAULT_CENTER;

  const mapZoom = position ? 16 : 10;

  const polygonPoints = boundary.map((point) => [
    point.lat,
    point.lng,
  ]);

  return (
    <div className="kv-real-map">

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        zoomControl={true}
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapInteraction
          onLocationSelect={onLocationSelect}
          onBoundaryChange={onBoundaryChange}
          drawBoundary={drawBoundary}
        />

        {/* Field Location */}
        {position && (
          <CircleMarker
            center={[position.lat, position.lng]}
            radius={8}
            pathOptions={{
              color: "#72ff5d",
              fillColor: "#72ff5d",
              fillOpacity: 0.9,
              weight: 2,
            }}
          />
        )}

        {/* Boundary */}
        {polygonPoints.length >= 2 && (
          <Polygon
            positions={polygonPoints}
            pathOptions={{
              color: "#72ff5d",
              fillColor: "#72ff5d",
              fillOpacity: 0.16,
              weight: 2,
            }}
          />
        )}

        {/* Boundary Points */}
        {boundary.map((point, index) => (
          <CircleMarker
            key={`${point.lat}-${point.lng}-${index}`}
            center={[point.lat, point.lng]}
            radius={6}
            pathOptions={{
              color: "#0a160c",
              fillColor: "#72ff5d",
              fillOpacity: 1,
              weight: 2,
            }}
          />
        ))}

      </MapContainer>


      {/* Live Label */}
      <div className="kv-map-overlay-label">
        <span className="kv-map-live-dot" />
        {drawBoundary ? "BOUNDARY MODE" : "LIVE MAP"}
      </div>


      {/* Instruction */}
      {drawBoundary && (
        <div className="kv-map-instruction">
          <strong>
            Mark your field boundary
          </strong>

          <span>
            Tap around the edges of your field
          </span>
        </div>
      )}

    </div>
  );
}

export default FieldMap;