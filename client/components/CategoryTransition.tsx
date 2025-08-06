import React from 'react';
import { motion } from 'framer-motion';

interface CategoryTransitionProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
}

const slideVariants = {
  left: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 }
  },
  right: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 }
  },
  up: {
    initial: { y: 50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -50, opacity: 0 }
  },
  down: {
    initial: { y: -50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 50, opacity: 0 }
  }
};

const slideTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  duration: 0.5
};

export function CategoryTransition({ children, direction = 'right' }: CategoryTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={slideVariants[direction]}
      transition={slideTransition}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

export default CategoryTransition;
