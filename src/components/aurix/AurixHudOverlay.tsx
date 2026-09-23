"use client";

import React, { useEffect, useState } from "react";

interface Props {
  progress: number;
  loadedPercent: number;
}

const PHASES = [
  {
    pill: "PM-JAY Infrastructure",
    title: "State-of-the-Art Empanelled Hospitals",
    desc: "Every empanelled hospital meets stringent quality and sanitation benchmarks under the National Health Authority.",
    stats: ["24/7 Emergency", "Ambulance Bay", "Zero Upfront Deposit"],
  },
  {
    pill: "Real-Time Transparency",
    title: "Dissecting Ward & Bed Capacity",
    desc: "Inspect real-time general ward beds, ICU availability, and diagnostic facilities before you visit.",
    stats: ["Live Bed Tracking", "General & Special Wards", "Verified Doctor Roster"],
  },
  {
    pill: "Specialized Treatment",
    title: "Modular Surgery & Critical Care",
    desc: "Advanced OT suites, cardiac cath labs, and pediatric intensive care covered up to ₹5 Lakhs per family.",
    stats: ["Modular OTs", "Cardiac & Oncology", "Digital Pre-Auth"],
  },
  {
    pill: "End-to-End Care",
    title: "Full Hospital Ecosystem",
    desc: "From reception admission to pharmacy discharge — complete cashless discovery powered by CuraNav.",
    stats: ["Cashless Settlement", "Ayushman Mitra Desk", "Instant Claims"],
  },
];

function getPhaseIndex(progress: number): number {
  if (progress < 0.25) return 0;
  if (progress < 0.50) return 1;
  if (progress < 0.75) return 2;
  return 3;
}

export function AurixHudOverlay({ progress, loadedPercent }: Props) {
  const phaseIdx = getPhaseIndex(progress);
  const phase = PHASES[phaseIdx];

  // Animate the scroll cue away after first interaction
  const [showScrollCue, setShowScrollCue] = useState(true);
  useEffect(() => {
    if (progress > 0.02) setShowScrollCue(false);
  }, [progress]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "clamp(1rem, 3vw, 3rem)",
        pointerEvents: "none",
      }}
    >
      {/* ── Top bar ──────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div
          style={{
            display: "none"
          }}
        ></div>

        {/* Phase indicator dots */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {PHASES.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === phaseIdx ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === phaseIdx ? "#3b82f6" : "rgba(255,255,255,0.2)",
                transition: "all 0.4s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Center: storytelling card ─────────────────── */}
      <div style={{ maxWidth: 420, alignSelf: "flex-start" }}>
        <div
          key={phaseIdx}
          style={{
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: "clamp(1rem, 2vw, 1.5rem)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            animation: "fadeSlideUp 0.6s ease-out both",
          }}
        >
          {/* Pill */}
          <span
            style={{
              display: "inline-block",
              padding: "0.25rem 0.75rem",
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: 9999,
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "#93c5fd",
              marginBottom: "0.75rem",
            }}
          >
            {phase.pill}
          </span>

          {/* Title */}
          <h2
            style={{
              fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.2,
              margin: "0 0 0.5rem 0",
            }}
          >
            {phase.title}
          </h2>

          {/* Description */}
          <p
            style={{
              fontSize: "clamp(0.8rem, 1.2vw, 0.95rem)",
              color: "rgba(203,213,225,0.9)",
              lineHeight: 1.6,
              margin: "0 0 1rem 0",
            }}
          >
            {phase.desc}
          </p>

          {/* Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {phase.stats.map((stat, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#60a5fa",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "rgba(226,232,240,0.9)",
                  }}
                >
                  {stat}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom: scrubber + scroll cue ─────────────── */}
      <div>
        {/* Scroll cue */}
        {showScrollCue && (
          <div
            style={{
              textAlign: "center",
              marginBottom: "1rem",
              animation: "fadeSlideUp 1s ease-out both, pulse 2s ease-in-out infinite",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
              }}
            >
              Scroll to explore hospital anatomy ↓
            </span>
          </div>
        )}

        {/* Progress scrubber */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            maxWidth: 640,
            margin: "0 auto",
            width: "100%",
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              fontFamily: "monospace",
              color: "rgba(255,255,255,0.4)",
              width: 36,
              textAlign: "right" as const,
            }}
          >
            {Math.round(progress * 100)}%
          </span>
          <div
            style={{
              flex: 1,
              height: 4,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 2,
              overflow: "hidden",
              position: "relative" as const,
            }}
          >
            <div
              style={{
                position: "absolute" as const,
                top: 0,
                left: 0,
                height: "100%",
                background: "linear-gradient(to right, #3b82f6, #22d3ee)",
                borderRadius: 2,
                width: `${progress * 100}%`,
                transition: "width 0.1s linear",
              }}
            />
          </div>
          <span
            style={{
              fontSize: "0.7rem",
              fontFamily: "monospace",
              color: "rgba(255,255,255,0.4)",
              width: 36,
            }}
          >
            100%
          </span>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
