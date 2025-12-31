'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface XPCelebrationProps {
  xp: number;
  show: boolean;
  onComplete?: () => void;
}

export default function XPCelebration({ xp, show, onComplete }: XPCelebrationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti particles
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
      }));
      setParticles(newParticles);

      // Call onComplete after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          {/* Confetti */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ y: -20, x: `${particle.x}vw`, opacity: 1, scale: 1 }}
              animate={{
                y: '100vh',
                opacity: 0,
                rotate: Math.random() * 720 - 360,
              }}
              transition={{
                duration: 2 + Math.random(),
                delay: particle.delay,
                ease: 'easeIn',
              }}
              className="absolute top-0 w-3 h-3 rounded-full"
              style={{
                background: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'][
                  particle.id % 5
                ],
              }}
            />
          ))}

          {/* XP Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
            className="relative"
          >
            {/* Glow effect */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: 'loop',
              }}
              className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl"
            />

            {/* Main badge */}
            <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-3xl p-8 shadow-2xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                className="text-center"
              >
                <div className="text-6xl mb-2">⚡</div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="text-white"
                >
                  <p className="text-lg font-medium opacity-90">You earned</p>
                  <motion.p
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.9, type: 'spring', stiffness: 200 }}
                    className="text-5xl font-black"
                  >
                    +{xp} XP
                  </motion.p>
                </motion.div>
              </motion.div>
            </div>

            {/* Sparkles */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  x: Math.cos((i * Math.PI) / 3) * 100,
                  y: Math.sin((i * Math.PI) / 3) * 100,
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.3 + i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
                className="absolute top-1/2 left-1/2 text-3xl"
              >
                ✨
              </motion.div>
            ))}
          </motion.div>

          {/* Achievement Text */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-32 text-center text-white"
          >
            <p className="text-2xl font-bold mb-2">Quest Complete! 🎉</p>
            <p className="text-gray-300">Keep making an impact!</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
