"use client";

import { useRef } from "react";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import Link from "next/link";

/**
 * AnimatedHero
 *
 * Token usage:
 *   - Spacing:    section py via --section-padding-y + pt-32/pt-40 (nav offset)
 *   - Typography: .text-display for h1, --text-body-xl for subtext
 *   - Colors:     --color-brand-500 for accent, --color-fg-muted for body
 *   - Motion:     --duration-slower + --ease-expo-out cubic-bezier
 *   - Radius:     --radius-full for pill badge and buttons
 *   - Shadow:     --shadow-brand-lg on primary CTA
 *   - Borders:    --color-border-default on secondary button
 */

// Framer Motion variant using system duration + easing tokens
const EASE_EXPO_OUT = [0.16, 1, 0.3, 1] as const;
const DURATION_SLOWER = 0.6;

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION_SLOWER,
      delay: i * 0.1,
      ease: EASE_EXPO_OUT,
    },
  }),
};

export function AnimatedHero() {
  const heroRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const { left, top } = heroRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden px-6 pt-28 pb-16 text-center md:px-8 md:pt-36 md:pb-24 border-b border-border"
      style={{ background: "var(--color-bg-base)" }}
    >
      {/* Ambient hero gradient (always visible, no mouse required) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero-glow)" }}
      />

      {/* Subtle grid lines */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-neutral-200) 1px, transparent 1px), linear-gradient(to bottom, var(--color-neutral-200) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Mouse-tracking glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          opacity: 0.25,
          background: useMotionTemplate`radial-gradient(480px circle at ${mouseX}px ${mouseY}px, var(--color-brand-500), transparent 80%)`,
        }}
      />

      {/* Soft blob — top left */}
      <div
        className="pointer-events-none absolute -top-16 -left-16 -z-10 h-80 w-80 rounded-full blur-[120px]"
        style={{ background: "var(--color-brand-100)" }}
      />

      {/* Content */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        custom={0}
        className="relative z-10 mx-auto"
        style={{ maxWidth: "var(--container-xl)" }}
      >
        {/* Eyebrow */}
        <motion.span
          variants={fadeInUp}
          custom={1}
          className="badge-pill mb-8 inline-block"
        >
          Government Data · AI Matched
        </motion.span>

        {/* Headline */}
        <motion.h1
          variants={fadeInUp}
          custom={2}
          className="text-display mx-auto"
          style={{ maxWidth: "var(--container-lg)" }}
        >
          Find the Right{" "}
          <span className="text-gradient-brand">Hospital</span>
          {" "}for You
        </motion.h1>

        {/* Subtext */}
        <motion.p
          variants={fadeInUp}
          custom={3}
          className="mx-auto mt-6 md:mt-8"
          style={{
            maxWidth: "var(--container-md)",
            fontSize: "var(--text-body-xl)",
            color: "var(--color-fg-muted)",
            lineHeight: "var(--leading-relaxed)",
          }}
        >
          Search 79 PM-JAY empanelled hospitals across 17 specialties.
          Compare costs, outcomes, and certifications — powered by
          transparent data.
        </motion.p>

        {/* Stat strip */}
        <motion.div
          variants={fadeInUp}
          custom={4}
          className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2"
          style={{ fontSize: "var(--text-body-sm)", color: "var(--color-fg-subtle)" }}
        >
          <span className="flex items-center gap-2">
            <span
              className="font-tabular font-bold"
              style={{ color: "var(--color-brand-600)", fontSize: "var(--text-h4)" }}
            >
              79
            </span>{" "}
            Hospitals
          </span>
          <span
            aria-hidden
            style={{ color: "var(--color-border-strong)" }}
          >
            ·
          </span>
          <span className="flex items-center gap-2">
            <span
              className="font-tabular font-bold"
              style={{ color: "var(--color-brand-600)", fontSize: "var(--text-h4)" }}
            >
              17
            </span>{" "}
            Specialties
          </span>
          <span
            aria-hidden
            style={{ color: "var(--color-border-strong)" }}
          >
            ·
          </span>
          <span className="flex items-center gap-2">
            <span
              className="font-tabular font-bold"
              style={{ color: "var(--color-success)", fontSize: "var(--text-h4)" }}
            >
              ₹0
            </span>{" "}
            PM-JAY Copay
          </span>
        </motion.div>

        {/* CTAs */}
        <motion.div
          variants={fadeInUp}
          custom={5}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center"
          style={{ gap: "var(--space-4)" }}
        >
          <Button
            size="lg"
            render={<Link href="/find-hospital" />}
            style={{
              borderRadius: "var(--radius-full)",
              boxShadow: "var(--shadow-brand-lg)",
              height: "3rem",
              paddingInline: "var(--space-8)",
              fontSize: "var(--text-body-md)",
              fontWeight: "var(--weight-semibold)",
              width: "100%",
            }}
            className="sm:w-auto"
          >
            <Search className="mr-2 h-5 w-5" />
            Find a Hospital
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/search?nearby=true" />}
            style={{
              borderRadius: "var(--radius-full)",
              height: "3rem",
              paddingInline: "var(--space-8)",
              fontSize: "var(--text-body-md)",
              fontWeight: "var(--weight-medium)",
              background: "color-mix(in srgb, var(--color-bg-base) 80%, transparent)",
              backdropFilter: "blur(8px)",
              width: "100%",
            }}
            className="sm:w-auto"
          >
            <MapPin
              className="mr-2 h-5 w-5"
              style={{ color: "var(--color-brand-500)" }}
            />
            Use my location
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
