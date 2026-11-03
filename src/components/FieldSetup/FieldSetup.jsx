import { lazy, Suspense, useState } from "react";
import "./FieldSetup.css";

const FieldMap3D = lazy(() => import("../FieldMap3D/FieldMap3D"));

function FieldSetup({ onClose, onSave, initialField = null, currentPosition = null, onRequestLocation }) {
  const [fieldName, setFieldName] = useState(initialField?.name || "");
  const [crop, setCrop] = useState(initialField?.crop || "");
  const [location, setLocation] = useState(initialField?.location || "");
  const [locationResolved, setLocationResolved] = useState(Boolean(initialField?.location));
  const [position, setPosition] = useState(initialField?.latitude != null && initialField?.longitude != null
    ? { lat: Number(initialField.latitude), lng: Number(initialField.longitude) }
    : currentPosition ? { lat: currentPosition.lat, lng: currentPosition.lng } : null);
  const [boundary, setBoundary] = useState(initialField?.boundary || []);
  const [drawBoundary, setDrawBoundary] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locationResults, setLocationResults] = useState([]);
  const [locationError, setLocationError] = useState("");

  const useCurrentLocation = async () => {
    setLocationError("");
    setSaveError("");
    setLocating(true);
    try {
      const result = currentPosition || await onRequestLocation?.();
      if (!result) throw new Error("Allow location access or search for your field location.");
      const coordinates = { lat: result.lat, lng: result.lng };
      setPosition(coordinates);
      setBoundary([]);
      setLocationResolved(true);
      if (!location.trim()) {
        const params = new URLSearchParams({ lat: String(result.lat), lon: String(result.lng), lang: "en" });
        try {
          const response = await fetch(`https://photon.komoot.io/reverse?${params}`);
          const data = response.ok ? await response.json() : null;
          const properties = data?.features?.[0]?.properties || {};
          const label = [properties.name, properties.city || properties.locality, properties.state, properties.country]
            .filter(Boolean)
            .filter((value, index, list) => list.indexOf(value) === index)
            .join(", ");
          setLocation(label || `Near ${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}`);
        } catch {
          setLocation(`Near ${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}`);
        }
      }
    } catch (error) {
      setLocationError(error.message || "Could not read your current location.");
    } finally {
      setLocating(false);
    }
  };

  const searchFieldLocation = async () => {
    const query = location.trim();
    setLocationError("");
    setLocationResults([]);
    if (query.length < 3) {
      setLocationError("Enter a village, town, or address with at least 3 characters.");
      return;
    }
    setSearching(true);
    try {
      const params = new URLSearchParams({ q: query, limit: "5", lang: "en" });
      if (currentPosition) {
        params.set("lat", String(currentPosition.lat));
        params.set("lon", String(currentPosition.lng));
      }
      const response = await fetch(`https://photon.komoot.io/api/?${params}`);
      if (!response.ok) throw new Error("Place search is temporarily unavailable. You can still set the pin on the map.");
      const data = await response.json();
      const results = (data.features || []).map((feature) => {
        const properties = feature.properties || {};
        const label = [properties.name, properties.street, properties.city || properties.locality, properties.state, properties.country]
          .filter(Boolean)
          .filter((value, index, list) => list.indexOf(value) === index)
          .join(", ");
        return { label: label || query, coordinates: { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] } };
      });
      if (!results.length) throw new Error("No matching place found. Try a nearby village, town, or postal code.");
      setLocationResults(results);
    } catch (error) {
      setLocationError(error.message || "Could not search this location.");
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (result) => {
    setLocation(result.label);
    setPosition(result.coordinates);
    setBoundary([]);
    setLocationResolved(true);
    setLocationResults([]);
    setLocationError("");
    setSaveError("");
  };

  const handleMapLocation = (coordinates) => {
    if (drawBoundary) {
      return;
    }

    setPosition(coordinates);
    setBoundary([]);
    setLocationResolved(true);
  };

  const handleBoundaryChange = (updateBoundary) => {
    setBoundary(updateBoundary);
  };

  const startBoundaryMode = () => {
    const farmPosition = position || currentPosition;
    if (!farmPosition) {
      return;
    }

    if (!position) setPosition({ lat: farmPosition.lat, lng: farmPosition.lng });
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
    const farmPosition = position || currentPosition;

    if (fieldName.trim().length < 2 || fieldName.trim().length > 60) {
      setSaveError("Enter a field name between 2 and 60 characters.");
      return;
    }
    if (location.trim().length < 3 || location.trim().length > 120) {
      setSaveError("Enter a field location between 3 and 120 characters.");
      return;
    }
    if (!locationResolved) {
      setSaveError("Find this location on the map, use your current location, or place the pin manually.");
      return;
    }
    if (!farmPosition || farmPosition.lat < -90 || farmPosition.lat > 90 || farmPosition.lng < -180 || farmPosition.lng > 180) {
      setSaveError("Set a valid farm pin using your location, place search, or the map.");
      return;
    }
    if (boundary.length < 3 || boundary.length > 100) {
      setSaveError("Add between 3 and 100 points to define the field boundary.");
      return;
    }
    if (drawBoundary) {
      setSaveError("Finish the boundary outline before saving.");
      return;
    }
    if (crop.trim().length > 120) {
      setSaveError("Crop name must be 120 characters or fewer.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: fieldName.trim(),
        crop,
        location: location.trim(),
        latitude: farmPosition.lat,
        longitude: farmPosition.lng,
        boundary,
      });
    } catch (error) {
      setSaveError(error.message || "Unable to save this field. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const canContinue =
    fieldName.trim().length >= 2 &&
    fieldName.trim().length <= 60 &&
    location.trim().length >= 3 &&
    location.trim().length <= 120 &&
    locationResolved &&
    (position || currentPosition) &&
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

            <h2>{initialField?.id && initialField.name ? "Update your" : "Add your"}<span> field.</span></h2>

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
              placeholder="e.g. North rice plot"
              required
              minLength={2}
              maxLength={60}
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
                placeholder="Village, town, district, or address"
                required
                minLength={3}
                maxLength={120}
                value={location}
                onChange={(event) => {
                  setLocation(event.target.value);
                  setLocationResolved(false);
                  setLocationResults([]);
                  setSaveError("");
                }}
              />
            </div>
            <div className="kv-field-location-actions">
              <button type="button" className="kv-location-button" onClick={searchFieldLocation} disabled={searching}>
                {searching ? "Searching…" : "Find this location on map"}
              </button>
              <button type="button" className="kv-location-button" onClick={useCurrentLocation} disabled={locating}>
                {locating ? "Locating…" : "Use my current location"}
              </button>
            </div>
            <small className="kv-geocode-attribution">Place search uses OpenStreetMap data via Photon.</small>
            {locationResults.length > 0 && <div className="kv-location-results" role="listbox" aria-label="Matching places">
              {locationResults.map((result) => <button key={`${result.label}-${result.coordinates.lat}`} type="button" role="option" onClick={() => selectSearchResult(result)}>{result.label}</button>)}
            </div>}
            {locationError && <p className="kv-field-save-error" role="alert">{locationError}</p>}
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
                position={position || currentPosition}
                currentPosition={currentPosition}
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
                  disabled={!(position || currentPosition)}
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
