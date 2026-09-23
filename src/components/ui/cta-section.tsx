"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

/**
 * CTASection
 *
 * Token usage:
 *   - Background:  --gradient-dark (dark slate, not plain blue)
 *   - Glow:        SVG radial gradient at --color-brand-500/20 — no external image
 *   - Padding:     --section-padding-y
 *   - Typography:  --font-display, --text-display-xl, --weight-extrabold
 *   - Button:      --radius-full, shadow-brand-lg, padding tokens
 *   - Motion:      scale + opacity entrance, --ease-expo-out
 */

const EASE_EXPO_OUT = [0.16, 1, 0.3, 1] as const;

export function CTASection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        padding: "var(--section-padding-y) var(--container-px)",
        background: "var(--gradient-dark)",
      }}
    >
      {/* Radial glow — no external deps */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(59,130,246,0.18), transparent 70%)",
        }}
      />

      {/* Geometric grid — purely CSS, no external image */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div
        className="container-base relative z-10 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: EASE_EXPO_OUT }}
          style={{ maxWidth: "var(--container-md)", marginInline: "auto" }}
        >
          {/* Eyebrow */}
          <div
            className="inline-flex items-center mb-6"
            style={{
              gap: "var(--space-2)",
              borderRadius: "var(--radius-full)",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              padding: "var(--space-1) var(--space-4)",
              fontSize: "var(--text-body-xs)",
              fontWeight: "var(--weight-bold)",
              letterSpacing: "var(--tracking-widest)",
              textTransform: "uppercase",
              color: "var(--color-brand-300)",
            }}
          >
            <Sparkles
              style={{ width: "0.875rem", height: "0.875rem" }}
            />
            Verified Healthcare Data
          </div>

          {/* Headline */}
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-display-xl)",
              fontWeight: "var(--weight-extrabold)",
              letterSpacing: "var(--tracking-tightest)",
              lineHeight: "var(--leading-tight)",
              color: "#ffffff",
              marginBottom: "var(--space-6)",
            }}
          >
            Ready to find the right care?
          </h2>

          {/* Body */}
          <p
            style={{
              fontSize: "var(--text-body-lg)",
              lineHeight: "var(--leading-relaxed)",
              color: "rgba(241,245,249,0.75)",
              marginBottom: "var(--space-10)",
            }}
          >
            Stop guessing. Start comparing. Get access to verified hospital
            data, patient outcomes, and transparent PM-JAY cost breakdowns
            — instantly.
          </p>

          {/* CTA Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ display: "inline-flex" }}
          >
            <Button
              size="lg"
              render={<Link href="/find-hospital" />}
              style={{
                borderRadius: "var(--radius-full)",
                height: "3.5rem",
                paddingInline: "var(--space-10)",
                fontSize: "var(--text-body-lg)",
                fontWeight: "var(--weight-semibold)",
                background: "#ffffff",
                color: "var(--color-brand-700)",
                boxShadow: "0 0 40px rgba(255,255,255,0.15), var(--shadow-xl)",
                transition: "box-shadow var(--duration-normal) var(--ease-out)",
              }}
            >
              Search Hospitals Now
              <ArrowRight
                style={{
                  marginLeft: "var(--space-3)",
                  width: "1.25rem",
                  height: "1.25rem",
                }}
              />
            </Button>
          </motion.div>

          {/* Trust micro-copy */}
          <p
            style={{
              marginTop: "var(--space-5)",
              fontSize: "var(--text-body-xs)",
              color: "rgba(148,163,184,0.8)",
              letterSpacing: "var(--tracking-wide)",
            }}
          >
            Free · No account required · Government-verified data
          </p>
        </motion.div>
      </div>
    </section>
  );
}
