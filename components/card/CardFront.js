'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

  // Format year/semester for preview (copied from ProfileScreen)
  const formatYearSemester = (year, semester) => {
    if (!year || !semester) return "1ST I";
    const yearMap = {
      '1': '1ST', '2': '2ND', '3': '3RD', '4': '4TH', '5': '5TH'
    };
    const semesterNumber = (parseInt(year) - 1) * 2 + parseInt(semester);
    const romanNumerals = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X' };
    return `${yearMap[year] || '1ST'} ${romanNumerals[semesterNumber] || 'I'}`;
  };

  // Memoize formatted year for performance
  const formattedYear = useMemo(() => formatYearSemester(userData?.yearLevel, userData?.semester), [userData?.yearLevel, userData?.semester]);

  // Helper to ensure only one TNT prefix
  const getRollNo = (studentId) => {
    if (!studentId) return '8888';
    return `TNT ${studentId.replace(/^TNT-?/i, '')}`;
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
        className="max-sm:bottom-12 flex justify-center items-center max-sm:w-[298px] w-[530px] max-sm:h-[183px] h-[325px] bg-[#FEC590] max-sm:rounded-[15px] rounded-[18px] max-sm:border-[1.5px] border-[2px] border-black max-sm:pl-[19px] pl-[33px] max-sm:pr-[27px] pr-[48px] max-sm:pt-[23px] pt-[42px] max-sm:pb-[31px] pb-[56px] cursor-grab relative text-black"
      >

          {/* Left Section - Photo & Codes */}
          <div className="flex flex-col max-sm:rounded-[8px] rounded-[10px] overflow-hidden max-sm:border-[1.5px] border-2 border-black items-center justify-center max-sm:w-1/3 w-2/5">
            <div className="max-sm:w-[90px] w-[172px] max-sm:h-[120px] h-[228px] overflow-hidden relative group">
              <Image 
                src={profileImage} 
                alt="Student Photo" 
                draggable="false" 
                fill 
                className="object-cover" 
              />
              
              {/* Upload button overlay
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/30 backdrop-blur-[2px]">
                <div className="bg-white/80 px-4 py-2 rounded-lg shadow-lg border border-black/10">
                  <ImageUpload onImageUpload={handleImageUpload} />
                </div>
              </div> */}
            </div>
          </div>

          {/* Right Section - Student Info */}
          <div className="flex flex-col justify-center w-2/3 max-sm:pl-5 pl-8">
            <h1 className={`${dotGothic16.className} max-sm:text-[28px] max-sm:font-bold max-sm:text-gray-900 text-[49px]  text-nowrap flex items-center mb-[4px]`}>Student ID</h1>

            {/* Dotted/Dashed Line */}
            <div className="w-full border-t-[2px] border-dashed border-black max-sm:my-2 my-5" />

            {/* Info Container */}
            <div className="flex flex-col gap-2 max-sm:text-[15px] text-[20px]">
              {/* First Row: Name & Roll No. */}
              <div className="flex flex-row gap-8 max-sm:gap-4 w-full">
                <div className="flex flex-col max-w-[200px] flex-1">
                  <span className={`${geistMono.className} font-light max-sm:text-[8px] text-sm text-nowrap`}>Name</span>
                  <Marquee>{userData?.name || "Mr. Student"}</Marquee>
                </div>
                <div className="flex flex-col flex-1">
                  <span className={`${geistMono.className} font-light max-sm:text-[8px] text-sm text-nowrap`}>Roll No.</span>
                  <Marquee>{getRollNo(userData?.studentId)}</Marquee>
                </div>
              </div>
              {/* Second Row: Year & Major */}
              <div className="flex flex-row gap-8 max-sm:gap-4 w-full">
                <div className="flex flex-col flex-1">
                  <span className={`${geistMono.className} font-light max-sm:text-[8px] text-sm text-nowrap`}>Year</span>
                  <Marquee>{formattedYear}</Marquee>
                </div>
                <div className="flex flex-col flex-1">
                  <span className={`${geistMono.className} font-light max-sm:text-[8px] text-sm text-nowrap`}>Major</span>
                  <Marquee>{userData?.major || "COMP.SCI"}</Marquee>
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