'use client';

import { motion } from 'framer-motion';
import React from 'react';

export default function Marquee(props) {
  const {
    children,
    threshold = 10,
    className = '',
  } = props;

  const shouldScroll = typeof children === 'string' && children.length > threshold;

  return (
    <div className={`relative w-full overflow-hidden h-[28px] max-sm:h-[20px] ${className}`}>
      {shouldScroll ? (
        <motion.div
          className="absolute whitespace-nowrap uppercase max-sm:text-[13px] text-[22px]"
          animate={{
            x: ['0%', '0%', '-75%', '-75%'],
          }}
          transition={{
            duration: 10,
            times: [0, 0.1, 0.9, 1],
            ease: 'linear',
            repeat: Infinity,
          }}
        >
          {children}
        </motion.div>
      ) : (
        <div className="absolute whitespace-nowrap uppercase max-sm:text-[13px] text-[22px]">
          {children}
        </div>
      )}
    </div>
  );
}