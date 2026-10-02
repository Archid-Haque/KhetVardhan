import { useNavigate } from "react-router";
import ParticleField from "../../components/ParticleField/ParticleField";

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="kv-hero">
      <ParticleField />

      <div className="kv-container kv-hero-content">
        <div className="kv-hero-badge">
          <span className="kv-status-dot" />
          SATELLITE • AI • DRONE
        </div>

        <h1>
          Intelligence
          <span> for Every Field.</span>
        </h1>

        <p>
          KhetVardhan combines satellite intelligence,
          artificial intelligence and autonomous drone
          technology to help farmers understand their
          fields and act earlier.
        </p>

        <div className="kv-hero-actions">
          <button
            className="kv-primary-button"
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            Explore Your Field
          </button>

          <button
            className="kv-secondary-button"
            type="button"
            onClick={() => navigate("/satellite")}
          >
            Discover KhetVardhan
          </button>
        </div>

        <div className="kv-hero-meta">
          <div>
            <strong>🛰️</strong>
            <span>Satellite Intelligence</span>
          </div>

          <div>
            <strong>🌱</strong>
            <span>Crop Health</span>
          </div>

          <div>
            <strong>🚁</strong>
            <span>Drone Ready</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;