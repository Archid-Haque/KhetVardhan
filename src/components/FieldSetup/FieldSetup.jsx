import { lazy, Suspense, useState } from "react";
import "./FieldSetup.css";

const FieldMap3D = lazy(() => import("../FieldMap3D/FieldMap3D"));

function FieldSetup({ onClose, onSave, initialField = null }) {
  const [fieldName, setFieldName] = useState(initialField?.name || "");
  const [crop, setCrop] = useState(initialField?.crop || "");
  const [location, setLocation] = useState(initialField?.location || "");

  const [position, setPosition] = useState(initialField?.latitude != null && initialField?.longitude != null ? { lat: Number(initialField.latitude), lng: Number(initialField.longitude) } : null);
  const [boundary, setBoundary] = useState(initialField?.boundary || []);
  const [drawBoundary, setDrawBoundary] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleMapLocation = (coordinates) => {
    if (drawBoundary) {
      return;
    }

    setPosition(coordinates);
  };

  const handleBoundaryChange = (updateBoundary) => {
    setBoundary(updateBoundary);
  };

  const startBoundaryMode = () => {
    if (!position) {
      return;
    }

    setBoundary([]);
    setDrawBoundary(true);
  };

  const finishBoundary = () => {
    if (boundary.length < 3) {
      return;
    }

    setDrawBoundary(false);
  };

  const clearBoundary = () => {
    setBoundary([]);
    setDrawBoundary(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaveError("");

    if (
      !fieldName ||
      !location ||
      !position ||
      boundary.length < 3
    ) {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: fieldName,
        crop,
        location,
        latitude: position.lat,
        longitude: position.lng,
        boundary,
      });
    } catch (error) {
      setSaveError(error.message || "Unable to save this field. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const canContinue =
    fieldName &&
    location &&
    position &&
    boundary.length >= 3 &&
    !drawBoundary;

  return (
    <div className="kv-field-overlay">
      <div className="kv-field-setup">

        {/* Header */}
        <div className="kv-field-setup-header">
          <div>
            <span className="kv-field-setup-eyebrow">
              FIELD SETUP
            </span>

            <h2>
              Add your
              <span> field.</span>
            </h2>

            <p>
              Tell KhetVardhan where your field is.
              We'll use this information for satellite
              monitoring and future drone intelligence.
            </p>
          </div>

          <button
            className="kv-field-close"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>


        {/* Form */}
        <form
          className="kv-field-form"
          onSubmit={handleSubmit}
        >

          {/* Field Name */}
          <div className="kv-form-group">
            <label htmlFor="field-name">
              FIELD NAME
            </label>

            <input
              id="field-name"
              type="text"
              placeholder="e.g. Home Farm"
              value={fieldName}
              onChange={(event) =>
                setFieldName(event.target.value)
              }
            />
          </div>


          {/* Location */}
          <div className="kv-form-group">
            <label htmlFor="field-location">
              FIELD LOCATION
            </label>

            <div className="kv-location-input">
              <span>📍</span>

              <input
                id="field-location"
                type="text"
                placeholder="Enter village, town or location"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
              />
            </div>
          </div>


          {/* Crop */}
          <div className="kv-form-group">
            <label htmlFor="field-crop">
              CROP

              <span className="kv-optional">
                OPTIONAL
              </span>
            </label>

            <select
              id="field-crop"
              value={crop}
              onChange={(event) =>
                setCrop(event.target.value)
              }
            >
              <option value="">
                Select crop
              </option>

              <option value="rice">
                Rice
              </option>

              <option value="maize">
                Maize
              </option>

              <option value="wheat">
                Wheat
              </option>

              <option value="vegetables">
                Vegetables
              </option>

              <option value="tea">
                Tea
              </option>

              <option value="other">
                Other
              </option>
            </select>
          </div>


          {/* Map */}
          <div className="kv-field-preview">

            <Suspense fallback={<div className="kv-field-map-loading" role="status">Loading the 3D satellite map…</div>}>
              <FieldMap3D
                position={position}
                onLocationSelect={handleMapLocation}
                boundary={boundary}
                onBoundaryChange={handleBoundaryChange}
                drawBoundary={drawBoundary}
                pinMode={!drawBoundary}
              />
            </Suspense>

          </div>


          {/* Location Status */}
          {position && !drawBoundary && (
            <div
              style={{
                marginTop: "10px",
                padding: "10px 12px",
                borderRadius: "8px",
                border:
                  "1px solid rgba(114, 255, 93, 0.15)",
                background:
                  "rgba(114, 255, 93, 0.04)",
                color:
                  "rgba(225, 236, 224, 0.65)",
                fontSize: "11px",
              }}
            >
              <strong
                style={{
                  color: "#72ff5d",
                  marginRight: "6px",
                }}
              >
                LOCATION SELECTED
              </strong>

              {position.lat.toFixed(6)},{" "}
              {position.lng.toFixed(6)}
            </div>
          )}


          {/* Boundary Coordinates */}
          {boundary.length > 0 && (
            <div
              style={{
                marginTop: "10px",
                padding: "12px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(114, 255, 93, 0.15)",
                background:
                  "rgba(114, 255, 93, 0.04)",
              }}
            >

              {/* Boundary Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <strong
                  style={{
                    color: "#72ff5d",
                    fontSize: "10px",
                    letterSpacing: "0.08em",
                  }}
                >
                  FIELD BOUNDARY
                </strong>

                <span
                  style={{
                    color:
                      "rgba(225, 236, 224, 0.45)",
                    fontSize: "10px",
                  }}
                >
                  {boundary.length} POINTS
                </span>
              </div>


              {/* Coordinates */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  maxHeight: "130px",
                  overflowY: "auto",
                }}
              >

                {boundary.map((point, index) => (
                  <div
                    key={`${point.lat}-${point.lng}-${index}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "7px 9px",
                      borderRadius: "6px",
                      background:
                        "rgba(0, 0, 0, 0.18)",
                      fontSize: "10px",
                    }}
                  >

                    <span
                      style={{
                        color: "#72ff5d",
                        fontWeight: 700,
                      }}
                    >
                      P{index + 1}
                    </span>

                    <span
                      style={{
                        color:
                          "rgba(225, 236, 224, 0.65)",
                        fontFamily: "monospace",
                      }}
                    >
                      {point.lat.toFixed(6)}
                      {" , "}
                      {point.lng.toFixed(6)}
                    </span>

                  </div>
                ))}

              </div>
            </div>
          )}


          {/* Boundary Controls */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "12px",
              flexWrap: "wrap",
            }}
          >

            {/* Start Boundary */}
            {!drawBoundary &&
              boundary.length < 3 && (
                <button
                  type="button"
                  className="kv-field-save"
                  onClick={startBoundaryMode}
                  disabled={!position}
                >
                  Define Field Boundary
                  <span>→</span>
                </button>
              )}


            {/* Drawing Mode */}
            {drawBoundary && (
              <>
                <button
                  type="button"
                  className="kv-field-save"
                  onClick={finishBoundary}
                  disabled={boundary.length < 3}
                >
                  Finish Boundary
                  <span>✓</span>
                </button>

                <button
                  type="button"
                  className="kv-field-cancel"
                  onClick={clearBoundary}
                >
                  Clear
                </button>
              </>
            )}


            {/* Boundary Completed */}
            {!drawBoundary &&
              boundary.length >= 3 && (
                <>
                  <button
                    type="button"
                    className="kv-field-save"
                    onClick={startBoundaryMode}
                  >
                    Redraw Boundary
                    <span>↻</span>
                  </button>

                  <button
                    type="button"
                    className="kv-field-cancel"
                    onClick={clearBoundary}
                  >
                    Clear
                  </button>
                </>
              )}

          </div>


          {/* Final Actions */}
          <div className="kv-field-form-actions">

            <button
              className="kv-field-cancel"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="kv-field-save"
              type="submit"
              disabled={!canContinue || saving}
            >
              {saving ? "Saving…" : "Save Field"}
              <span>→</span>
            </button>

          </div>

          {saveError && <p className="kv-field-save-error" role="alert">{saveError}</p>}

        </form>
      </div>
    </div>
  );
}

export default FieldSetup;
