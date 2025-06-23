'use client';
import React, { useState, useEffect } from 'react';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// import CardContainer from '@/components/card/CardContainer';
import { DotGothic16, Geist_Mono } from 'next/font/google';
// import Profile from  '../../assets/img/profile.jpg';
import Marquee from '@/components/card/Marquee';
import ImageUpload from '@/components/ImageUpload';
import { useIsMobile } from '@/hooks/use-mobile';

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dotGothic16 = DotGothic16({
  variable: "--font-dot-gothic-16",
  subsets: ["latin"],
  weight: "400",
});

export default function Page() {
  const [studentId, setStudentId] = useState('');
  const [enrolledYear, setEnrolledYear] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [role, setRole] = useState('');
  const [major, setMajor] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(1);
  const [profileImage, setProfileImage] = useState('/boy.jpeg');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const isMobile = useIsMobile();
  
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowVerification(false);
    }, 5000); // 5 seconds

    // Cleanup timer on component unmount
    return () => clearTimeout(timer);
  }, []); // Empty dependency array means this runs once on mount

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Form validation
    if (!name || !studentId || !major || !role || !enrolledYear || !graduationYear || !attendanceStatus) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('No authenticated user found');
      }

      // Update user document in Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        name,
        studentId: `TNT-${studentId}`,
        major,
        role,
        yearLevel: enrolledYear,
        semester: graduationYear,
        attendanceStatus,
        profileImage: uploadedImageUrl || profileImage,
        setupCompleted: true
      });

      // Get the updated document to verify the role
      const updatedDoc = await getDoc(userRef);
      if (!updatedDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = updatedDoc.data();
      
      // Redirect based on verified role from database
      switch(userData.role) {
        case 'student':
          router.push('/user-dashboard');
          break;
        case 'admin':
          router.push('/adm-dashboard');
          break;
        default:
          setError('Invalid role in database');
          setLoading(false);
          return;
      }
    } catch (err) {
      setError('Failed to update profile: ' + err.message);
      setLoading(false);
    }
  };

  // Add this new function to get available majors based on year level
  const getAvailableMajors = () => {
    const yearLevel = parseInt(enrolledYear);
    if (!yearLevel) return [];
    if (yearLevel === 1 || yearLevel === 2) return [];
    if (yearLevel === 3) return ['CS', 'CT'];
    if (yearLevel === 4 || yearLevel === 5) {
      return ['Software Engineering (SE)', 'Business Information Systems (BIS)', 'Knowledge Engineering (KE)', 'High Performance Computing (HPC)', 'Embedded Systems (ES)', 'Computer Networks (CN)', 'Cyber Security (CSec)'];
    }
    return [];
  };

  // Add effect to reset major when year changes
  useEffect(() => {
    setMajor('');
  }, [enrolledYear]);

  // Create an object with the form data
  const userData = {
    name: name || "Mr. Student",
    studentId: studentId || "0404",
    yearLevel: enrolledYear || "1",
    semester: graduationYear || "1",
    major: major || "COMP.SCI"
  };

  // Handle image upload
  const handleImageUpload = (imageUrl) => {
    setUploadedImageUrl(imageUrl);
    setProfileImage(imageUrl);
  };

  // Function to format year and semester display
  const formatYearSemester = (year, semester) => {
    if (!year || !semester) return "1ST I";
    
    const yearMap = {
      '1': '1ST',
      '2': '2ND', 
      '3': '3RD',
      '4': '4TH',
      '5': '5TH'
    };
    
    // Calculate semester number: (year-1) * 2 + term
    const semesterNumber = (parseInt(year) - 1) * 2 + parseInt(semester);
    
    // Convert to Roman numerals
    const romanNumerals = {
      1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 
      6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X'
    };
    
    return `${yearMap[year] || '1ST'} ${romanNumerals[semesterNumber] || 'I'}`;
  };

  const CardPreview = () => (
    <div className="flex items-start justify-center">
      <div className="w-full lg:w-full flex flex-col justify-center items-center gap-4 p-4 pb-0 max-sm:pt-18">
        <div
          style={{ perspective: 2000 }}
          className={`${dotGothic16.className}`}
        >
          <div className="max-sm:bottom-12 flex justify-center items-center max-sm:w-[298px] w-[530px] max-sm:h-[183px] h-[325px] bg-[#FEC590] max-sm:rounded-[15px] rounded-[18px] max-sm:border-[1.5px] border-[2px] border-black max-sm:pl-[19px] pl-[33px] max-sm:pr-[27px] pr-[48px] max-sm:pt-[23px] pt-[42px] max-sm:pb-[31px] pb-[56px] relative text-black">
            <div 
              className="flex flex-col max-sm:rounded-[8px] rounded-[10px] overflow-hidden max-sm:border-[1.5px] border-2 border-black items-center justify-center max-sm:w-1/3 w-2/5"
            >
              <div className="max-sm:w-[90px] w-[172px] max-sm:h-[120px] h-[228px] overflow-hidden relative group">
                <Image src={profileImage} alt="Student Photo" draggable="false" fill className="object-cover" />
                
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:bg-black/20 group-hover:backdrop-blur-sm">
                  <ImageUpload onImageUpload={handleImageUpload} onUploadStateChange={setIsUploading} />
                </div>

                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                      <span className={`${dotGothic16.className} text-white font-semibold animate-pulse`}>Uploading...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-center w-2/3 max-sm:pl-5 pl-8">
              <h1 className={`${dotGothic16.className} max-sm:text-[28px] max-sm:font-bold max-sm:text-gray-900 text-[49px] text-nowrap flex items-center mb-[4px]`}>Student ID</h1>
              <div className="w-full border-t-[2px] border-dashed border-black max-sm:my-2 my-5" />

              <div className="grid grid-cols-2 gap-4 max-sm:text-[15px] text-[20px]">
                <div className="flex flex-col justify-between max-w-[200px]">
                  <span className={`${geistMono.className} font-light max-sm:text-[8px] text-sm text-nowrap`}>
                    Name
                  </span>
                  <Marquee>{userData.name}</Marquee>
                </div>

                <div className="flex flex-col justify-between">
                  <span className={`${geistMono.className} font-light max-sm:text-[8px] text-sm text-nowrap`}>Roll No.</span>
                  <Marquee>{`TNT ${userData.studentId}`}</Marquee>
                </div>
                <div className="flex flex-col justify-between">
                  <span className={`${geistMono.className} font-light max-sm:text-[8px] text-sm text-nowrap`}>Year</span>
                  <Marquee>{formatYearSemester(userData.yearLevel, userData.semester)}</Marquee>
                </div>
                <div className="flex flex-col justify-between">
                  <span className={`${geistMono.className} font-light max-sm:text-[8px] text-sm text-nowrap`}>Major</span>
                  <Marquee>{userData.major}</Marquee>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <> 
        {showVerification && (
          <div className="bg-teal-500/20 max-w-[950px] rounded-lg px-6 py-5 mx-12 flex items-center">
              <div className="rounded-full bg-white text-mediumGreen flex items-center justify-center w-7 h-7">
                  <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="w-5 h-5 text-green-700">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
              </div>
              <p className="ml-3 text-white/75 text-lg">Your email is now verified!</p>
          </div>
        )}
        <div className="flex flex-col lg:flex-row min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
            
            {/* Left Form Section - Adjusted width */}
            <div className="flex-1 flex flex-col px-16 max-sm:px-8 py-12 lg:w-1/2">
                <div className="w-full space-y-6 mb-8">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">Nice to meet you! Let's get acquainted.</h1>
                    
                    {/* appears on phone screen */}
                    <div className="lg:hidden">
                      <CardPreview />
                    </div>

                    {error && (
                      <div className="bg-red-500/20 text-red-200 p-4 rounded-md">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-2">Name <span className="text-red-500">*</span></label>
                            <input type="text" id="name" required
                                placeholder="First and Last Name"
                                className="w-full px-5 py-3 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        {/* Additional Form Fields */}
                        <label htmlFor="studentId" className="block text-sm font-medium mb-2">Student Id <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400">TNT - </span>
                            <input 
                                type="text" 
                                id="studentId" 
                                value={studentId}
                                onChange={(e) => {
                                    // Only allow numbers
                                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                    setStudentId(numericValue);
                                }}
                                className="w-full px-5 py-3 pl-20 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your ID number"
                                maxLength={4}
                            />
                        </div>

                        {/* Year and Semester Selection */}
                        <div className="flex space-x-6">
                            <div className="flex-1">
                            <label htmlFor="yearLevel" className="block text-sm font-medium mb-2">
                                Year Level <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="yearLevel"
                                value={enrolledYear}
                                onChange={(e) => setEnrolledYear(e.target.value)}
                                className="w-full px-5 py-3 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select year</option>
                                <option value="1">First Year</option>
                                <option value="2">Second Year</option>
                                <option value="3">Third Year</option>
                                <option value="4">Fourth Year</option>
                                <option value="5">Fifth Year</option>
                            </select>
                            </div>
                            <div className="flex-1">
                            <label htmlFor="semester" className="block text-sm font-medium mb-2">
                                Term <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="semester"
                                value={graduationYear}
                                onChange={(e) => setGraduationYear(e.target.value)}
                                className="w-full px-5 py-3 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select term</option>
                                <option value="1">First Term</option>
                                <option value="2">Second Term</option>
                            </select>
                            </div>
                        </div>

                        <label htmlFor="major" className="block text-sm font-medium mb-2">Major <span className="text-red-500">*</span></label>
                        <select 
                            id="major" 
                            value={major} 
                            onChange={(e) => setMajor(e.target.value)}
                            className="w-full px-5 py-3 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!enrolledYear || parseInt(enrolledYear) <= 2}
                        >
                            <option value="">
                                {!enrolledYear ? 'Select a major' : 
                                 parseInt(enrolledYear) <= 2 ? 'Major selection not available for 1st and 2nd year' :
                                 'Select a major'}
                            </option>
                            {getAvailableMajors().map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                        

                        <label htmlFor="role" className="block text-sm font-medium mb-2">Roles <span className="text-red-500">*</span></label>
                        <div className='flex flex-wrap gap-4'>
                            {[
                                { id: 'student', label: 'Student', gradient: 'from-purple-600 to-blue-500', disabled: false },
                                { id: 'mentor', label: 'Mentor', gradient: 'from-cyan-500 to-blue-500', disabled: true },
                                { id: 'teacher', label: 'Teacher', gradient: 'from-green-400 to-blue-600', disabled: true }
                            ].map((roleOption) => (
                                <div key={roleOption.id} className="relative group">
                                    <button
                                        type="button"
                                        onClick={() => !roleOption.disabled && setRole(roleOption.id)}
                                        className={`relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-md font-medium text-gray-900 rounded-lg group bg-gradient-to-br ${roleOption.gradient} hover:text-white dark:text-white focus:ring-4 focus:outline-none ${
                                            role === roleOption.id 
                                            ? 'ring-2 ring-blue-500' 
                                            : ''
                                        } ${roleOption.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={roleOption.disabled}
                                    >
                                        <span className={`relative px-8 py-3 transition-all ease-in duration-75 rounded-md ${
                                            role === roleOption.id
                                            ? 'bg-transparent'
                                            : 'bg-white dark:bg-gray-900'
                                        } group-hover:bg-transparent group-hover:dark:bg-transparent`}>
                                            {roleOption.label}
                                        </span>
                                    </button>
                                    {roleOption.disabled && (
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                            Currently unavailable
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>


                        {/* Attendance Status Dropdown */}
                        <label htmlFor="attendanceStatus" className="block text-sm font-medium mb-2">
                            Attendance Status <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="attendanceStatus"
                            value={attendanceStatus}
                            onChange={(e) => setAttendanceStatus(e.target.value)}
                            className="w-full px-5 py-3 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select status</option>
                            <option value="attending">Attending</option>
                            <option value="withdraw">Withdraw</option>
                            <option value="onLeave">On Leave</option>
                            <option value="graduated">Graduated</option>
                        </select>

                        {/* Submit Button */}
                        <div className="pt-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-5 py-3 text-white bg-teal-600 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? 'Saving...' : 'Complete Setup'}
                          </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Section - Pass userData to Card Preview */}
            {/* appears on desktop screen */}
            <div className="hidden lg:flex flex-1 items-start justify-center">
              <CardPreview />
            </div>
        </div>
    </>
  );
}
