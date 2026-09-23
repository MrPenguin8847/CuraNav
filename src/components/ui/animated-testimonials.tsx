"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/**
 * AnimatedTestimonials
 *
 * Token usage:
 *   - Section:      --section-padding-y, --section-gap
 *   - Cards:        .card-base utility (radius-2xl, shadow-sm, padding-8)
 *   - Featured:     center card gets ring + scale + shadow-lg (system elevation)
 *   - Motion:       EASE_EXPO_OUT, stagger 0.1 per card, viewport once
 *   - Typography:   --font-display for section h2, --text-body-sm for quote
 *   - Colors:       --color-warning for stars, --color-brand for avatars
 */

const EASE_EXPO_OUT = [0.16, 1, 0.3, 1] as const;

const testimonials = [
  {
    name: "Rajesh K.",
    role: "Patient",
    content:
      "CuraNav made it so easy to find a hospital for my mother's knee surgery. The cost estimates were accurate to the rupee, and we knew exactly what PM-JAY covered.",
    initials: "RK",
    featured: false,
  },
  {
    name: "Dr. Anjali S.",
    role: "General Physician",
    content:
      "I recommend this platform to all my patients who need specialized care. The data is transparent, making hospital selection based on actual success rates possible.",
    initials: "AS",
    featured: true,   // center card — visually elevated
  },
  {
    name: "Vikram M.",
    role: "Patient",
    content:
      "The AI comparison feature saved us weeks of research. We instantly saw the difference between two hospitals and picked the one with better hygiene ratings.",
    initials: "VM",
    featured: false,
  },
];

export function AnimatedTestimonials() {
  return (
    <section
      className="section"
      style={{ background: "var(--color-bg-base)" }}
    >
      <div className="container-base">
        {/* Section header */}
        <div
          className="text-center"
          style={{ marginBottom: "var(--section-gap)" }}
        >
          <span className="eyebrow mb-4 block">Social Proof</span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-display-lg)",
              fontWeight: "var(--weight-extrabold)",
              letterSpacing: "var(--tracking-tightest)",
              lineHeight: "var(--leading-tight)",
              color: "var(--color-fg-base)",
            }}
          >
            Trusted by Patients &amp;{" "}
            <span className="text-gradient-brand">Doctors</span>
          </h2>
          <p
            className="mx-auto mt-4"
            style={{
              maxWidth: "var(--container-sm)",
              fontSize: "var(--text-body-lg)",
              color: "var(--color-fg-muted)",
              lineHeight: "var(--leading-relaxed)",
            }}
          >
            Don&apos;t take our word for it — here is what people are saying
            about their CuraNav experience.
          </p>
        </div>

        {/* Cards grid — center card elevated */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 items-start"
          style={{
            gap: "var(--space-6)",
            maxWidth: "var(--container-xl)",
            marginInline: "auto",
          }}
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: t.featured ? -12 : 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: EASE_EXPO_OUT,
              }}
              style={{
                background: t.featured
                  ? "var(--gradient-brand)"
                  : "var(--color-surface-1)",
                border: t.featured
                  ? "none"
                  : `1px solid var(--color-border-default)`,
                borderRadius: "var(--radius-2xl)",
                padding: "var(--card-padding)",
                boxShadow: t.featured
                  ? "var(--shadow-brand-lg)"
                  : "var(--shadow-sm)",
                transition: `${t.featured ? "" : "box-shadow var(--duration-normal) var(--ease-out), transform var(--duration-normal) var(--ease-spring)"}`,
                color: t.featured ? "#fff" : "inherit",
              }}
              whileHover={!t.featured ? { y: -4, boxShadow: "var(--shadow-md)" } : {}}
            >
              {/* Stars */}
              <div
                className="flex"
                style={{ gap: "var(--space-1)", marginBottom: "var(--space-6)" }}
              >
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    style={{
                      width: "1rem",
                      height: "1rem",
                      fill: t.featured
                        ? "rgba(255,255,255,0.9)"
                        : "var(--color-warning)",
                      color: t.featured
                        ? "rgba(255,255,255,0.9)"
                        : "var(--color-warning)",
                    }}
                  />
                ))}
              </div>

              {/* Quote */}
              <p
                style={{
                  fontSize: "var(--text-body-sm)",
                  lineHeight: "var(--leading-relaxed)",
                  color: t.featured
                    ? "rgba(255,255,255,0.85)"
                    : "var(--color-fg-muted)",
                  marginBottom: "var(--space-8)",
                  flex: 1,
                }}
              >
                &ldquo;{t.content}&rdquo;
              </p>

              {/* Author */}
              <div
                className="flex items-center"
                style={{ gap: "var(--space-3)" }}
              >
                <Avatar>
                  <AvatarFallback
                    style={{
                      background: t.featured
                        ? "rgba(255,255,255,0.2)"
                        : "var(--color-brand-50)",
                      color: t.featured
                        ? "#fff"
                        : "var(--color-brand-600)",
                      fontWeight: "var(--weight-bold)",
                      fontSize: "var(--text-body-xs)",
                    }}
                  >
                    {t.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div
                    style={{
                      fontWeight: "var(--weight-semibold)",
                      fontSize: "var(--text-body-sm)",
                      color: t.featured ? "#fff" : "var(--color-fg-base)",
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-body-xs)",
                      color: t.featured
                        ? "rgba(255,255,255,0.7)"
                        : "var(--color-fg-subtle)",
                    }}
                  >
                    {t.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
