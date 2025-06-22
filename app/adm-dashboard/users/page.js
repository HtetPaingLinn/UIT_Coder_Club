'use client';
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, getDocs, query, where, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, ArrowLeft, MoreVertical, Menu } from 'lucide-react';
import Link from 'next/link';
import { Montserrat } from 'next/font/google';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Loading from '@/components/Loading';
import Image from 'next/image';
import { DashboardNav } from '@/components/ui/dashboard-nav';
import { DashboardHeader } from '@/components/ui/dashboard-header';

const montserrat = Montserrat({ subsets: ["latin"], weight: ['500']});
  
export default function UsersPage() {
  const [showLoading, setShowLoading] = useState(true);
  const { currentUser, userDataObj, loading: authLoading } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [mentors, setMentors] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [userToRemove, setUserToRemove] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [enrolledYear, setEnrolledYear] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [major, setMajor] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('');

  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();

  // Auto-clear success and error messages after 30 seconds
  useEffect(() => {
    let timeoutId;
    if (success || error) {
      timeoutId = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 30000); // 30 seconds
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [success, error]);

  useEffect(() => {
    if (currentUser && userDataObj) {
      setCurrentUserRole(userDataObj.role || '');
      console.log('Current user role:', userDataObj.role);
    }
  }, [currentUser, userDataObj]);

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchMentors();
      fetchStudentList();
    }
  }, [authLoading, currentUser]);

  // Handle authentication and loading states
  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        // User is not authenticated, redirect to login
        router.push('/Login');
        return;
      }
      
      // Check if user has admin privileges
      if (userDataObj && !['admin', 'teacher'].includes(userDataObj.role)) {
        setError('You do not have permission to access this page. Only admin and teacher users can access user management.');
        setShowLoading(false);
        return;
      }
      
      // User is authenticated and has proper permissions
      setShowLoading(false);
    }
  }, [authLoading, currentUser, userDataObj, router]);

  const fetchMentors = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'mentor'));
      const querySnapshot = await getDocs(q);
      const mentorsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMentors(mentorsList);
    } catch (err) {
      setError('Failed to fetch mentors: ' + err.message);
    }
  };

  const fetchStudentList = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);
      const students = [];
      querySnapshot.forEach(doc => {
        students.push({ id: doc.id, ...doc.data() });
      });
      setStudentList(students);
    } catch (error) {
      console.error('Error fetching student list:', error);
    }
  };

  const handleAddMentor = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Check if user has admin privileges
    if (!['admin', 'teacher'].includes(currentUserRole)) {
      setError('You do not have permission to add mentors. Only admin and teacher users can perform this action.');
      setLoading(false);
      return;
    }

    // Form validation
    if (!name || !email || !studentId || !major || !enrolledYear || !graduationYear || !attendanceStatus) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      // Generate a temporary password
      const tempPassword = `TNT${studentId}@${new Date().getFullYear()}`;
      
      // Create Firebase Authentication user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
      const newUser = userCredential.user;
      
      // Send password reset email so the mentor can set their own password
      await sendPasswordResetEmail(auth, email);
      
      // Create Firestore document with the new user's UID
      await setDoc(doc(db, 'users', newUser.uid), {
        name,
        email,
        studentId: `TNT-${studentId}`,
        major,
        role: 'mentor',
        yearLevel: enrolledYear,
        semester: graduationYear,
        attendanceStatus,
        setupCompleted: true,
        createdAt: new Date(),
        addedBy: currentUser.uid // Track who added this mentor
      });

      setSuccess(`Mentor added successfully! Temporary password: ${tempPassword}. A password reset email has been sent to ${email}.`);
      setShowAddForm(false);
      resetForm();
      fetchMentors(); // Refresh the list
    } catch (err) {
      console.error('Error adding mentor:', err);
      
      // Handle specific Firebase Auth errors
      if (err.code === 'auth/email-already-in-use') {
        setError('A user with this email already exists in the system.');
      } else if (err.code === 'auth/invalid-email') {
        setError('The email address is not valid.');
      } else if (err.code === 'auth/weak-password') {
        setError('The password is too weak.');
      } else {
        setError('Failed to add mentor: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setStudentId('');
    setEnrolledYear('');
    setGraduationYear('');
    setMajor('');
    setAttendanceStatus('');
  };

  const handlePromoteUser = async (userId, newRole) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Check if user has admin privileges
      if (!['admin'].includes(currentUserRole)) {
        setError('You do not have permission to promote users. Only admin users can perform this action.');
        setLoading(false);
        return;
      }

      // Update user role in Firestore
      await setDoc(doc(db, 'users', userId), {
        role: newRole
      }, { merge: true });

      setSuccess(`User successfully promoted to ${newRole}!`);
      
      // Refresh the lists
      fetchMentors();
      fetchStudentList();
    } catch (err) {
      console.error('Error promoting user:', err);
      setError('Failed to promote user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId, userEmail) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Check if user has admin privileges
      if (!['admin'].includes(currentUserRole)) {
        setError('You do not have permission to remove users. Only admin users can perform this action.');
        setLoading(false);
        return;
      }

      // Get user auth data
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        setError('User not found in database.');
        setLoading(false);
        return;
      }

      const userData = userDoc.data();

      // Delete user document from Firestore
      await deleteDoc(doc(db, 'users', userId));

      // Note: Deleting from Firebase Auth requires admin SDK on backend
      // For now, we'll just delete from Firestore and show a message
      setSuccess(`User ${userData.name} (${userEmail}) has been removed from the system. Note: Their authentication account may still exist and should be removed manually if needed.`);
      
      // Refresh the lists
      fetchMentors();
      fetchStudentList();
    } catch (err) {
      console.error('Error removing user:', err);
      setError('Failed to remove user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmRemoveUser = (userId, userEmail, userName) => {
    if (window.confirm(`Are you sure you want to remove ${userName} (${userEmail})? This action cannot be undone.`)) {
      handleRemoveUser(userId, userEmail);
    }
  };

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

  useEffect(() => {
    setMajor('');
  }, [enrolledYear]);
  
  if (showLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 via-teal-100 to-slate-100">
          <Loading />
        </div>
      );
    }
  return (

    <div className="flex min-h-screen bg-slate-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200/50 dark:border-gray-700/50 space-x-2">
              <div className="bg-white/20 dark:bg-transparent p-1 rounded-lg">
                <Image src={'/uit_logo.png'} width={40} height={40} alt={'uit_logo'} />
              </div>
              <div>
                <h1 className={`${montserrat.className} my-auto text-lg font-semibold text-slate-950 dark:text-white mt-1`}>UIT Coding Club</h1>
              </div>
            </div>
            <DashboardNav />
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex w-64 flex-col fixed inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200/50 dark:border-gray-700/50 space-x-2">
            <div className="bg-white/20 dark:bg-transparent p-1 rounded-lg">
              <Image src={'/uit_logo.png'} width={40} height={40} alt={'uit_logo'} />
            </div>
            <div>
              <h1 className={`${montserrat.className} my-auto text-lg font-semibold text-slate-950 dark:text-white mt-1`}>UIT Coding Club</h1>
            </div>
          </div>
          <DashboardNav />
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1 w-full">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2 min-w-0">
              <div className="bg-white/20 dark:bg-transparent p-1 rounded-lg flex-shrink-0">
                <Image src={'/uit_logo.png'} width={32} height={32} alt={'uit_logo'} />
              </div>
              <h1 className={`${montserrat.className} my-auto text-lg font-semibold text-slate-950 dark:text-white truncate`}>UIT Coding Club</h1>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <DashboardHeader />
        </div>
        
        <main className="flex-1 p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className={`${montserrat.className} text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center`}>
                <Users className="h-8 w-8 mr-3 text-primary" />
                Users Management
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
                Manage mentors and students in the system
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => setShowAddForm(true)} className="bg-[#047d8a] hover:bg-[#025963e9] text-white w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add New Mentor
              </Button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="bg-green-500/20 text-green-900 p-4 rounded-md mb-6">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-500/20 text-red-800 p-4 rounded-md mb-6">
              {error}
            </div>
          )}

          {/* Add Mentor Form */}
          {showAddForm && (
            <Card className="mb-8 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <CardTitle className="text-xl px-4 sm:px-8 font-bold text-gray-800 dark:text-gray-200">
                Add New Mentor
              </CardTitle>
              <CardContent className="px-4 sm:px-8">
                <form onSubmit={handleAddMentor} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        id="name"
                        required
                        placeholder="First and Last Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        id="email"
                        required
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label htmlFor="studentId" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Student ID <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">TNT-</span>
                        <Input
                          type="text"
                          id="studentId"
                          value={studentId}
                          onChange={(e) => {
                            const numericValue = e.target.value.replace(/[^0-9]/g, '');
                            setStudentId(numericValue);
                          }}
                          className="w-full pl-12"
                          placeholder="Enter ID number"
                          maxLength={4}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="yearLevel" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Year Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="yearLevel"
                        value={enrolledYear}
                        onChange={(e) => setEnrolledYear(e.target.value)}
                        className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <label htmlFor="semester" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Semester <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="semester"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select semester</option>
                        <option value="1">First Semester</option>
                        <option value="2">Second Semester</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="major" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Major <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="major"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <label htmlFor="attendanceStatus" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Attendance Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="attendanceStatus"
                        value={attendanceStatus}
                        onChange={(e) => setAttendanceStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select status</option>
                        <option value="attending">Attending</option>
                        <option value="withdraw">Withdraw</option>
                        <option value="onLeave">On Leave</option>
                        <option value="graduated">Graduated</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                    >
                      {loading ? 'Adding...' : 'Add Mentor'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        resetForm();
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Mentors List */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <CardTitle className="text-xl p-4 sm:p-8 font-bold text-gray-800 dark:text-gray-200">
              Current Mentors ({mentors.length})
            </CardTitle>
            <CardContent className="px-4 sm:px-8">
              {mentors.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No mentors found. Add your first mentor using the button above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                      <tr>
                        <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                        <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                        <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student ID</th>
                        <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Major</th>
                        <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Year</th>
                        <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {mentors.map((mentor, index) => (
                        <tr key={mentor.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-colors duration-200">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {index + 1}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                            {mentor.name}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {mentor.email}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-mono">
                            {mentor.studentId}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              {mentor.major}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              Year {mentor.yearLevel}
                            </span>
                          </td>
                
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handlePromoteUser(mentor.id, 'admin')}>
                                  Promote to Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePromoteUser(mentor.id, 'mentor')}>
                                  Promote to Mentor
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => confirmRemoveUser(mentor.id, mentor.email, mentor.name)}>
                                  Remove User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student Details Table */}
          <div className="mt-8 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border-2 border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center my-auto">
                <Users className="h-5 w-5 mr-2 text-indigo-600" />
                Student Details ({studentList.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Major</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Year</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student ID</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {studentList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-3 sm:px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No students found in the system.
                      </td>
                    </tr>
                  ) : (
                    studentList.map((student, index) => (
                      <tr key={student.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-colors duration-200">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {index + 1}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {student.name}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {student.email}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {student.major}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            Year {student.yearLevel}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-mono">
                          {student.studentId}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePromoteUser(student.id, 'admin')}>
                                Promote to Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePromoteUser(student.id, 'mentor')}>
                                Promote to Mentor
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => confirmRemoveUser(student.id, student.email, student.name)}>
                                Remove User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 