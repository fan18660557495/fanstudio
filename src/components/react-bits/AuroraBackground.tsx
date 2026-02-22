"use client"

import { motion } from "framer-motion"

/** 5 个光球定义，颜色从 CSS 变量读取。 */
const orbConfigs = [
  { index: 1, size: 400, blur: 120, x: ["0%", "30%", "-20%", "0%"], y: ["0%", "-30%", "20%", "0%"], scale: [1, 1.4, 0.8, 1], duration: 15, initialX: "10%", initialY: "20%" },
  { index: 2, size: 320, blur: 100, x: ["0%", "-30%", "20%", "0%"], y: ["0%", "25%", "-25%", "0%"], scale: [1, 0.7, 1.3, 1], duration: 18, initialX: "30%", initialY: "10%" },
  { index: 3, size: 280, blur: 90, x: ["0%", "30%", "-25%", "0%"], y: ["0%", "20%", "-30%", "0%"], scale: [1, 1.25, 0.85, 1], duration: 12, initialX: "55%", initialY: "30%" },
  { index: 5, size: 360, blur: 130, x: ["0%", "-25%", "30%", "0%"], y: ["0%", "-20%", "25%", "0%"], scale: [1, 0.8, 1.4, 1], duration: 16, initialX: "70%", initialY: "15%" },
  { index: 7, size: 300, blur: 110, x: ["0%", "20%", "-30%", "0%"], y: ["0%", "30%", "-20%", "0%"], scale: [1, 1.3, 0.7, 1], duration: 20, initialX: "85%", initialY: "25%" },
]

export function AuroraBackground({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      {orbConfigs.map((orb) => (
        <motion.div
          key={orb.index}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, var(--color-pride-${orb.index}) 0%, transparent 70%)`,
            filter: `blur(${orb.blur}px)`,
            left: orb.initialX,
            top: orb.initialY,
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            x: orb.x,
            y: orb.y,
            scale: orb.scale,
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
