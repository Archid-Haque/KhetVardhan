import { useState } from "react";

import FieldSetup from "../../components/FieldSetup/FieldSetup";
import FieldMapSwitcher from "../../components/FieldMapSwitcher/FieldMapSwitcher";

import "./Dashboard.css";

function Dashboard() {
  const [showFieldSetup, setShowFieldSetup] = useState(false);

  const [field, setField] = useState(() => {
    try {
      const savedField = localStorage.getItem(
        "khetvardhan-field"
      );

      return savedField
        ? JSON.parse(savedField)
        : null;
    } catch {
      return null;
    }
  });

  const handleSaveField = (fieldData) => {
    setField(fieldData);

    localStorage.setItem(
      "khetvardhan-field",
      JSON.stringify(fieldData)
    );

    setShowFieldSetup(false);
  };

  return (
    <main className="kv-dashboard">

      {/* =====================================================
          DASHBOARD HEADER
      ===================================================== */}

      <section className="kv-dashboard-header">

        <div>

          <span className="kv-dashboard-eyebrow">
            KHETVARDHAN • FIELD INTELLIGENCE
          </span>

          <h1>
            Your Field
            <span> Intelligence.</span>
          </h1>

          <p>
            Understand your farm through satellite data,
            crop health insights and intelligent alerts.
          </p>

        </div>

        <div className="kv-dashboard-status">

          <span className="kv-status-dot" />

          SYSTEM ONLINE

        </div>

      </section>


      {/* =====================================================
          FIELD OVERVIEW
      ===================================================== */}

      <section className="kv-field-overview">

        <div className="kv-section-heading">

          <div>

            <span>
              FIELD OVERVIEW
            </span>

            <h2>
              {field ? field.name : "Your Farm"}
            </h2>

          </div>


          <button
            className="kv-field-selector"
            type="button"
            onClick={() => setShowFieldSetup(true)}
          >

            <span>
              📍
            </span>

            {field
              ? "Change Field"
              : "Select Field"}

            <span className="kv-selector-arrow">
              ⌄
            </span>

          </button>

        </div>


        <div className="kv-field-card">

          {/* =================================================
              2D / 3D FIELD MAP
          ================================================= */}

          <div className="kv-field-map">

            <FieldMapSwitcher

              position={
                field?.latitude != null &&
                field?.longitude != null
                  ? {
                      lat: field.latitude,
                      lng: field.longitude,
                    }
                  : null
              }

              /*
               * IMPORTANT:
               *
               * The exact same saved boundary is
               * passed to both the 2D Leaflet map
               * and the 3D Cesium map.
               *
               * This means switching between 2D
               * and 3D will NOT remove the field
               * boundary.
               */

              boundary={
                Array.isArray(field?.boundary)
                  ? field.boundary
                  : []
              }

            />

          </div>


          {/* =================================================
              FIELD DETAILS
          ================================================= */}

          <div className="kv-field-details">

            <span className="kv-card-eyebrow">

              {field
                ? "CURRENT FIELD"
                : "NO FIELD CONNECTED"}

            </span>


            <h3>

              {field
                ? field.name
                : "Select your field"}

            </h3>


            <p>

              {field ? (

                <>

                  📍 {field.location}

                  {field.crop && (
                    <>
                      <br />
                      🌱 {field.crop}
                    </>
                  )}

                  {field.latitude != null &&
                    field.longitude != null && (

                    <>
                      <br />

                      <small>
                        {field.latitude.toFixed(5)}
                        {", "}
                        {field.longitude.toFixed(5)}
                      </small>
                    </>

                  )}

                  {Array.isArray(field.boundary) &&
                    field.boundary.length >= 3 && (

                    <>
                      <br />

                      <small>
                        ◇ Boundary defined •{" "}
                        {field.boundary.length} points
                      </small>
                    </>

                  )}

                </>

              ) : (

                "Connect a field to start receiving satellite-powered intelligence."

              )}

            </p>


            <button
              className="kv-connect-button"
              type="button"
              onClick={() => setShowFieldSetup(true)}
            >

              {field
                ? "Update Field"
                : "Add Your Field"}

              <span>
                →
              </span>

            </button>

          </div>

        </div>

      </section>


      {/* =====================================================
          FIELD INTELLIGENCE
      ===================================================== */}

      <section className="kv-intelligence">

        <div className="kv-section-heading">

          <div>

            <span>
              FIELD INTELLIGENCE
            </span>

            <h2>
              What we know
            </h2>

          </div>

        </div>


        <div className="kv-intelligence-grid">


          {/* CROP HEALTH */}

          <article className="kv-intelligence-card">

            <div className="kv-card-icon">
              🌱
            </div>

            <span>
              Crop Health
            </span>

            <strong>
              —
            </strong>

            <small>
              Waiting for satellite data
            </small>

          </article>


          {/* SATELLITE STATUS */}

          <article className="kv-intelligence-card">

            <div className="kv-card-icon">
              🛰️
            </div>

            <span>
              Satellite Status
            </span>

            <strong>
              Ready
            </strong>

            <small>
              Satellite monitoring available
            </small>

          </article>


          {/* FIELD ALERTS */}

          <article className="kv-intelligence-card">

            <div className="kv-card-icon">
              ⚠️
            </div>

            <span>
              Field Alerts
            </span>

            <strong>
              0
            </strong>

            <small>
              No active alerts
            </small>

          </article>


        </div>

      </section>


      {/* =====================================================
          FIELD SETUP MODAL
      ===================================================== */}

      {showFieldSetup && (

        <FieldSetup

          onClose={() =>
            setShowFieldSetup(false)
          }

          onSave={handleSaveField}

        />

      )}

    </main>
  );
}

export default Dashboard;