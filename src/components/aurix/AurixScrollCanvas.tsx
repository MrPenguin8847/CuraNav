"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { AurixHudOverlay } from "./AurixHudOverlay";

const FRAME_COUNT = 300;
const FRAME_START = 1;
const ASSET_PATH = (frame: number) =>
  `/assets/aurix/ezgif-frame-${frame.toString().padStart(3, "0")}.jpg`;

export function AurixScrollCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [loadedFrames, setLoadedFrames] = useState(0);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    new Array(FRAME_COUNT + 1).fill(null)
  );

  const currentFrame = useRef(1);
  const targetFrame = useRef(1);
  const animationFrameId = useRef<number | null>(null);
  const lastDrawnFrame = useRef(-1);

  // ── Preload frames ──────────────────────────────────────────────
  useEffect(() => {
    let isCancelled = false;
    let loaded = 0;

    const loadImage = (index: number): Promise<void> =>
      new Promise((resolve) => {
        const img = new Image();
        img.src = ASSET_PATH(index);
        img.onload = () => {
          if (!isCancelled) {
            imagesRef.current[index] = img;
            loaded++;
            setLoadedFrames(loaded);
          }
          resolve();
        };
        img.onerror = () => resolve();
      });

    const preload = async () => {
      // Eagerly load first 30 frames for instant start
      const eager: Promise<void>[] = [];
      for (let i = FRAME_START; i <= Math.min(30, FRAME_COUNT); i++) {
        eager.push(loadImage(i));
      }
      await Promise.all(eager);

      // Load remaining in sequential order
      for (let i = 31; i <= FRAME_COUNT; i++) {
        if (isCancelled) return;
        await loadImage(i);
      }
    };

    preload();
    return () => {
      isCancelled = true;
    };
  }, []);

  // ── Draw a single frame onto the canvas ─────────────────────────
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Skip if same frame already drawn
    if (lastDrawnFrame.current === frameIndex) return;

    // Find closest loaded frame (look backward)
    let img = imagesRef.current[frameIndex];
    if (!img) {
      for (let i = frameIndex - 1; i >= FRAME_START; i--) {
        if (imagesRef.current[i]) {
          img = imagesRef.current[i];
          break;
        }
      }
    }

    // Size canvas buffer to match CSS size × devicePixelRatio
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const bufW = Math.round(rect.width * dpr);
    const bufH = Math.round(rect.height * dpr);

    if (canvas.width !== bufW || canvas.height !== bufH) {
      canvas.width = bufW;
      canvas.height = bufH;
    }

    // Reset transform then scale for DPR
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear to black (matches frame backgrounds)
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (img) {
      // "contain" mode — fit entirely within viewport and anchor to bottom
      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;
      const imgRatio = imgW / imgH;
      const canvasRatio = rect.width / rect.height;

      let drawW: number, drawH: number, offsetX: number, offsetY: number;

      if (canvasRatio > imgRatio) {
        // Canvas is wider than image. Fit to height.
        drawH = rect.height;
        drawW = rect.height * imgRatio;
        offsetX = (rect.width - drawW) / 2;
        offsetY = 0; // Or (rect.height - drawH) which is 0 anyway
      } else {
        // Canvas is taller than image. Fit to width.
        drawW = rect.width;
        drawH = rect.width / imgRatio;
        offsetX = 0;
        // Anchor to bottom so it's not "stuck above"
        offsetY = rect.height - drawH;
      }

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      lastDrawnFrame.current = frameIndex;
    }
  }, []);

  // ── Scroll tracking ─────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const { top, height } = containerRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const maxScroll = height - vh;
      const scrollPos = -top;

      let p = 0;
      if (scrollPos <= 0) p = 0;
      else if (scrollPos >= maxScroll) p = 1;
      else p = scrollPos / maxScroll;

      setProgress(p);
      targetFrame.current = Math.min(
        FRAME_COUNT,
        Math.max(FRAME_START, Math.floor(p * (FRAME_COUNT - 1)) + 1)
      );
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Render loop (lerp toward target frame) ──────────────────────
  useEffect(() => {
    const tick = () => {
      currentFrame.current +=
        (targetFrame.current - currentFrame.current) * 0.12;

      if (Math.abs(targetFrame.current - currentFrame.current) < 0.5) {
        currentFrame.current = targetFrame.current;
      }

      drawFrame(Math.round(currentFrame.current));
      animationFrameId.current = requestAnimationFrame(tick);
    };

    animationFrameId.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [drawFrame]);

  // ── prefers-reduced-motion ──────────────────────────────────────
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <section className="bg-black w-full">
      {/* Scroll runway — height defines how much scroll travel maps to 300 frames */}
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: reducedMotion ? "100vh" : "400vh" }}
      >
        {/* Sticky viewport pinned to screen while container scrolls */}
        <div className="sticky top-0 w-full h-screen overflow-hidden bg-black">
          {/* Canvas — renders behind the HUD */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 1 }}
          />

          {/* HUD Overlay — renders above the canvas */}
          <div style={{ position: "relative", zIndex: 2, height: "100%" }}>
            <AurixHudOverlay
              progress={progress}
              loadedPercent={Math.round((loadedFrames / FRAME_COUNT) * 100)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
