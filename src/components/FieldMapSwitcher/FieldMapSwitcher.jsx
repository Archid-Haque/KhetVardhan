import { lazy, Suspense, useState } from "react";

import FieldMap from "../FieldMap/FieldMap";

const FieldMap3D = lazy(() => import("../FieldMap3D/FieldMap3D"));

import "./FieldMapSwitcher.css";

function FieldMapSwitcher({
  position = null,
  onLocationSelect,
  boundary = [],
  onBoundaryChange,
  drawBoundary = false,
}) {
  const [viewMode, setViewMode] = useState("2d");

  return (
    <div className="kv-map-switcher">

      {/* MAP */}
      <div className="kv-map-switcher-view">

        {viewMode === "2d" ? (
          <FieldMap
            position={position}
            onLocationSelect={onLocationSelect}
            boundary={boundary}
            onBoundaryChange={onBoundaryChange}
            drawBoundary={drawBoundary}
          />
        ) : (
          <Suspense fallback={<div className="kv-map-loading" role="status">Loading 3D field view…</div>}>
            <FieldMap3D position={position} boundary={boundary} />
          </Suspense>
        )}

      </div>


      {/* VIEW SWITCH */}
      <div className="kv-map-view-switch">

        <button
          type="button"
          className={
            viewMode === "2d"
              ? "active"
              : ""
          }
          onClick={() => setViewMode("2d")}
        >
          <span>◫</span>
          2D
        </button>

        <button
          type="button"
          className={
            viewMode === "3d"
              ? "active"
              : ""
          }
          onClick={() => setViewMode("3d")}
        >
          <span>◇</span>
          3D
        </button>

      </div>

    </div>
  );
}

export default FieldMapSwitcher;
