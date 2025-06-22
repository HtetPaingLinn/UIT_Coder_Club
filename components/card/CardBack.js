'use client';

import React from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { DotGothic16, Geist_Mono } from 'next/font/google';
import Marquee from './Marquee';
import AnimatedQRCode from './AnimatedQRCode';

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dotGothic16 = DotGothic16({
  variable: "--font-dot-gothic-16",
  subsets: ["latin"],
  weight: "400",
})

export default function Cardback() {

  const fakeUrl = "https://www.example.com";

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);

  return (
<div style={{ perspective: 2000 }} className={dotGothic16.className}>
  {/* Horizontal Card */}
  <motion.div
    style={{ x, y, rotateX, rotateY, z: 100 }}
    drag
    dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
    whileTap={{ cursor: 'grabbing' }}
    className="max-sm:bottom-12 flex justify-between items-center max-sm:w-[298px] w-[530px] max-sm:h-[183px] h-[325px] bg-[#FEC590] max-sm:rounded-[15px] rounded-[18px] max-sm:border-[1.5px] border-[2px] border-black max-sm:pl-[19px] pl-[33px] max-sm:pr-[14px] pr-[21px] max-sm:pt-[23px] pt-[42px] max-sm:pb-[31px] pb-[56px] cursor-grab relative text-black"
  >
    {/* Left Section - QR Code */}
    <div className="w-1/2 flex justify-center items-center">
      <AnimatedQRCode url={fakeUrl} />
    </div>

    {/* Right Section - Club Signature Logo */}
    <div className="w-1/2 flex justify-center items-center">
      <Image src={'/Coder Club_red.png'} alt="" width={200} height={200} draggable="false" />
    </div>

    {/* Three White Dots - Top Right */}
    <div className="absolute max-sm:top-4 top-6 max-sm:right-6 right-9 flex space-x-2 max-sm:space-x-1">
      <span className="max-sm:w-2 w-3 max-sm:h-2 h-3 bg-white rounded-full"></span>
      <span className="max-sm:w-2 w-3 max-sm:h-2 h-3 bg-white rounded-full"></span>
      <span className="max-sm:w-2 w-3 max-sm:h-2 h-3 bg-white rounded-full"></span>
    </div>

    {/* Date Display - Bottom Center */}
    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-sm max-sm:text-[10px]">
      {new Date().toLocaleDateString('en-GB')}
    </div>

  </motion.div>
</div>
  );
}