"use client";

import { useState, useEffect, useRef } from 'react';
// import PreviewCardfront from '../components/PreviewCardfront';
// import PreviewCardback from '../components/PreviewCardback';
// import Cardback from '@/components/Cardback';
// import Cardfront from '@/components/Cardfront';
import { DotGothic16, Geist_Mono } from 'next/font/google';
import Marquee from './Marquee';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Loading from '@/components/Loading';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import ImageUpload from '@/components/ImageUpload';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { ArrowLeft } from 'lucide-react';

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dotGothic16 = DotGothic16({
  variable: "--font-dot-gothic-16",
  subsets: ["latin"],
  weight: "400",
});

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dxmqfapo7';
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'codingclub-uploads';

export default function ProfileScreen() {
  const { currentUser, userDataObj, loading } = useAuth();
  const router = useRouter();
  const [localLoading, setLocalLoading] = useState(true);
  const db = getFirestore();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Local state for form fields
  const [studentId, setStudentId] = useState('');
  const [enrolledYear, setEnrolledYear] = useState('');
  const [semester, setSemester] = useState('');
  const [role, setRole] = useState('student');
  const [major, setMajor] = useState('');
  const [name, setName] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState('/boy.jpeg');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Populate fields from userDataObj when loaded
  useEffect(() => {
    if (!loading && userDataObj) {
      setStudentId((userDataObj.studentId || '').replace('TNT-', ''));
      setEnrolledYear(userDataObj.yearLevel || '');
      setSemester(userDataObj.semester || '');
      setRole(userDataObj.role || 'student');
      setMajor(userDataObj.major || '');
      setName(userDataObj.name || '');
      setAttendanceStatus(userDataObj.attendanceStatus || '');
      setEmail(userDataObj.email || currentUser?.email || '');
      setProfileImage(userDataObj.profileImage || '/boy.jpeg');
      setUploadedImageUrl(userDataObj.profileImage || '');
      setLocalLoading(false);
    }
  }, [loading, userDataObj, currentUser]);

  // For preview card
  const userData = {
    name: name || "Mr. Student",
    studentId: studentId || "0404",
    yearLevel: enrolledYear || "1",
    semester: semester || "1",
    major: major || "COMP.SCI"
  };

  // Major options logic (copied from setup)
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

  // Reset major when year changes, but only if not in available majors
  useEffect(() => {
    const availableMajors = getAvailableMajors();
    if (major && !availableMajors.includes(major)) {
      setMajor('');
    }
    // else, keep the current major
  }, [enrolledYear]);

  // Track if any field has changed
  const hasChanges =
    userDataObj && (
      name !== (userDataObj.name || '') ||
      studentId !== ((userDataObj.studentId || '').replace('TNT-', '')) ||
      enrolledYear !== (userDataObj.yearLevel || '') ||
      semester !== (userDataObj.semester || '') ||
      role !== (userDataObj.role || 'student') ||
      major !== (userDataObj.major || '') ||
      attendanceStatus !== (userDataObj.attendanceStatus || '')
    );

  // Handle image upload
  const handleImageUpload = (imageUrl) => {
    console.log('Image uploaded successfully:', imageUrl);
    setUploadedImageUrl(imageUrl);
    setProfileImage(imageUrl);
  };

  // Save logic: update Firestore user document
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');
    try {
      if (!currentUser) throw new Error('No authenticated user');
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name,
        studentId: `TNT-${studentId}`,
        yearLevel: enrolledYear,
        semester,
        role,
        major,
        attendanceStatus,
        profileImage: uploadedImageUrl || profileImage,
      });
      setSaveMessage('Profile updated successfully!');
    } catch (err) {
      setSaveMessage('Failed to update profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Format year/semester for preview
  const formatYearSemester = (year, semester) => {
    if (!year || !semester) return "1ST I";
    const yearMap = {
      '1': '1ST', '2': '2ND', '3': '3RD', '4': '4TH', '5': '5TH'
    };
    const semesterNumber = (parseInt(year) - 1) * 2 + parseInt(semester);
    const romanNumerals = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X' };
    return `${yearMap[year] || '1ST'} ${romanNumerals[semesterNumber] || 'I'}`;
  };

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('No authenticated user');
      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      // Update password
      await updatePassword(user, newPassword);
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordModal(false);
    } catch (err) {
      if (
        err.message === 'Firebase: Error (auth/wrong-password).' ||
        err.message === 'Firebase: Error (auth/invalid-credential).'
      ) {
        setPasswordError('Current password does not match');
      } else {
        setPasswordError(err.message);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading || localLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loading /></div>;
  }

  return (
    <div className="flex flex-wrap bg-amber-50 relative">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-transparent text-black cursor-pointer max-sm:top-2 max-sm:left-2 max-sm:z-50"
      >
        <ArrowLeft className="w-8 h-8 max-sm:w-7 max-sm:h-7" />
      </button>
      {/* Left Section - Card Preview */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center gap-4 p-4 max-sm:pt-18 max-sm:mt-8">
        <div
          onClick={() => router.push('/card-preview')}
          style={{ perspective: 2000 }}
          className={`cursor-pointer ${dotGothic16.className}`}
        >
          <div className="max-sm:bottom-12 flex justify-center items-center max-sm:w-[298px] w-[530px] max-sm:h-[183px] h-[325px] bg-[#FEC590] max-sm:rounded-[15px] rounded-[18px] max-sm:border-[1.5px] border-[2px] border-black max-sm:pl-[19px] pl-[33px] max-sm:pr-[27px] pr-[48px] max-sm:pt-[23px] pt-[42px] max-sm:pb-[31px] pb-[56px] relative text-black">
            <div className="flex flex-col max-sm:rounded-[8px] rounded-[10px] overflow-hidden max-sm:border-[1.5px] border-2 border-black items-center justify-center max-sm:w-1/3 w-2/5">
              <div
                className="max-sm:w-[90px] w-[172px] max-sm:h-[120px] h-[228px] overflow-hidden relative group"
                onClick={e => e.stopPropagation()}
              >
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
              <h1 className= {`${dotGothic16.className} max-sm:text-[28px] max-sm:font-bold max-sm:text-gray-900 text-[49px] text-nowrap flex items-center mb-[4px]`}>Student ID</h1>
              <div className="w-full border-t-[2px] border-dashed border-black max-sm:my-2 my-5" />
              {/* Info Section: Use flex rows like CardFront.js */}
              <div className="flex flex-col gap-2 max-sm:text-[15px] text-[20px]">
                {/* First Row: Name & Roll No. */}
                <div className="flex flex-row gap-8 max-sm:gap-4 w-full">
                  <div className="flex flex-col max-w-[200px] flex-1">
                    <span className={`${geistMono.className} font-light max-sm:text-[8px] text-sm text-nowrap`}>
                      Name
                    </span>
                    <Marquee>{userData.name}</Marquee>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className={`${geistMono.className} font-light max-sm:text-[8px] text-sm text-nowrap`}>Roll No.</span>
                    <Marquee>{`TNT ${userData.studentId}`}</Marquee>
                  </div>
                </div>
                {/* Second Row: Year & Major */}
                <div className="flex flex-row gap-8 max-sm:gap-4 w-full">
                  <div className="flex flex-col flex-1">
                    <span className={`${geistMono.className} font-light max-sm:text-[8px] text-sm text-nowrap`}>Year</span>
                    <Marquee>{formatYearSemester(userData.yearLevel, userData.semester)}</Marquee>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className={`${geistMono.className} font-light max-sm:text-[8px] text-sm text-nowrap`}>Major</span>
                    <Marquee>{userData.major}</Marquee>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={`${dotGothic16.className} relative max-sm:-top-12 text-md text-gray-700 max-sm:text-sm`}>[Tap to View]</div>
      </div>
      {/* Right Section - Form */}
      <div className="w-full md:w-1/2 relative max-sm:-top-12 flex flex-col justify-center items-center p-4">
        <form onSubmit={handleSubmit} className="flex flex-col w-[90%] gap-4 sm:max-w-md md:max-w-lg lg:max-w-lg xl:max-w-md">
          {saveMessage && (
            <div className={`p-2 rounded-md mb-2 ${saveMessage.startsWith('Failed') ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>{saveMessage}</div>
          )}
          <div className="flex flex-col">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              disabled
              value={email}
              className="mt-1 p-2 text-gray-500 border-gray-700 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8183] cursor-not-allowed bg-amber-50"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30}
              className="mt-1 p-2 border-gray-700 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8183] bg-amber-50"
              required
              disabled={loading || saving}
            />
            <span className="text-xs text-gray-500 mt-1">{name.length}/30 characters</span>
          </div>
          <div className="flex flex-col">
            <label htmlFor="rollNo" className="text-sm font-medium">Roll No.</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-2/5 text-base text-gray-500">TNT -</span>
              <input
                type="text"
                id="rollNo"
                name="rollNo"
                value={studentId}
                maxLength={4}
                className="mt-1 p-2 pl-14 border-gray-700 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8183] cursor-not-allowed text-gray-500 bg-amber-50"
                required
                disabled
              />
            </div>
          </div>
          {/* Year and Term (Semester) */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col w-full">
              <label htmlFor="yearLevel" className="text-sm font-medium">Year Level</label>
              <select
                id="yearLevel"
                value={enrolledYear}
                onChange={e => setEnrolledYear(e.target.value)}
                className="mt-1 p-2 border-gray-700 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8183] bg-amber-50"
                required
                disabled={loading || saving}
              >
                <option value="">Select year</option>
                <option value="1">First Year</option>
                <option value="2">Second Year</option>
                <option value="3">Third Year</option>
                <option value="4">Fourth Year</option>
                <option value="5">Fifth Year</option>
              </select>
            </div>
            <div className="flex flex-col w-full">
              <label htmlFor="semester" className="text-sm font-medium">Term</label>
              <select
                id="semester"
                value={semester}
                onChange={e => setSemester(e.target.value)}
                className="mt-1 p-2 border-gray-700 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8183] bg-amber-50"
                required
                disabled={loading || saving}
              >
                <option value="">Select term</option>
                <option value="1">First Term</option>
                <option value="2">Second Term</option>
              </select>
            </div>
          </div>
          {/* Major */}
          <div className="flex flex-col">
            <label htmlFor="major" className="text-sm font-medium">Major</label>
            <select
              id="major"
              value={major}
              onChange={e => setMajor(e.target.value)}
              className="mt-1 p-2 border-gray-700 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8183] bg-amber-50"
              disabled={!enrolledYear || parseInt(enrolledYear) <= 2 || loading || saving}
              required
            >
              <option value="">
                {!enrolledYear ? 'Select a major' : 
                 parseInt(enrolledYear) <= 2 ? 'Major selection not available for 1st and 2nd year' :
                 'Select a major'}
              </option>
              {/* If current major is not in the list, show it as an option */}
              {major && getAvailableMajors().indexOf(major) === -1 && (
                <option value={major}>{major} (not in list)</option>
              )}
              {getAvailableMajors().map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          {/* Roles as dropdown */}
          <div className="flex flex-col">
            <label htmlFor="role" className="text-sm font-medium">Roles</label>
            <select
              id="role"
              value={role}
              onChange={e => setRole(e.target.value)}
              className="mt-1 p-2 border-gray-700 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8183] bg-amber-50"
              required
              disabled={loading || saving}
            >
              <option value="student">Student</option>
              <option value="mentor" disabled>Mentor (Currently unavailable)</option>
              <option value="teacher" disabled>Teacher (Currently unavailable)</option>
            </select>
          </div>
          {/* Attendance Status */}
          <div className="flex flex-col">
            <label htmlFor="attendanceStatus" className="text-sm font-medium">Attendance Status</label>
            <select
              id="attendanceStatus"
              value={attendanceStatus}
              onChange={e => setAttendanceStatus(e.target.value)}
              className="mt-1 p-2 border-gray-700 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8183] bg-amber-50"
              required
              disabled={loading || saving}
            >
              <option value="">Select status</option>
              <option value="attending">Attending</option>
              <option value="withdraw">Withdraw</option>
              <option value="onLeave">On Leave</option>
              <option value="graduated">Graduated</option>
            </select>
          </div>
          {/* Save/Change Password */}
          <div className='flex flex-col gap-1'>
            <button
              type="submit"
              className={`mt-4 bg-[#5DA7A7] border-black border-2 text-black py-2 px-4 rounded-md hover:bg-opacity-90 cursor-pointer ${(!hasChanges || loading || saving) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!hasChanges || loading || saving}
            >
              Save
            </button>
            <button
              type="button"
              className="mt-4 bg-red-500 font-bold border-black border-2 text-black py-2 px-4 rounded-md hover:bg-opacity-90 cursor-pointer text-lg"
              onClick={() => setShowPasswordModal(true)}
              disabled={loading || saving}
            >
              Change Password
            </button>
          </div>
        </form>
      </div>
      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-3xl w-10 h-10 flex items-center justify-center" onClick={() => setShowPasswordModal(false)}>&times;</button>
            <h2 className="text-2xl font-bold mb-4">Change Password</h2>
            <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4">
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="border-gray-700 border-2 rounded-md p-2 bg-amber-50"
                required
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="border-gray-700 border-2 rounded-md p-2 bg-amber-50"
                required
              />
              {passwordError && <div className="text-red-500 text-sm">{passwordError}</div>}
              {passwordSuccess && <div className="text-green-600 text-sm">{passwordSuccess}</div>}
              <button
                type="submit"
                className={`mt-2 bg-[#5DA7A7] border-black border-2 text-black py-2 px-4 rounded-md hover:bg-opacity-90 cursor-pointer ${passwordLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Updating...' : 'Update'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
