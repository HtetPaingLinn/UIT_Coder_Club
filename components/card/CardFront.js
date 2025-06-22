'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { DotGothic16, Geist_Mono } from 'next/font/google';
import Marquee from './Marquee';
import ImageUpload from '../ImageUpload';
import { updateUserProfile, getUserProfile } from '../../firebase/utils';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: "400",
});

const dotGothic16 = DotGothic16({
  variable: "--font-dot-gothic-16",
  subsets: ["latin"],
  weight: "400",
})

export default function Cardfront({ userData }) {
  const [profileImage, setProfileImage] = useState('/boy.jpeg'); // Default image
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        // Load user profile
        loadUserProfile(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (uid) => {
    const profile = await getUserProfile(uid);
    if (profile?.profileImage) {
      setProfileImage(profile.profileImage);
    }
  };

  const user = {
    name: userData?.name || "Mr. Student",
    rollNo: userData?.studentId ? `TNT-${userData?.studentId}` : "TNT 8888",
    year: userData?.yearLevel && userData?.semester ? 
          `${userData.yearLevel}/${userData.semester}` : "3RD VI",
    major: userData?.major || "COMP.SCI",
  }

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);

  const handleImageUpload = async (imageUrl) => {
    try {
      setProfileImage(imageUrl);
      
      if (!userId) {
        console.warn('No user ID available - profile picture updated locally only');
        return;
      }
      
      // Update profile image URL in Firebase
      const updated = await updateUserProfile(userId, {
        profileImage: imageUrl,
        updatedAt: new Date().toISOString()
      });

      if (!updated) {
        console.error('Failed to update profile in Firebase');
      }
    } catch (error) {
      console.error('Error in handleImageUpload:', error);
    }
  };

  return (
    <div 
      style={{ perspective: 2000 }}
      className={dotGothic16.className}
    >
      {/* Horizontal Card */}
      <motion.div
        style={{ x, y, rotateX, rotateY, z: 100 }}
        drag
        dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
        whileTap={{ cursor: 'grabbing' }}
        className="flex justify-center items-center max-sm:w-[298px] w-[530px] max-sm:h-[183px] h-[325px] bg-indigo-200 max-sm:rounded-[15px] rounded-[18px] max-sm:border-[1.5px] border-[2px] border-black max-sm:pl-[19px] pl-[33px] max-sm:pr-[27px] pr-[48px] max-sm:pt-[23px] pt-[42px] max-sm:pb-[31px] pb-[56px] cursor-grab relative text-black"
      >

          {/* Left Section - Photo & Codes */}
          <div className="flex flex-col max-sm:rounded-[8px] rounded-[10px] overflow-hidden max-sm:border-[1.5px] border-2 border-black items-center justify-center max-sm:w-1/3 w-2/5">
            <div className="max-sm:w-[90px] w-[172px] max-sm:h-[120px] h-[228px] overflow-hidden relative group">
              <Image 
                src={profileImage} 
                alt="Student Photo" 
                draggable="false" 
                fill 
                className="object-cover transition-transform duration-300 group-hover:scale-110" 
              />
              
              {/* Upload button overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/30 backdrop-blur-[2px]">
                <div className="bg-white/80 px-4 py-2 rounded-lg shadow-lg border border-black/10">
                  <ImageUpload onImageUpload={handleImageUpload} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Student Info */}
          <div className="flex flex-col justify-center w-2/3 max-sm:pl-5 pl-8">
            <h1 className={`${dotGothic16.className} my-auto max-sm:text-[28px] max-sm:font-bold max-sm:text-gray-900 text-[49px] text-nowrap flex items-center`}>Student ID</h1>

            {/* Dotted/Dashed Line */}
            <div className="w-full border-t-[2px] border-dashed border-black max-sm:my-2 my-5" />

            {/* Info Container */}
            <div className="flex flex-col max-sm:text-[15px] text-[20px] max-sm:gap-y-1 gap-y-2">
              <div className="flex">
                <div className="flex flex-col w-1/2 pr-2">
                  <span className={`${geistMono.className} font-light max-sm:text-[8px] text-sm text-nowrap`}>
                    Name
                  </span>
                  <Marquee>{user.name}</Marquee>
                </div>
                <div className="flex flex-col w-1/2 pl-2">
                  <span className={`${geistMono.className} font-light max-sm:text-[8px] text-sm text-nowrap`}>Roll No.</span>
                  {/* <span className='max-sm:text-[13px] text-[22px]'>TNT 1770</span> */}
                  <Marquee>{user.rollNo}</Marquee>
                </div>
              </div>
              <div className="flex">
                <div className="flex flex-col w-1/2 pr-2">
                  <span className={`${geistMono.className} font-light max-sm:text-[8px] text-sm text-nowrap`}>Year</span>
                  {/* <span className='max-sm:text-[13px] text-[22px]'>3RD VI</span> */}
                  <Marquee>{user.year}</Marquee>
                </div>
                <div className="flex flex-col w-1/2 pl-2">
                  <span className={`${geistMono.className} font-light max-sm:text-[8px] text-sm text-nowrap`}>Major</span>
                  {/* <span className='max-sm:text-[13px] text-[22px]'>COMP.SCI</span> */}
                  <Marquee>{user.major}</Marquee>
                </div>
              </div>
            </div>
          </div>

          {/* <motion.div 
            style={{ x, y, rotateX, rotateY, z: 100000 }}
            className="absolute max-sm:-top-11 -top-19 max-sm:-right-11 -right-19 max-sm:w-[100px] w-[170px]">
            <Image src={'/graduation_hat.png'} width={170} height={100} alt="" draggable="false" />
          </motion.div>*/}

      </motion.div> 
    </div>
  );
}