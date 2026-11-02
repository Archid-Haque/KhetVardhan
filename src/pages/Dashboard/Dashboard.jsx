import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Activity,
  AlertTriangle,
  Check,
  ChevronRight,
  CircleHelp,
  Crosshair,
  LocateFixed,
  MapPin,
  Maximize2,
  Plus,
  Satellite,
  Save,
  Sprout,
  Undo2,
} from "lucide-react";
import { api } from "../../lib/api";
import FieldSetup from "../../components/FieldSetup/FieldSetup";
import "./Dashboard.css";

const FieldMap3D = lazy(() => import("../../components/FieldMap3D/FieldMap3D"));
const REGIONAL_VIEW = { lat: 25.68, lng: 91.91 };

function estimateAreaHectares(boundary) {
  if (!Array.isArray(boundary) || boundary.length < 3) return null;
  const meanLatitude = boundary.reduce((sum, point) => sum + Number(point.lat), 0) / boundary.length;
  const longitudeScale = 111320 * Math.cos((meanLatitude * Math.PI) / 180);
  const points = boundary.map((point) => ({
    x: Number(point.lng) * longitudeScale,
    y: Number(point.lat) * 110574,
  }));
  let area = 0;
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    area += point.x * next.y - next.x * point.y;
  });
  return Math.abs(area / 2) / 10000;
}

function sameCoordinates(first, second) {
  return first?.lat === second?.lat && first?.lng === second?.lng;
}

function Dashboard() {
  const [showFieldSetup, setShowFieldSetup] = useState(false);
  const [setupInitialField, setSetupInitialField] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);
  const [observations, setObservations] = useState([]);
  const [locationState, setLocationState] = useState(() => (
    typeof navigator !== "undefined" && navigator.geolocation ? "locating" : "unavailable"
  ));
  const [locationError, setLocationError] = useState("");
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [pinMode, setPinMode] = useState(false);
  const [drawBoundary, setDrawBoundary] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [focusPosition, setFocusPosition] = useState(null);
  const [focusToken, setFocusToken] = useState(0);

  const [field, setField] = useState(() => {
    try {
      const savedField = localStorage.getItem("khetvardhan-field");
      return savedField ? JSON.parse(savedField) : null;
    } catch {
      return null;
    }
  });

  const [draftPosition, setDraftPosition] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("khetvardhan-field") || "null");
      return saved?.latitude != null && saved?.longitude != null
        ? { lat: Number(saved.latitude), lng: Number(saved.longitude) }
        : null;
    } catch {
      return null;
    }
  });
  const [draftBoundary, setDraftBoundary] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("khetvardhan-field") || "null")?.boundary || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let active = true;
    api("/auth/me")
      .then(() => {
        if (active) setSignedIn(true);
        return Promise.all([api("/fields"), api("/observations")]);
      })
      .then(([{ fields }, { observations: savedObservations }]) => {
        if (!active) return;
        setObservations(savedObservations);
        if (!fields.length) return;
        const activeId = JSON.parse(localStorage.getItem("khetvardhan-field") || "null")?.id;
        const saved = fields.find((item) => item.id === activeId) || fields[0];
        const normalized = {
          ...saved,
          latitude: saved.latitude == null ? null : Number(saved.latitude),
          longitude: saved.longitude == null ? null : Number(saved.longitude),
          boundary: saved.boundary || [],
        };
        setField(normalized);
        setDraftPosition(normalized.latitude != null && normalized.longitude != null
          ? { lat: normalized.latitude, lng: normalized.longitude }
          : null);
        setDraftBoundary(normalized.boundary);
        localStorage.setItem("khetvardhan-field", JSON.stringify(normalized));
      })
      .catch(() => {
        if (active) setSignedIn(false);
      });
    return () => { active = false; };
  }, []);

  const handleLocationSuccess = useCallback(({ coords }) => {
    setDeviceLocation({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy });
    setLocationState("ready");
    setLocationError("");
  }, []);

  const handleLocationError = useCallback((error) => {
    setLocationState(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
    setLocationError(error.code === error.PERMISSION_DENIED
      ? "Location permission is off. Allow it in your browser to show your position."
      : "Your location could not be determined. You can still pin the farm on the map.");
  }, []);

  const requestLocation = useCallback(() => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationState("unavailable");
      setLocationError("This browser does not provide device location.");
      return;
    }
    setLocationState("locating");
    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }, [handleLocationError, handleLocationSuccess]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }, [handleLocationError, handleLocationSuccess]);

  const alertCount = observations.filter((item) => ["moderate", "high"].includes(item.severity)).length;
  const areaHectares = useMemo(() => estimateAreaHectares(draftBoundary), [draftBoundary]);
  const mapCenter = draftPosition || (deviceLocation ? { lat: deviceLocation.lat, lng: deviceLocation.lng } : null);
  const savedPosition = field?.latitude == null || field?.longitude == null
    ? null
    : { lat: field.latitude, lng: field.longitude };
  const hasMapEdits = !field || !sameCoordinates(draftPosition, savedPosition) || JSON.stringify(draftBoundary) !== JSON.stringify(field.boundary || []);
  useEffect(() => {
    if (location.state?.openFieldSetup) {
      navigate(".", { replace: true, state: null });
    }
  }, [location.state, navigate]);

  const focusMap = (target) => {
    setFocusPosition(target);
    setFocusToken((value) => value + 1);
  };

  const handleLocate = () => {
    if (deviceLocation) {
      focusMap(deviceLocation);
      return;
    }
    requestLocation();
  };

  const closeFieldSetup = () => {
    setShowFieldSetup(false);
    setSetupInitialField(null);
    if (location.state?.openFieldSetup) navigate(".", { replace: true, state: null });
  };

  const handleMapLocation = (coordinates) => {
    setDraftPosition(coordinates);
    setPinMode(false);
    setSaveError("");
    focusMap(coordinates);
  };

  const handleBoundaryChange = (nextBoundary) => {
    setDraftBoundary(nextBoundary);
    setSaveError("");
  };

  const openFieldDetails = () => {
    setSetupInitialField(field ? {
      ...field,
      latitude: draftPosition?.lat ?? field.latitude,
      longitude: draftPosition?.lng ?? field.longitude,
      boundary: draftBoundary,
    } : null);
    setShowFieldSetup(true);
  };

  const startBoundaryMode = () => {
    if (!draftPosition && deviceLocation) setDraftPosition({ lat: deviceLocation.lat, lng: deviceLocation.lng });
    if (!draftPosition && !deviceLocation) {
      setSaveError("Pin the farm location before drawing its boundary.");
      setPinMode(true);
      return;
    }
    setDraftBoundary([]);
    setDrawBoundary(true);
    setPinMode(false);
    setSaveError("");
  };

  const cancelBoundaryMode = () => {
    setDraftBoundary(field?.boundary || []);
    setDrawBoundary(false);
  };

  const handleSaveField = async (fieldData) => {
    const result = await api(field?.id ? `/fields/${field.id}` : "/fields", {
      method: field?.id ? "PATCH" : "POST",
      body: JSON.stringify({ ...fieldData, areaHectares: null }),
    });
    const savedField = {
      ...result.field,
      latitude: result.field.latitude == null ? null : Number(result.field.latitude),
      longitude: result.field.longitude == null ? null : Number(result.field.longitude),
      boundary: result.field.boundary || [],
    };
    setField(savedField);
    setDraftPosition(savedField.latitude != null && savedField.longitude != null
      ? { lat: savedField.latitude, lng: savedField.longitude }
      : null);
    setDraftBoundary(savedField.boundary);
    localStorage.setItem("khetvardhan-field", JSON.stringify(savedField));
    closeFieldSetup();
  };

  const handleSaveMap = async () => {
    if (!field) {
      setSetupInitialField({
        name: "",
        crop: "",
        location: "",
        latitude: draftPosition?.lat ?? deviceLocation?.lat ?? null,
        longitude: draftPosition?.lng ?? deviceLocation?.lng ?? null,
        boundary: draftBoundary,
      });
      setShowFieldSetup(true);
      return;
    }
    if (!draftPosition) {
      setSaveError("Set a farm pin before saving these map changes.");
      return;
    }
    setSaveState("saving");
    setSaveError("");
    try {
      await handleSaveField({
        name: field.name,
        crop: field.crop || "",
        location: field.location,
        latitude: draftPosition.lat,
        longitude: draftPosition.lng,
        boundary: draftBoundary,
      });
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2200);
    } catch (error) {
      setSaveError(error.message || "Could not save the farm map changes.");
      setSaveState("idle");
    }
  };

  const setupField = setupInitialField || field;
  const locationLabel = locationState === "locating"
    ? "Finding your location"
    : locationState === "ready"
      ? "Device location available"
      : locationState === "denied"
        ? "Location permission needed"
        : "Location unavailable";

  return (
    <main className="kv-dashboard">
      <div className="kv-dashboard-shell">
        <header className="kv-overview-heading">
          <div className="kv-overview-title">
            <span className="kv-dashboard-eyebrow"><Activity size={14} /> FIELD OPERATIONS / OVERVIEW</span>
            <h1>A clearer view of <span>your farm.</span></h1>
            <p>Bring the farm pin, boundary and field records into one precise view. Your location helps orient the map; your team remains in control of every saved boundary.</p>
          </div>
          <div className="kv-overview-heading-actions">
            <div className={`kv-location-pill ${locationState}`}><span />{locationLabel}</div>
            {signedIn ? <span className="kv-sync-label"><Check size={14} /> Workspace synced</span> : <Link className="kv-signin-link" to="/account">Sign in to sync <ChevronRight size={15} /></Link>}
          </div>
        </header>

        <section className="kv-ops-section" aria-labelledby="kv-farm-map-title">
          <div className="kv-ops-section-head">
            <div>
              <span className="kv-section-kicker">FARM OVERVIEW</span>
              <h2 id="kv-farm-map-title">{field?.name || "Map your farm"}</h2>
              <p>{field?.location || "Start with your location, then pin and outline the farm you want to monitor."}</p>
            </div>
            <button className="kv-quiet-action" type="button" onClick={openFieldDetails}>
              {field ? "Farm details" : "Add farm details"}<ChevronRight size={16} />
            </button>
          </div>

          <div className="kv-ops-card">
            <div className="kv-ops-map-column">
              <div className="kv-map-toolbar">
                <div className="kv-imagery-label"><Satellite size={16} /><span><strong>Satellite view</strong><small>Esri World Imagery</small></span></div>
                <button className="kv-map-locate" type="button" onClick={handleLocate} aria-label="Locate me on the map" title="Locate me"><LocateFixed size={17} /><span>Locate me</span></button>
              </div>
              <div className={`kv-map-canvas ${drawBoundary ? "is-drawing" : ""} ${pinMode ? "is-pinning" : ""}`}>
                <Suspense fallback={<div className="kv-map-loading"><span className="kv-loading-orbit" />Opening 3D satellite view…</div>}>
                  <FieldMap3D
                    position={draftPosition}
                    currentPosition={deviceLocation}
                    boundary={draftBoundary}
                    onLocationSelect={handleMapLocation}
                    onBoundaryChange={handleBoundaryChange}
                    drawBoundary={drawBoundary}
                    pinMode={pinMode}
                    focusPosition={focusPosition}
                    focusToken={focusToken}
                  />
                </Suspense>
                <div className="kv-map-source-note"><span />Imagery is not real-time; capture dates vary by location.</div>
                {(drawBoundary || pinMode) && <div className="kv-overview-map-instruction" role="status">{drawBoundary ? "Click the map to add boundary points" : "Click the map to set the farm pin"}</div>}
                {locationError && <div className="kv-map-location-note"><CircleHelp size={15} />{locationError}</div>}
              </div>
              <div className="kv-map-footer">
                <span><i className="kv-legend-device" />Your location</span>
                <span><i className="kv-legend-farm" />Farm pin</span>
                <span><i className="kv-legend-boundary" />Farm boundary</span>
                <span className="kv-map-coordinate-hint"><Crosshair size={13} /> Drag to orbit · scroll to zoom</span>
              </div>
            </div>

            <aside className="kv-map-rail">
              <div className="kv-rail-intro">
                <span className="kv-section-kicker">FIELD POSITION</span>
                <h3>{field?.name || "Farm location"}</h3>
                <p>{field?.crop ? `${field.crop} · ` : ""}{field?.location || "Coordinates update when you place a pin."}</p>
              </div>

              <div className="kv-coordinate-card">
                <div className="kv-coordinate-heading"><MapPin size={15} /><span>Farm coordinates</span></div>
                {draftPosition ? (
                  <div className="kv-coordinate-values">
                    <span><small>LATITUDE</small><strong>{draftPosition.lat.toFixed(6)}°</strong></span>
                    <span><small>LONGITUDE</small><strong>{draftPosition.lng.toFixed(6)}°</strong></span>
                  </div>
                ) : <p className="kv-empty-coordinates">No farm pin yet</p>}
                <button type="button" className="kv-inline-button" onClick={() => { setPinMode((value) => !value); setDrawBoundary(false); setSaveError(""); }}>
                  <MapPin size={14} />{pinMode ? "Cancel pin placement" : draftPosition ? "Move farm pin" : "Place farm pin"}
                </button>
              </div>

              {deviceLocation && <div className="kv-device-coordinates"><span><LocateFixed size={14} /> DEVICE FIX</span><strong>{deviceLocation.lat.toFixed(5)}°, {deviceLocation.lng.toFixed(5)}°</strong><small>±{Math.max(1, Math.round(deviceLocation.accuracy))} m reported accuracy</small></div>}

              <div className="kv-boundary-card">
                <div className="kv-boundary-heading"><span><Crosshair size={15} />Boundary design</span><strong>{draftBoundary.length} pts</strong></div>
                <div className="kv-boundary-summary">
                  <strong>{areaHectares == null ? "—" : areaHectares < 1 ? `${(areaHectares * 10000).toFixed(0)} m²` : `${areaHectares.toFixed(2)} ha`}</strong>
                  <small>{draftBoundary.length >= 3 ? "Approx. mapped area" : "Add at least 3 points to close the outline"}</small>
                </div>
                {drawBoundary ? (
                  <>
                    <div className="kv-boundary-actions">
                      <button type="button" className="kv-outline-action" onClick={() => setDraftBoundary((points) => points.slice(0, -1))} disabled={!draftBoundary.length}><Undo2 size={15} />Undo point</button>
                      <button type="button" className="kv-primary-action" onClick={() => setDrawBoundary(false)} disabled={draftBoundary.length < 3}>Finish outline</button>
                    </div>
                    <button type="button" className="kv-text-action" onClick={cancelBoundaryMode}>Cancel outline</button>
                  </>
                ) : (
                  <button type="button" className="kv-outline-action kv-boundary-start" onClick={startBoundaryMode}><Plus size={15} />{draftBoundary.length >= 3 ? "Redraw boundary" : "Draw farm boundary"}</button>
                )}
                {draftBoundary.length > 0 && !drawBoundary && <button type="button" className="kv-text-action" onClick={() => setDraftBoundary([])}>Clear boundary</button>}
              </div>

              <div className="kv-map-save-area">
                <button className="kv-save-map-button" type="button" onClick={handleSaveMap} disabled={saveState === "saving" || drawBoundary || pinMode || (draftBoundary.length > 0 && draftBoundary.length < 3) || (field && !hasMapEdits) || (!field && !draftPosition && draftBoundary.length < 3)}>
                  {saveState === "saved" ? <Check size={17} /> : <Save size={16} />}
                  {saveState === "saving" ? "Saving map…" : saveState === "saved" ? "Changes saved" : field ? "Save map changes" : "Continue farm setup"}
                </button>
                {saveError && <p className="kv-map-save-error" role="alert">{saveError}</p>}
                {!field && <small className="kv-save-helper">Add a farm name and location to save this map.</small>}
              </div>
            </aside>
          </div>

          <div className="kv-map-data-note"><CircleHelp size={15} /><p>Map imagery provides visual context only. The outlined area is an approximate estimate from your points; confirm surveyed boundaries before using it for legal or financial decisions.</p></div>
        </section>

        <section className="kv-intelligence" aria-labelledby="kv-intelligence-title">
          <div className="kv-intelligence-head"><div><span className="kv-section-kicker">WORKSPACE SIGNALS</span><h2 id="kv-intelligence-title">What’s recorded</h2></div><Link to="/observations" className="kv-quiet-action">View observations<ChevronRight size={16} /></Link></div>
          <div className="kv-intelligence-grid">
            <article className="kv-intelligence-card"><div className="kv-intelligence-icon"><Sprout size={18} /></div><span>Field observations</span><strong>{observations.length}</strong><small>{observations.length ? "Records in this workspace" : "No observations recorded yet"}</small></article>
            <article className="kv-intelligence-card"><div className="kv-intelligence-icon"><Satellite size={18} /></div><span>Imagery source</span><strong>World Imagery</strong><small>Satellite basemap · capture dates vary</small></article>
            <article className="kv-intelligence-card"><div className="kv-intelligence-icon warning"><AlertTriangle size={18} /></div><span>Flagged observations</span><strong>{alertCount}</strong><small>{alertCount ? "Moderate or high severity records" : "No flagged records"}</small></article>
          </div>
        </section>

        <div className="kv-dashboard-footer"><span>KhetVardhan Technologies · Field intelligence</span><button type="button" onClick={() => focusMap(mapCenter || REGIONAL_VIEW)}><Maximize2 size={14} /> Recenter map</button></div>
      </div>

      {(showFieldSetup || location.state?.openFieldSetup) && <FieldSetup
        initialField={setupField}
        onClose={closeFieldSetup}
        onSave={handleSaveField}
      />}
    </main>
  );
}

export default Dashboard;
