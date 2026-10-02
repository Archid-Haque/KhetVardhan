import { useEffect, useRef } from "react";

const COLORS = [
  "rgba(120, 255, 100, 0.95)",
  "rgba(91, 220, 92, 0.85)",
  "rgba(173, 255, 135, 0.9)",
  "rgba(63, 190, 85, 0.75)",
];

function getParticleCount(width) {
  if (width < 600) return 90;
  if (width < 1000) return 160;
  return 280;
}

function createParticle(width, height) {
  // Keep particles mainly around the visual hero area
  const x = width * (0.18 + Math.random() * 0.75);
  const y = height * (0.12 + Math.random() * 0.78);

  const large = Math.random() < 0.12;

  return {
    x,
    y,

    baseX: x,
    baseY: y,

    // Natural floating movement
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.14,

    // Slow individual orbital rotation
    rotationSpeed:
      (Math.random() - 0.5) * 0.0007,

    radius: large
      ? Math.random() * 2.2 + 1.4
      : Math.random() * 1.2 + 0.35,

    alpha: large
      ? Math.random() * 0.35 + 0.55
      : Math.random() * 0.4 + 0.2,

    pulse: Math.random() * Math.PI * 2,

    pulseSpeed:
      Math.random() * 0.015 + 0.004,

    color:
      COLORS[Math.floor(Math.random() * COLORS.length)],

    large,
  };
}

export default function ParticleField() {
  const canvasRef = useRef(null);

  const mouseRef = useRef({
    x: -1000,
    y: -1000,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    let particles = [];

    let animationFrame = null;
    let lastTime = 0;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // --------------------------------------------------
    // MOUSE / POINTER
    // --------------------------------------------------

    const handlePointerMove = (event) => {
      mouseRef.current.x = event.clientX;
      mouseRef.current.y = event.clientY;
      mouseRef.current.active = true;
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    // --------------------------------------------------
    // RESIZE
    // --------------------------------------------------

    const resize = () => {
      const rect = canvas.getBoundingClientRect();

      width = rect.width;
      height = rect.height;

      // Prevent extremely high-DPI displays from
      // creating unnecessary GPU/CPU load.
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );

      const count = getParticleCount(width);

      particles = Array.from(
        { length: count },
        () => createParticle(width, height)
      );

      draw(0);
    };

    // --------------------------------------------------
    // DRAW PARTICLE
    // --------------------------------------------------

    const drawParticle = (particle, time) => {
      const pulse =
        Math.sin(
          particle.pulse +
            time * particle.pulseSpeed
        ) * 0.18;

      const alpha = Math.max(
        0.05,
        Math.min(
          1,
          particle.alpha + pulse
        )
      );

      // ----------------------------------------------
      // LARGE PARTICLE GLOW
      // ----------------------------------------------

      if (particle.large) {
        const glow = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 5
        );

        glow.addColorStop(
          0,
          particle.color.replace(
            /[\d.]+\)$/,
            `${alpha})`
          )
        );

        glow.addColorStop(
          0.35,
          particle.color.replace(
            /[\d.]+\)$/,
            `${alpha * 0.35})`
          )
        );

        glow.addColorStop(
          1,
          "rgba(80, 255, 90, 0)"
        );

        ctx.fillStyle = glow;

        ctx.beginPath();

        ctx.arc(
          particle.x,
          particle.y,
          particle.radius * 5,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }

      // ----------------------------------------------
      // PARTICLE CORE
      // ----------------------------------------------

      ctx.fillStyle = particle.color.replace(
        /[\d.]+\)$/,
        `${alpha})`
      );

      ctx.beginPath();

      ctx.arc(
        particle.x,
        particle.y,
        particle.radius,
        0,
        Math.PI * 2
      );

      ctx.fill();
    };

    // --------------------------------------------------
    // STATIC DRAW
    // --------------------------------------------------

    const draw = (time) => {
      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      for (const particle of particles) {
        drawParticle(
          particle,
          time
        );
      }
    };

    // --------------------------------------------------
    // ANIMATION
    // --------------------------------------------------

    const animate = (time) => {
      if (!lastTime) {
        lastTime = time;
      }

      const delta = Math.min(
        (time - lastTime) / 16.67,
        2
      );

      lastTime = time;

      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      // Center of the particle field
      const centerX = width * 0.62;
      const centerY = height * 0.48;

      for (const particle of particles) {
        // --------------------------------------------
        // NATURAL FLOATING MOVEMENT
        // --------------------------------------------

        particle.x +=
          particle.vx * delta;

        particle.y +=
          particle.vy * delta;

        // --------------------------------------------
        // SLOW ROTATION AROUND FIELD CENTER
        // --------------------------------------------

        const dx =
          particle.x - centerX;

        const dy =
          particle.y - centerY;

        const distance =
          Math.sqrt(
            dx * dx + dy * dy
          );

        if (distance > 1) {
          const currentAngle =
            Math.atan2(dy, dx);

          const newAngle =
            currentAngle +
            particle.rotationSpeed *
              delta;

          particle.x =
            centerX +
            Math.cos(newAngle) *
              distance;

          particle.y =
            centerY +
            Math.sin(newAngle) *
              distance;
        }

        // --------------------------------------------
        // CURSOR INTERACTION
        // --------------------------------------------

        if (
          mouseRef.current.active
        ) {
          const mouseX =
            mouseRef.current.x;

          const mouseY =
            mouseRef.current.y;

          const mouseDX =
            particle.x - mouseX;

          const mouseDY =
            particle.y - mouseY;

          const mouseDistance =
            Math.sqrt(
              mouseDX * mouseDX +
                mouseDY * mouseDY
            );

          const interactionRadius = 140;

          if (
            mouseDistance <
              interactionRadius &&
            mouseDistance > 0
          ) {
            const force =
              (interactionRadius -
                mouseDistance) /
              interactionRadius;

            particle.x +=
              (mouseDX /
                mouseDistance) *
              force *
              1.5;

            particle.y +=
              (mouseDY /
                mouseDistance) *
              force *
              1.5;
          }
        }

        // --------------------------------------------
        // SOFT ORGANIC MOVEMENT
        // --------------------------------------------

        particle.x +=
          Math.sin(
            time * 0.00025 +
              particle.baseY
          ) * 0.025;

        particle.y +=
          Math.cos(
            time * 0.0002 +
              particle.baseX
          ) * 0.02;

        // --------------------------------------------
        // PULSE
        // --------------------------------------------

        particle.pulse +=
          particle.pulseSpeed *
          delta;

        // --------------------------------------------
        // WRAP AROUND EDGES
        // --------------------------------------------

        if (particle.x < -10) {
          particle.x =
            width + 10;
        }

        if (particle.x > width + 10) {
          particle.x = -10;
        }

        if (particle.y < -10) {
          particle.y =
            height + 10;
        }

        if (particle.y > height + 10) {
          particle.y = -10;
        }

        // --------------------------------------------
        // DRAW
        // --------------------------------------------

        drawParticle(
          particle,
          time
        );
      }

      animationFrame =
        requestAnimationFrame(
          animate
        );
    };

    // --------------------------------------------------
    // INITIALIZE
    // --------------------------------------------------

    resize();

    window.addEventListener(
      "resize",
      resize
    );

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true }
    );

    window.addEventListener(
      "pointerleave",
      handlePointerLeave
    );

    if (!reducedMotion) {
      animationFrame =
        requestAnimationFrame(
          animate
        );
    }

    // --------------------------------------------------
    // CLEANUP
    // --------------------------------------------------

    return () => {
      window.removeEventListener(
        "resize",
        resize
      );

      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      window.removeEventListener(
        "pointerleave",
        handlePointerLeave
      );

      if (animationFrame) {
        cancelAnimationFrame(
          animationFrame
        );
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}