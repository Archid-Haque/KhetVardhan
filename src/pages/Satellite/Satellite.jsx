import { useEffect, useState } from "react";
import {
  Satellite as SatelliteIcon,
  MapPin,
  Sprout,
  Activity,
  ShieldCheck,
  Radio,
  ScanLine,
} from "lucide-react";

import "./Satellite.css";

function Satellite() {
  const [field, setField] = useState(null);

  useEffect(() => {
    try {
      const savedField = localStorage.getItem("khetvardhan-field");

      if (savedField) {
        setField(JSON.parse(savedField));
      }
    } catch (error) {
      console.error("Unable to load field data:", error);
    }
  }, []);

  return (
    <main className="kv-satellite-page">

      {/* HERO */}
      <section className="kv-satellite-hero">
        <div className="kv-satellite-container">

          <div className="kv-satellite-eyebrow">
            <span className="kv-status-dot" />
            SATELLITE INTELLIGENCE
          </div>

          <h1>
            See what your
            <span> field can't.</span>
          </h1>

          <p>
            KhetVardhan uses satellite observation to understand
            vegetation, field conditions and changes over time.
          </p>

          <div className="kv-satellite-status">
            <div className="kv-satellite-status-icon">
              <SatelliteIcon size={18} />
            </div>

            <div>
              <strong>MONITORING READY</strong>
              <span>
                Satellite intelligence is ready for your field.
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* CONNECTED FIELD */}
      <section className="kv-satellite-section">

        <div className="kv-satellite-container">

          <div className="kv-satellite-section-heading">
            <span>CONNECTED FIELD</span>

            <h2>
              {field?.name || "No field connected"}
            </h2>
          </div>

          {field ? (
            <div className="kv-satellite-field-card">

              <div className="kv-satellite-field-main">

                <div className="kv-satellite-field-icon">
                  <Sprout size={28} />
                </div>

                <div>
                  <span className="kv-card-eyebrow">
                    CURRENT FIELD
                  </span>

                  <h3>{field.name}</h3>

                  <p>
                    <MapPin size={15} />
                    {field.location}
                  </p>
                </div>

              </div>

              <div className="kv-satellite-field-data">

                <div>
                  <span>LATITUDE</span>
                  <strong>
                    {field.latitude
                      ? Number(field.latitude).toFixed(6)
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span>LONGITUDE</span>
                  <strong>
                    {field.longitude
                      ? Number(field.longitude).toFixed(6)
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span>CROP</span>
                  <strong>
                    {field.crop || "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>BOUNDARY</span>
                  <strong>
                    {field.boundary?.length
                      ? `${field.boundary.length} points`
                      : "Not defined"}
                  </strong>
                </div>

              </div>

            </div>
          ) : (
            <div className="kv-satellite-empty">
              <MapPin size={28} />

              <h3>
                Connect a field first
              </h3>

              <p>
                Add your field from the dashboard to begin
                satellite monitoring.
              </p>
            </div>
          )}

        </div>

      </section>

      {/* OBSERVATION */}
      <section className="kv-satellite-section">

        <div className="kv-satellite-container">

          <div className="kv-satellite-section-heading">
            <span>SATELLITE OBSERVATION</span>

            <h2>
              Field imagery
            </h2>
          </div>

          <div className="kv-satellite-imagery-card">

            <div className="kv-satellite-imagery-visual">

              <div className="kv-imagery-grid" />

              <div className="kv-imagery-center">

                <div className="kv-imagery-icon">
                  <SatelliteIcon size={30} />
                </div>

                <span>
                  WAITING FOR IMAGERY
                </span>

              </div>

            </div>

            <div className="kv-satellite-imagery-info">

              <div className="kv-card-eyebrow">
                SATELLITE IMAGERY
              </div>

              <h3>
                Awaiting observation
              </h3>

              <p>
                Once satellite imagery is connected, this area
                will display your field's latest observation.
              </p>

              <div className="kv-observation-details">

                <div>
                  <span>FIELD ID</span>
                  <strong>
                    {field?.name || "—"}
                  </strong>
                </div>

                <div>
                  <span>LAST OBSERVATION</span>
                  <strong>—</strong>
                </div>

                <div>
                  <span>OBSERVATION STATUS</span>
                  <strong className="kv-status-waiting">
                    Waiting
                  </strong>
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* SYSTEM STATUS */}
      <section className="kv-satellite-section kv-satellite-status-section">

        <div className="kv-satellite-container">

          <div className="kv-satellite-section-heading">
            <span>SYSTEM STATUS</span>

            <h2>
              Intelligence pipeline
            </h2>
          </div>

          <div className="kv-satellite-status-grid">

            <div className="kv-satellite-status-card">
              <div className="kv-status-card-icon">
                <Radio size={21} />
              </div>

              <span>
                Satellite connection
              </span>

              <strong>
                Ready
              </strong>
            </div>

            <div className="kv-satellite-status-card">
              <div className="kv-status-card-icon">
                <MapPin size={21} />
              </div>

              <span>
                Field coordinates
              </span>

              <strong>
                {field ? "Connected" : "Waiting"}
              </strong>
            </div>

            <div className="kv-satellite-status-card">
              <div className="kv-status-card-icon">
                <Activity size={21} />
              </div>

              <span>
                Imagery
              </span>

              <strong>
                Waiting
              </strong>
            </div>

            <div className="kv-satellite-status-card">
              <div className="kv-status-card-icon">
                <ShieldCheck size={21} />
              </div>

              <span>
                AI analysis
              </span>

              <strong>
                Ready
              </strong>
            </div>

          </div>

        </div>

      </section>

      {/* NEXT PIPELINE */}
      <section className="kv-satellite-final">

        <div className="kv-satellite-container">

          <div className="kv-satellite-final-card">

            <div>
              <span className="kv-card-eyebrow">
                NEXT
              </span>

              <h2>
                Satellite → AI → Action
              </h2>

              <p>
                KhetVardhan will turn raw satellite observations
                into understandable field intelligence and,
                eventually, drone-ready actions.
              </p>
            </div>

            <div className="kv-satellite-final-icon">
              <ScanLine size={30} />
            </div>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Satellite;