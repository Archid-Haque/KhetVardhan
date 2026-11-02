import { useNavigate } from "react-router";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Crosshair, Radar, Satellite, Sprout } from "lucide-react";
import "./Home.css";

function Propeller({ x, y, angle }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`} className="kv-drone-propeller">
      <path className="kv-propeller-blade" d="M-78 -4C-62 -10-31 -8-9 -3L-7 2C-31 7-59 7-77 4Z" />
      <path className="kv-propeller-blade" transform="rotate(180)" d="M-78 -4C-62 -10-31 -8-9 -3L-7 2C-31 7-59 7-77 4Z" />
      <circle className="kv-motor" r="15" />
      <circle className="kv-motor-cap" r="6" />
    </g>
  );
}

function AgriculturalDrone() {
  return (
    <svg className="kv-drone-art" viewBox="0 0 760 470" role="img" aria-label="Agricultural inspection drone, viewed from above">
      <defs>
        <linearGradient id="drone-shell" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#758273"/><stop offset=".48" stopColor="#424d42"/><stop offset="1" stopColor="#273229"/></linearGradient>
        <linearGradient id="drone-arm" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#596657"/><stop offset=".5" stopColor="#354137"/><stop offset="1" stopColor="#283229"/></linearGradient>
        <linearGradient id="drone-glass" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d0ddbe"/><stop offset=".45" stopColor="#708d69"/><stop offset="1" stopColor="#34483b"/></linearGradient>
        <filter id="drone-shadow" x="-30%" y="-35%" width="160%" height="180%"><feDropShadow dx="0" dy="18" stdDeviation="15" floodColor="#26332a" floodOpacity=".24"/></filter>
      </defs>

      <g className="kv-drone-frame" strokeLinejoin="round" strokeLinecap="round">
        <g fill="url(#drone-arm)" stroke="#788475" strokeOpacity=".6" strokeWidth="2">
          <path d="m327 207-174-90 15-28 207 91z" />
          <path d="m433 207 174-90-15-28-207 91z" />
          <path d="m327 255-174 90 15 28 207-91z" />
          <path d="m433 255 174 90-15 28-207-91z" />
        </g>

        <g filter="url(#drone-shadow)">
          <g fill="#303b32" stroke="#647161" strokeWidth="3">
            <path d="m300 177 75-29 79 29 32 42-23 49-88 32-83-30-29-46z" />
            <path d="m320 186 54-21 61 21 22 31-18 36-66 24-61-23-20-31z" fill="url(#drone-shell)" />
          </g>
          <path d="m307 179 68-25 71 25" fill="none" stroke="#aab4a3" strokeOpacity=".7" strokeWidth="4" />
          <path d="m299 265 77 28 80-29" fill="none" stroke="#253028" strokeWidth="6" />
          <path d="M346 185h65l22 22-13 34-51 20-47-18-13-24z" fill="#29352d" stroke="#84917f" strokeOpacity=".7" strokeWidth="2" />
          <path d="M360 265v24m34-25v25" stroke="#8b9787" strokeWidth="5" />
          <path d="m360 289 34 1 13 21-24 15-25-15z" fill="#29352d" stroke="#778573" strokeWidth="2" />
          <circle cx="383" cy="314" r="19" fill="#202a23" stroke="#768472" strokeWidth="3" />
          <circle cx="383" cy="314" r="11" fill="url(#drone-glass)" />
          <circle cx="379" cy="310" r="3.5" fill="#edf1df" fillOpacity=".88" />
          <path d="M360 174q20-22 42-1" fill="none" stroke="#aab5a4" strokeOpacity=".8" strokeWidth="3" />
        </g>
      </g>

      <Propeller x={143} y={109} angle={-24} />
      <Propeller x={617} y={109} angle={24} />
      <Propeller x={143} y={358} angle={24} />
      <Propeller x={617} y={358} angle={-24} />
    </svg>
  );
}

const steps = [
  ["01", "Notice a change", "Review satellite observations alongside your field records."],
  ["02", "Add context", "Bring crop notes and what your team has seen into the picture."],
  ["03", "Take a closer look", "Plan an inspection for the area that needs another visit."],
  ["04", "Follow up", "Record what happened so the next decision has better context."],
];

function Hero() {
  const navigate = useNavigate();
  return (
    <main className="kv-home">
      <section className="kv-home-hero">
        <div className="kv-home-content">
          <span className="kv-home-kicker">A clearer view of every field</span>
          <h1>Know your farm.<br /><em>Choose what to do next.</em></h1>
          <p>KhetVardhan brings field records, satellite observations and drone inspection plans into one place, helping your team decide what needs a closer look.</p>
          <div className="kv-home-actions">
            <button type="button" className="kv-home-primary" onClick={() => navigate("/dashboard")}>Open the workspace <ArrowRight size={17} /></button>
            <button type="button" className="kv-home-secondary" onClick={() => navigate("/account")}>Sign in or create an account <ArrowUpRight size={16} /></button>
          </div>
          <div className="kv-home-footnote"><Check size={14} /> Your team stays in control of each field decision</div>
        </div>
        <div className="kv-drone-stage">
          <div className="kv-drone-stage-light" />
          <AgriculturalDrone />
        </div>
        <a className="kv-home-scroll" href="#platform"><ArrowDown size={14} /> How it works</a>
      </section>

      <section className="kv-home-capabilities" id="platform">
        <div className="kv-home-section-head">
          <div><span className="kv-home-overline">A practical field workflow</span><h2>From the first observation<br />to the next field visit.</h2></div>
          <p>Keep the information your team needs together, then make a plan that fits the work on the ground.</p>
        </div>
        <div className="kv-home-steps">
          {steps.map(([number, title, detail], index) => (
            <article className="kv-home-step" key={number}>
              <div className="kv-step-line"><span>{number}</span></div>
              <div className="kv-step-icon">{index === 0 ? <Satellite /> : index === 1 ? <Radar /> : index === 2 ? <Crosshair /> : <Sprout />}</div>
              <h3>{title}</h3><p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="kv-home-drone-band">
        <div className="kv-drone-copy">
          <span className="kv-home-overline">Drone inspection planning</span>
          <h2>Give every visit<br /><em>a clear purpose.</em></h2>
          <p>Set the field, area and objective before work begins. Your team can review the plan and add the notes an operator needs on site.</p>
          <button type="button" onClick={() => navigate("/missions")}>View mission planning <ArrowRight size={16} /></button>
        </div>
        <div className="kv-drone-principles">
          <div><span>01</span><strong>Clear objective</strong><small>Know what the visit should answer</small></div>
          <div><span>02</span><strong>Useful field notes</strong><small>Keep local context with the plan</small></div>
          <div><span>03</span><strong>Operator review</strong><small>People remain responsible for flight</small></div>
        </div>
      </section>
    </main>
  );
}

export default Hero;
