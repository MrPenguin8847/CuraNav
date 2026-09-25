"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AurixHudOverlay } from "./AurixHudOverlay";

const FRAME_COUNT = 300;
const FRAME_START = 1;
const STAGE_ONE_VIEWPORTS = 4;
const HANDOFF_VIEWPORTS = 1;
const ASSET_PATH = (frame: number) =>
  `/assets/aurix/ezgif-frame-${frame.toString().padStart(3, "0")}.jpg`;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

type HandoffContent = (progress: number) => React.ReactNode;

interface AurixScrollCanvasProps {
  handoffContent?: HandoffContent;
}

export function AurixScrollCanvas({ handoffContent }: AurixScrollCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [handoffProgress, setHandoffProgress] = useState(0);
  const [loadedFrames, setLoadedFrames] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    new Array(FRAME_COUNT + 1).fill(null)
  );

  const currentFrame = useRef(1);
  const targetFrame = useRef(1);
  const animationFrameId = useRef<number | null>(null);
  const renderLoopRunning = useRef(false);
  const lastDrawnFrame = useRef(-1);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let loaded = 0;

    const loadImage = (index: number): Promise<void> =>
      new Promise((resolve) => {
        const image = new Image();
        image.src = ASSET_PATH(index);
        image.onload = () => {
          if (!isCancelled) {
            imagesRef.current[index] = image;
            loaded++;
            setLoadedFrames(loaded);
          }
          resolve();
        };
        image.onerror = () => resolve();
      });

    const preload = async () => {
      const eager: Promise<void>[] = [];
      for (let index = FRAME_START; index <= Math.min(30, FRAME_COUNT); index++) {
        eager.push(loadImage(index));
      }
      await Promise.all(eager);

      for (let index = 31; index <= FRAME_COUNT; index++) {
        if (isCancelled) return;
        await loadImage(index);
      }
    };

    preload();
    return () => {
      isCancelled = true;
    };
  }, []);

  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    if (lastDrawnFrame.current === frameIndex) return;

    const exactImage = imagesRef.current[frameIndex];
    let image = exactImage;
    if (!image) {
      for (let index = frameIndex - 1; index >= FRAME_START; index--) {
        if (imagesRef.current[index]) {
          image = imagesRef.current[index];
          break;
        }
      }
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const bufferWidth = Math.round(rect.width * devicePixelRatio);
    const bufferHeight = Math.round(rect.height * devicePixelRatio);

    if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
      canvas.width = bufferWidth;
      canvas.height = bufferHeight;
    }

    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    context.fillStyle = "#000000";
    context.fillRect(0, 0, rect.width, rect.height);

    if (image) {
      const imageWidth = image.naturalWidth;
      const imageHeight = image.naturalHeight;
      const imageRatio = imageWidth / imageHeight;
      const canvasRatio = rect.width / rect.height;

      let drawWidth: number;
      let drawHeight: number;
      let offsetX: number;
      let offsetY: number;

      if (canvasRatio > imageRatio) {
        drawHeight = rect.height;
        drawWidth = rect.height * imageRatio;
        offsetX = (rect.width - drawWidth) / 2;
        offsetY = 0;
      } else {
        drawWidth = rect.width;
        drawHeight = rect.width / imageRatio;
        offsetX = 0;
        offsetY = rect.height - drawHeight;
      }

      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
      context.fillStyle = "#000000";
      context.fillRect(
        offsetX + drawWidth - 160,
        offsetY + drawHeight - 60,
        160,
        60
      );
      lastDrawnFrame.current = exactImage ? frameIndex : -1;
    }
  }, []);

  const requestRender = useCallback(() => {
    if (renderLoopRunning.current) return;

    const tick = () => {
      currentFrame.current +=
        (targetFrame.current - currentFrame.current) * 0.12;

      if (Math.abs(targetFrame.current - currentFrame.current) < 0.5) {
        currentFrame.current = targetFrame.current;
      }

      drawFrame(Math.round(currentFrame.current));

      if (
        targetFrame.current >= FRAME_COUNT &&
        currentFrame.current >= FRAME_COUNT
      ) {
        renderLoopRunning.current = false;
        animationFrameId.current = null;
        return;
      }

      animationFrameId.current = requestAnimationFrame(tick);
    };

    renderLoopRunning.current = true;
    animationFrameId.current = requestAnimationFrame(tick);
  }, [drawFrame]);

  const stageOneViewports = reducedMotion ? 1 : STAGE_ONE_VIEWPORTS;
  const totalViewports = stageOneViewports + HANDOFF_VIEWPORTS;

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const { top } = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const stageOneHeight = viewportHeight * stageOneViewports;
      const stageOneScrollRange = Math.max(stageOneHeight - viewportHeight, 0);
      const handoffRange = viewportHeight * HANDOFF_VIEWPORTS;
      const scrollPosition = Math.max(0, -top);
      const modelProgress =
        stageOneScrollRange === 0
          ? 1
          : clamp(scrollPosition / stageOneScrollRange);
      const nextHandoffProgress =
        handoffRange === 0
          ? 0
          : clamp((scrollPosition - stageOneScrollRange) / handoffRange);
      const nextTargetFrame = Math.min(
        FRAME_COUNT,
        Math.max(FRAME_START, Math.floor(modelProgress * (FRAME_COUNT - 1)) + 1)
      );

      setProgress((currentProgress) =>
        currentProgress === modelProgress ? currentProgress : modelProgress
      );
      setHandoffProgress((currentHandoffProgress) =>
        currentHandoffProgress === nextHandoffProgress
          ? currentHandoffProgress
          : nextHandoffProgress
      );

      if (nextTargetFrame !== targetFrame.current) {
        targetFrame.current = nextTargetFrame;
        requestRender();
      }
    };

    const handleResize = () => {
      lastDrawnFrame.current = -1;
      requestRender();
      handleScroll();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [requestRender, stageOneViewports]);

  useEffect(() => {
    requestRender();
    return () => {
      renderLoopRunning.current = false;
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [requestRender]);

  useEffect(() => {
    if (imagesRef.current[targetFrame.current]) {
      requestRender();
    }
  }, [loadedFrames, requestRender]);

  const hudOpacity = Math.max(0, 1 - handoffProgress / 0.22);

  return (
    <section className="relative bg-black w-full">
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: `${totalViewports * 100}vh` }}
      >
        <div className="sticky top-0 z-0 w-full h-screen overflow-hidden bg-black">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 1 }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 2,
              height: "100%",
              opacity: hudOpacity,
              transition: "opacity 180ms ease",
            }}
          >
            <AurixHudOverlay
              progress={progress}
              loadedPercent={Math.round((loadedFrames / FRAME_COUNT) * 100)}
            />
          </div>
        </div>

        {handoffContent && (
          <div
            className="absolute inset-x-0 z-10"
            style={{ top: `${stageOneViewports * 100}vh` }}
          >
            {handoffContent(handoffProgress)}
          </div>
        )}
      </div>
    </section>
  );
}
