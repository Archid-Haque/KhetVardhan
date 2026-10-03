import { useState } from "react";

import FieldMap from "../FieldMap/FieldMap";
import FieldMap3D from "../FieldMap3D/FieldMap3D";

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
          <FieldMap3D
            position={position}
            boundary={boundary}
          />
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