"use client";
import { cn } from "@/lib/utils";
import { useMotionValue, motion, useMotionTemplate, useReducedMotion } from "framer-motion";
import React, { useEffect, useState } from "react";

export interface HeroHighlightProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export const HeroHighlight = ({
  children,
  className,
  containerClassName,
}: HeroHighlightProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isTouch, setIsTouch] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
    }
  }, []);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    if (!currentTarget || isTouch || shouldReduceMotion) return;
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  // Brand adapted dot pattern matching RELAY AI palette
  const dotPattern = (color: string) => ({
    backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
    backgroundSize: "20px 20px",
  });

  return (
    <div
      className={cn(
        "relative flex items-center justify-center w-full group overflow-hidden bg-[#F5F7FB]",
        containerClassName
      )}
      onMouseMove={handleMouseMove}
    >
      {/* Base ambient dot pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={dotPattern("#CBD5E1")} // subtle slate-300
      />

      {/* Interactive cursor-following spotlight effect in RELAY AI Electric Blue & Neural Teal */}
      {!shouldReduceMotion && !isTouch && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            ...dotPattern("#456BFA"), // Electric Blue dots inside the spotlight
            WebkitMaskImage: useMotionTemplate`
              radial-gradient(
                260px circle at ${mouseX}px ${mouseY}px,
                black 0%,
                transparent 100%
              )
            `,
            maskImage: useMotionTemplate`
              radial-gradient(
                260px circle at ${mouseX}px ${mouseY}px,
                black 0%,
                transparent 100%
              )
            `,
          }}
        />
      )}

      {/* Subtle radial ambient glow at the cursor */}
      {!shouldReduceMotion && !isTouch && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-60"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                320px circle at ${mouseX}px ${mouseY}px,
                rgba(69, 107, 250, 0.08) 0%,
                rgba(32, 198, 182, 0.05) 45%,
                transparent 75%
              )
            `,
          }}
        />
      )}

      {/* Content wrapper with pointer events intact */}
      <div className={cn("relative z-10 w-full", className)}>{children}</div>
    </div>
  );
};

export interface HighlightProps {
  children: React.ReactNode;
  className?: string;
}

export const Highlight = ({ children, className }: HighlightProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.span
      initial={{
        backgroundSize: shouldReduceMotion ? "100% 100%" : "0% 100%",
      }}
      animate={{
        backgroundSize: "100% 100%",
      }}
      transition={{
        duration: shouldReduceMotion ? 0 : 1.4,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.3,
      }}
      style={{
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
        display: "inline",
      }}
      className={cn(
        "relative inline-block pb-0.5 px-2 rounded-md bg-gradient-to-r from-[#456BFA]/15 via-[#20C6B6]/20 to-[#456BFA]/20 text-[#1E4CDD] font-bold border-b border-[#456BFA]/40 shadow-sm",
        className
      )}
    >
      {children}
    </motion.span>
  );
};

export default HeroHighlight;
