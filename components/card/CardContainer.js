'use client';

import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';

import Cardback from './CardBack';
import Cardfront from './CardFront';
import { motion } from 'framer-motion';
import { Download, Link as LinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DotGothic16 } from 'next/font/google';

import {
  FaFacebookF,
  FaTwitter,
  FaTelegramPlane,
} from 'react-icons/fa';

const dotGothic16 = DotGothic16({
  variable: "--font-dot-gothic-16",
  subsets: ["latin"],
  weight: "400",
})

export default function CardContainer({ userData }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef(null);
  const router = useRouter(); 

  const handleShare = (platform) => {
    const currentUrl = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("Check out this awesome digital card I created!");
    
    switch (platform) {
      case 'Facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`, '_blank', 'width=600,height=400');
        break;
      case 'X':
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${currentUrl}`, '_blank', 'width=600,height=400');
        break;
      case 'Telegram':
        window.open(`https://t.me/share/url?url=${currentUrl}&text=${text}`, '_blank', 'width=600,height=400');
        break;
      case 'CopyLink':
        navigator.clipboard.writeText(window.location.href)
          .then(() => alert('Link copied to clipboard!'))
          .catch(err => console.error('Failed to copy: ', err));
        break;
      default:
        break;
    }
  };

  const downloadCard = async (side) => {
    if (!cardRef.current) return;
    
    try {
      // Capture the card as a high-res PNG
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0, // Highest quality
        pixelRatio: 3, // 3x resolution for high-res output
        style: {
          transform: `rotateY(${side === 'back' ? 180 : 0}deg)`,
          transformStyle: 'preserve-3d',
        }
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `digital-card-${side}.png`;
      link.href = dataUrl;
      link.click();
      
    } catch (error) {
      console.error('Error downloading card:', error);
      alert('Failed to download card. Please try again.');
    }
  };

  const downloadBothSides = () => {
    downloadCard('front');
    setTimeout(() => downloadCard('back'), 500); // Small delay between downloads
  };

  return (
    <div className='w-full bg-transparent flex justify-center'>
      <div className="flex flex-col items-center">
        <div ref={cardRef}
          className="relative w-[530px] h-[325px] [perspective:2000px] max-sm:w-[320px] max-sm:h-[183px]"
        >
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="w-full h-full relative [transform-style:preserve-3d]"
          >
            <div className="absolute inset-0 backface-hidden">
              <Cardfront userData={userData} />
            </div>
            <div className="absolute inset-0 [transform:rotateY(180deg)] backface-hidden">
              <Cardback />
            </div>
          </motion.div>
        </div>

        {/* Drag and Tilt Text */}
        {/* <p className={`mt-8 max-sm:-mt-4 max-sm:text-sm text-md font-medium text-gray-700 ${dotGothic16.className}`}>[Drag and Tilt the Card]</p> */}

        {/* Buttons section */}
        {/* <div className="flex flex-wrap justify-center gap-4 max-sm:mt-8 mt-8">
          
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => handleShare('Facebook')}
              className="p-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              aria-label="Share on Facebook"
            >
              <FaFacebookF className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleShare('CopyLink')}
              className="p-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              aria-label="Copy link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleShare('X')}
              className="p-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              aria-label="Share on X"
            >
              <FaTwitter className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleShare('Telegram')}
              className="p-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              aria-label="Share on Telegram"
            >
              <FaTelegramPlane className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={downloadBothSides}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download
            </button>

            <button
              onClick={() => setIsFlipped((prev) => !prev)}
              className="px-4 py-2 bg-black text-white rounded-md cursor-pointer hover:bg-gray-800 transition-colors"
            >
              Flip Card
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
}
