"use client";
import React, { useRef, useEffect, useState } from "react";
import { useScroll, useTransform, motion, MotionValue, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ContainerScrollProps {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ContainerScroll = ({
  titleComponent,
  children,
  className,
}: ContainerScrollProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.85, 0.95] : [1.03, 1];
  };

  // If user prefers reduced motion, disable 3D rotation and translation
  const rotateValue = shouldReduceMotion ? 0 : 15;
  const rotate = useTransform(scrollYProgress, [0, 0.65], [rotateValue, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.65], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 0.65], [0, -30]);

  return (
    <div
      className={cn(
        "min-h-[50rem] md:min-h-[64rem] flex items-center justify-center relative p-3 md:p-8 lg:p-12 overflow-hidden bg-gradient-to-b from-[#F5F7FB] via-[#E9EDFF]/40 to-[#F5F7FB]",
        className
      )}
      ref={containerRef}
    >
      <div
        className="py-10 md:py-16 w-full max-w-7xl relative"
        style={{
          perspective: "1200px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="max-w-5xl mx-auto text-center px-4 mb-8"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 20px 40px -15px rgba(16, 26, 43, 0.12), 0 0 0 1px rgba(16, 26, 43, 0.08), 0 30px 60px -20px rgba(69, 107, 250, 0.15)",
      }}
      className="max-w-6xl mx-auto w-full border border-[#E3E8F0] p-2 md:p-4 bg-[#FFFFFF] rounded-[24px] shadow-2xl transition-all duration-200"
    >
      <div className="h-full w-full overflow-hidden rounded-[18px] bg-[#F5F7FB] border border-[#E3E8F0]/60">
        {children}
      </div>
    </motion.div>
  );
};

export default ContainerScroll;
