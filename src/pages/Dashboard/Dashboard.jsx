import { useState } from "react";
import FieldSetup from "../../components/FieldSetup/FieldSetup";
import FieldMap from "../../components/FieldMap/FieldMap";

import "./Dashboard.css";

function Dashboard() {
  const [showFieldSetup, setShowFieldSetup] = useState(false);

  const [field, setField] = useState(() => {
    try {
      const savedField = localStorage.getItem("khetvardhan-field");
      return savedField ? JSON.parse(savedField) : null;
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

      {/* Dashboard Header */}
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


      {/* Field Overview */}
      <section className="kv-field-overview">

        <div className="kv-section-heading">
          <div>
            <span>FIELD OVERVIEW</span>

            <h2>
              {field ? field.name : "Your Farm"}
            </h2>
          </div>

          <button
            className="kv-field-selector"
            type="button"
            onClick={() => setShowFieldSetup(true)}
          >
            <span>📍</span>

            {field ? "Change Field" : "Select Field"}

            <span className="kv-selector-arrow">
              ⌄
            </span>
          </button>
        </div>


        <div className="kv-field-card">

          {/* REAL MAP */}
          <div className="kv-field-map">
            <FieldMap
              position={
                field?.latitude && field?.longitude
                  ? {
                      lat: field.latitude,
                      lng: field.longitude,
                    }
                  : null
              }
            />
          </div>


          {/* Field Details */}
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

                  {field.latitude && field.longitude && (
                    <>
                      <br />
                      <small>
                        {field.latitude.toFixed(5)},{" "}
                        {field.longitude.toFixed(5)}
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

              <span>→</span>
            </button>

          </div>
        </div>

      </section>


      {/* Intelligence Cards */}
      <section className="kv-intelligence">

        <div className="kv-section-heading">
          <div>
            <span>FIELD INTELLIGENCE</span>

            <h2>
              What we know
            </h2>
          </div>
        </div>


        <div className="kv-intelligence-grid">

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


      {/* Field Setup Modal */}
      {showFieldSetup && (
        <FieldSetup
          onClose={() => setShowFieldSetup(false)}
          onSave={handleSaveField}
        />
      )}

    </main>
  );
}

export default Dashboard;