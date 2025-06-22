'use client';
import React, { useState, useEffect } from 'react';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CardContainer from '@/components/card/CardContainer';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [profileImage, setProfileImage] = useState('/boy.jpeg');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');
  const isMobile = useIsMobile();
  
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();
  const { currentUser, userDataObj, loading: authLoading } = useAuth();

  // Determine screen size for better responsive handling
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Authentication and user data validation
  useEffect(() => {
    if (authLoading) {
      // Still loading auth state, wait
      return;
    }

    if (!currentUser) {
      // User not authenticated, redirect to login
      router.push('/Login');
      return;
    }

    // User is authenticated, check user data
    if (userDataObj) {
      // Check if user has role and setup is completed
      if (userDataObj.role && userDataObj.role.trim() !== '' && userDataObj.setupCompleted) {
        // User has role and setup is completed, redirect to appropriate dashboard
        if (userDataObj.role === 'admin') {
          router.push('/adm-dashboard');
        } else {
          router.push('/user-dashboard');
        }
        return;
      }
    }

    // User is authenticated but needs setup (no role or setup not completed)
    setIsCheckingAuth(false);
  }, [currentUser, userDataObj, authLoading, router]);

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
    studentId: studentId || "8888",
    yearLevel: enrolledYear || "1",
    semester: graduationYear || "1",
    major: major || "COMP.SCI"
  };

  // Show loading while checking authentication
  if (authLoading || isCheckingAuth) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

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
        <div className="flex min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
            
            {/* Mobile Layout */}
            {screenSize === 'mobile' ? (
              <div className="flex-1 flex flex-col px-6 py-6">
                <div className="w-full">
                    <h1 className="text-2xl sm:text-3xl font-bold dark:text-white mb-8">Nice to meet you! Let's get acquainted.</h1>
                    
                    {/* Card for mobile - placed below heading with proper spacing */}
                    <div className="flex justify-center mb-8">
                        <div className="w-full h-[220px]">
                            <CardContainer userData={userData} />
                        </div>
                    </div>
                    
                    {error && (
                      <div className="bg-red-500/20 text-red-200 p-4 rounded-md mb-6">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-2">Name <span className="text-red-500">*</span></label>
                            <input type="text" id="name" required
                                placeholder="First and Last Name"
                                className="w-full px-4 py-3 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        {/* Additional Form Fields */}
                        <div>
                            <label htmlFor="studentId" className="block text-sm font-medium mb-2">Student Id <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 pr-2">TNT -</span>
                                <input 
                                    type="text" 
                                    id="studentId" 
                                    value={studentId}
                                    onChange={(e) => {
                                        // Only allow numbers
                                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                        setStudentId(numericValue);
                                    }}
                                    className="w-full px-8 py-3 pl-20 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your ID number"
                                    maxLength={4}
                                />
                            </div>
                        </div>

                        {/* Year and Semester Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="yearLevel" className="block text-sm font-medium mb-2">
                                    Year Level <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="yearLevel"
                                    value={enrolledYear}
                                    onChange={(e) => setEnrolledYear(e.target.value)}
                                    className="w-full px-4 py-3 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                                >
                                    <option value="">Select year</option>
                                    <option value="1">First Year</option>
                                    <option value="2">Second Year</option>
                                    <option value="3">Third Year</option>
                                    <option value="4">Fourth Year</option>
                                    <option value="5">Fifth Year</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="semester" className="block text-sm font-medium mb-2">
                                    Semester <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="semester"
                                    value={graduationYear}
                                    onChange={(e) => setGraduationYear(e.target.value)}
                                    className="w-full px-4 py-3 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                                >
                                    <option value="">Select semester</option>
                                    <option value="1">First Semester</option>
                                    <option value="2">Second Semester</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="major" className="block text-sm font-medium mb-2">Major <span className="text-red-500">*</span></label>
                            <select 
                                id="major" 
                                value={major} 
                                onChange={(e) => setMajor(e.target.value)}
                                className="w-full px-4 py-3 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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
                        </div>
                        

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium mb-3">Roles <span className="text-red-500">*</span></label>
                            <div className='flex flex-wrap gap-3'>
                                {[
                                    { id: 'student', label: 'Student', gradient: 'from-purple-600 to-blue-500', disabled: false },
                                    { id: 'mentor', label: 'Mentor', gradient: 'from-cyan-500 to-blue-500', disabled: true },
                                    { id: 'teacher', label: 'Teacher', gradient: 'from-green-400 to-blue-600', disabled: true }
                                ].map((roleOption) => (
                                    <div key={roleOption.id} className="relative group">
                                        <button
                                            type="button"
                                            onClick={() => !roleOption.disabled && setRole(roleOption.id)}
                                            className={`relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br ${roleOption.gradient} hover:text-white dark:text-white focus:ring-4 focus:outline-none ${
                                                role === roleOption.id 
                                                ? 'ring-2 ring-blue-500' 
                                                : ''
                                            } ${roleOption.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={roleOption.disabled}
                                        >
                                            <span className={`relative px-4 py-2 transition-all ease-in duration-75 rounded-md ${
                                                role === roleOption.id
                                                ? 'bg-transparent'
                                                : 'bg-white dark:bg-gray-900 dark:text-white'
                                            } group-hover:bg-transparent group-hover:dark:bg-transparent`}>
                                                {roleOption.label}
                                            </span>
                                        </button>
                                        {roleOption.disabled && (
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                                Currently unavailable
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>


                        {/* Attendance Status Dropdown */}
                        <div>
                            <label htmlFor="attendanceStatus" className="block text-sm font-medium mb-2">
                                Attendance Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="attendanceStatus"
                                value={attendanceStatus}
                                onChange={(e) => setAttendanceStatus(e.target.value)}
                                className="w-full px-4 py-3 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            >
                                <option value="">Select status</option>
                                <option value="attending">Attending</option>
                                <option value="withdraw">Withdraw</option>
                                <option value="onLeave">On Leave</option>
                                <option value="graduated">Graduated</option>
                            </select>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-3 text-white bg-[#047d8a] hover:bg-[#036570] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium"
                          >
                            {loading ? 'Saving...' : 'Complete Setup'}
                          </button>
                        </div>
                    </form>
                </div>
              </div>
            ) : screenSize === 'tablet' ? (
              <div className="flex-1 flex flex-col px-8 py-8 max-w-[800px] mx-auto">
                <div className="w-full space-y-8">
                    <h1 className="text-3xl font-bold mb-6 dark:text-white">Nice to meet you! Let's get acquainted.</h1>
                    
                    {/* Card for tablet - placed between title and form */}
                    <div className="flex justify-center mb-8">
                        <div className="w-full max-w-[500px]">
                            <CardContainer userData={userData} />
                        </div>
                    </div>
                    
                    {error && (
                      <div className="bg-red-500/20 text-red-200 p-4 rounded-md mb-6">
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
                            <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 pr-2">TNT -</span>
                            <input 
                                type="text" 
                                id="studentId" 
                                value={studentId}
                                onChange={(e) => {
                                    // Only allow numbers
                                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                    setStudentId(numericValue);
                                }}
                                className="w-full px-8 py-3 pl-[72px] rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                Semester <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="semester"
                                value={graduationYear}
                                onChange={(e) => setGraduationYear(e.target.value)}
                                className="w-full px-5 py-3 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select semester</option>
                                <option value="1">First Semester</option>
                                <option value="2">Second Semester</option>
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
                        <div className='flex space-x-5'>
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
                                        <span className={`relative px-8 py-1.5 transition-all ease-in duration-75 rounded-md ${
                                            role === roleOption.id
                                            ? 'bg-transparent text-white'
                                            : 'bg-white hover:text-white dark:bg-gray-900 dark:text-white'
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
                            className="w-full px-5 py-3 text-white bg-[#047d8a] hover:bg-[#036570] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? 'Saving...' : 'Complete Setup'}
                          </button>
                        </div>
                    </form>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Layout - Left Form Section */}
                <div className="flex-1 flex flex-col px-16 py-12 max-w-[800px]">
                    <div className="w-full space-y-6 mb-8">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 dark:text-white">Nice to meet you! Let's get acquainted.</h1>
                        
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
                                <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 pr-2">TNT -</span>
                                <input 
                                    type="text" 
                                    id="studentId" 
                                    value={studentId}
                                    onChange={(e) => {
                                        // Only allow numbers
                                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                        setStudentId(numericValue);
                                    }}
                                    className="w-full px-8 py-3 pl-[72px] rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    Semester <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="semester"
                                    value={graduationYear}
                                    onChange={(e) => setGraduationYear(e.target.value)}
                                    className="w-full px-5 py-3 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select semester</option>
                                    <option value="1">First Semester</option>
                                    <option value="2">Second Semester</option>
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
                            <div className='flex space-x-5'>
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
                                            <span className={`relative px-8 py-1.5 transition-all ease-in duration-75 rounded-md ${
                                                role === roleOption.id
                                                ? 'bg-transparent text-white'
                                                : 'bg-white hover:text-white dark:bg-gray-900 dark:text-white'
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
                                className="w-full px-5 py-3 text-white bg-[#047d8a] hover:bg-[#036570] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loading ? 'Saving...' : 'Complete Setup'}
                              </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Desktop Layout - Right Section */}
                <div className="flex-1 flex py-36">
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Virtual ID Card</h2>
                        <p className="text-gray-600 dark:text-gray-300">This is how your ID card will appear. You can customize your profile picture.</p>
                        <div className="flex justify-center items-center mt-6">
                            <CardContainer userData={userData} />
                        </div>
                    </div>
                </div>
              </>
            )}
        </div>
    </>
  );
}
