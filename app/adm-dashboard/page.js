'use client';
import React, { useState, useEffect } from 'react'
import Loading from '@/components/Loading';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc, collection, getDocs, query, where, orderBy, addDoc, serverTimestamp, onSnapshot, deleteDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { DashboardNav } from '@/components/ui/dashboard-nav';
import { DashboardHeader } from '@/components/ui/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, BookOpen, Calendar, MessageSquare, TrendingUp, Activity, GraduationCap, UserPlus, Plus, Clock, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from "next/image";
import { Montserrat } from 'next/font/google'

const montserrat = Montserrat({ subsets: ["latin"], weight: ['500']})

export default function AdminDashboard() {
  const { currentUser, userDataObj, loading } = useAuth();
  const [data, setData] = useState(null);
  const [showLoading, setShowLoading] = useState(true);
  const [debug, setDebug] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [mentorCount, setMentorCount] = useState(0);
  const [studentList, setStudentList] = useState([]);
  const [userGrowth, setUserGrowth] = useState(0);
  const [mentorGrowth, setMentorGrowth] = useState(0);
  const [workshopCount, setWorkshopCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [workshopGrowth, setWorkshopGrowth] = useState(0);
  const [eventGrowth, setEventGrowth] = useState(0);
  const [activities, setActivities] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();

  // Function to format time difference
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  };

  // Function to create activity log
  const createActivity = async (type, description, details = {}) => {
    try {
      const activityData = {
        type,
        description,
        details,
        timestamp: serverTimestamp(),
        createdBy: currentUser?.uid || 'system'
      };
      
      await addDoc(collection(db, 'activities'), activityData);
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  };

  // Function to fetch real-time activities from all collections
  const fetchRealTimeActivities = async () => {
    try {
      // Check if user is still authenticated before making Firestore calls
      if (!currentUser) {
        console.log('User not authenticated, skipping activities fetch');
        return;
      }

      console.log('Fetching real-time activities from all collections...');
      
      // Get activities from all collections
      const [usersSnapshot, coursesSnapshot, eventsSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'courses')),
        getDocs(collection(db, 'events'))
      ]);

      const allActivities = [];

      // Process users (new registrations)
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.createdAt) {
          allActivities.push({
            id: `user-${doc.id}`,
            type: 'student_registration',
            description: `New ${userData.role || 'student'} registration: ${userData.email || userData.name || 'Unknown'}`,
            timestamp: userData.createdAt,
            details: { 
              email: userData.email, 
              userId: doc.id, 
              role: userData.role || 'student',
              name: userData.name
            }
          });
        }
      });

      // Process courses (workshops)
      coursesSnapshot.forEach(doc => {
        const courseData = doc.data();
        if (courseData.createdAt) {
          allActivities.push({
            id: `course-${doc.id}`,
            type: 'workshop_created',
            description: `New workshop "${courseData.title}" was created`,
            timestamp: courseData.createdAt,
            details: { 
              workshopId: doc.id, 
              title: courseData.title, 
              instructor: courseData.instructor 
            }
          });
        }
        if (courseData.updatedAt && courseData.updatedAt !== courseData.createdAt) {
          allActivities.push({
            id: `course-update-${doc.id}`,
            type: 'workshop_updated',
            description: `Workshop "${courseData.title}" was updated`,
            timestamp: courseData.updatedAt,
            details: { 
              workshopId: doc.id, 
              title: courseData.title, 
              instructor: courseData.instructor 
            }
          });
        }
      });

      // Process events
      eventsSnapshot.forEach(doc => {
        const eventData = doc.data();
        if (eventData.createdAt) {
          allActivities.push({
            id: `event-${doc.id}`,
            type: 'event_scheduled',
            description: `New event "${eventData.title}" was scheduled`,
            timestamp: eventData.createdAt,
            details: { 
              eventId: doc.id, 
              title: eventData.title, 
              date: eventData.date, 
              location: eventData.location 
            }
          });
        }
        if (eventData.updatedAt && eventData.updatedAt !== eventData.createdAt) {
          allActivities.push({
            id: `event-update-${doc.id}`,
            type: 'event_updated',
            description: `Event "${eventData.title}" was updated`,
            timestamp: eventData.updatedAt,
            details: { 
              eventId: doc.id, 
              title: eventData.title, 
              date: eventData.date, 
              location: eventData.location 
            }
          });
        }
      });

      // Sort all activities by timestamp (most recent first)
      allActivities.sort((a, b) => {
        const timeA = a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const timeB = b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return timeB - timeA;
      });

      // Take only the most recent 3 activities
      const recentActivities = allActivities.slice(0, 3);
      console.log('Recent activities fetched:', recentActivities.length);
      setActivities(recentActivities);
    } catch (error) {
      console.error('Error fetching real-time activities:', error);
      // Don't set error state if it's a permission error during logout
      if (error.code !== 'permission-denied') {
        setActivities([]);
      }
    }
  };

  // Real-time activities listener for all collections
  useEffect(() => {
    if (!showLoading && currentUser) {
      try {
        console.log('Setting up real-time activities listeners...');
        
        // Set up listeners for all collections
        const unsubscribeUsers = onSnapshot(collection(db, 'users'), () => {
          fetchRealTimeActivities();
        }, (error) => {
          console.error('Error in users listener:', error);
          // Don't throw error for permission denied during logout
          if (error.code !== 'permission-denied') {
            console.error('Users listener error:', error);
          }
        });
        
        const unsubscribeCourses = onSnapshot(collection(db, 'courses'), () => {
          fetchRealTimeActivities();
        }, (error) => {
          console.error('Error in courses listener:', error);
          // Don't throw error for permission denied during logout
          if (error.code !== 'permission-denied') {
            console.error('Courses listener error:', error);
          }
        });
        
        const unsubscribeEvents = onSnapshot(collection(db, 'events'), () => {
          fetchRealTimeActivities();
        }, (error) => {
          console.error('Error in events listener:', error);
          // Don't throw error for permission denied during logout
          if (error.code !== 'permission-denied') {
            console.error('Events listener error:', error);
          }
        });

        // Initial fetch
        fetchRealTimeActivities();

        return () => {
          console.log('Cleaning up real-time activities listeners...');
          unsubscribeUsers();
          unsubscribeCourses();
          unsubscribeEvents();
        };
      } catch (error) {
        console.error('Error setting up real-time activities listeners:', error);
        setActivities([]);
      }
    }
  }, [showLoading, currentUser]);

  // Function to get activity icon and color
  const getActivityConfig = (type) => {
    switch (type) {
      case 'student_registration':
        return {
          icon: UserPlus,
          color: 'bg-blue-500',
          bgGradient: 'from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20'
        };
      case 'workshop_created':
      case 'workshop_updated':
        return {
          icon: BookOpen,
          color: 'bg-green-500',
          bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
        };
      case 'event_scheduled':
      case 'event_updated':
        return {
          icon: Calendar,
          color: 'bg-orange-500',
          bgGradient: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20'
        };
      case 'mentor_added':
        return {
          icon: GraduationCap,
          color: 'bg-purple-500',
          bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
        };
      default:
        return {
          icon: Activity,
          color: 'bg-gray-500',
          bgGradient: 'from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20'
        };
    }
  };

  // Function to create sample activities for demonstration
  const createSampleActivities = async () => {
    try {
      const sampleActivities = [
        {
          type: 'student_registration',
          description: 'New student registration: john.doe@uit.edu.mm',
          details: { email: 'john.doe@uit.edu.mm', userId: 'sample-user-1' }
        },
        {
          type: 'workshop_created',
          description: 'New workshop "Advanced Web Development" was created',
          details: { workshopId: 'sample-workshop-1', title: 'Advanced Web Development', instructor: 'Dr. Smith' }
        },
        {
          type: 'event_scheduled',
          description: 'New event "Annual Hackathon 2024" was scheduled',
          details: { eventId: 'sample-event-1', title: 'Annual Hackathon 2024', date: '2024-12-15', location: 'Main Campus' }
        },
        {
          type: 'mentor_added',
          description: 'New mentor "Prof. Johnson" was added to the platform',
          details: { mentorId: 'sample-mentor-1', name: 'Prof. Johnson', specialization: 'AI/ML' }
        }
      ];

      for (const activity of sampleActivities) {
        await createActivity(activity.type, activity.description, activity.details);
      }

      console.log('Sample activities created successfully');
    } catch (error) {
      console.error('Error creating sample activities:', error);
    }
  };

  const fetchUserCount = async () => {
    try {
      // Check if user is still authenticated before making Firestore calls
      if (!currentUser) {
        console.log('User not authenticated, skipping user count fetch');
        return;
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);
      console.log('Student user count:', querySnapshot.size);
      querySnapshot.forEach(doc => console.log(doc.id, doc.data()));
      setUserCount(querySnapshot.size);
      
      // Calculate growth (for demo purposes, you can replace with actual historical data)
      const growth = Math.floor(Math.random() * 20) + 5; // Random growth between 5-25%
      setUserGrowth(growth);
    } catch (error) {
      console.error('Error fetching user count:', error);
      // Don't set error state if it's a permission error during logout
      if (error.code !== 'permission-denied') {
        setUserCount(0);
        setUserGrowth(0);
      }
    }
  };

  const fetchMentorCount = async () => {
    try {
      // Check if user is still authenticated before making Firestore calls
      if (!currentUser) {
        console.log('User not authenticated, skipping mentor count fetch');
        return;
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'mentor'));
      const querySnapshot = await getDocs(q);
      console.log('Mentor user count:', querySnapshot.size);
      setMentorCount(querySnapshot.size);
      
      // Calculate growth (for demo purposes, you can replace with actual historical data)
      const growth = Math.floor(Math.random() * 15) + 3; // Random growth between 3-18%
      setMentorGrowth(growth);
    } catch (error) {
      console.error('Error fetching mentor count:', error);
      // Don't set error state if it's a permission error during logout
      if (error.code !== 'permission-denied') {
        setMentorCount(0);
        setMentorGrowth(0);
      }
    }
  };

  const fetchWorkshopCount = async () => {
    try {
      // Check if user is still authenticated before making Firestore calls
      if (!currentUser) {
        console.log('User not authenticated, skipping workshop count fetch');
        return;
      }

      const coursesRef = collection(db, 'courses');
      const querySnapshot = await getDocs(coursesRef);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Filter for active workshops (end date is in the future or no end date specified)
      const activeWorkshops = querySnapshot.docs.filter(doc => {
        const data = doc.data();
        if (!data.endDate) return true; // If no end date, consider it active
        const endDate = new Date(data.endDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate >= today;
      });
      
      console.log('Active workshop count:', activeWorkshops.length);
      setWorkshopCount(activeWorkshops.length);
      
      // Calculate growth (for demo purposes, you can replace with actual historical data)
      const growth = Math.floor(Math.random() * 10) + 2; // Random growth between 2-12%
      setWorkshopGrowth(growth);
    } catch (error) {
      console.error('Error fetching workshop count:', error);
      // Don't set error state if it's a permission error during logout
      if (error.code !== 'permission-denied') {
        setWorkshopCount(0);
        setWorkshopGrowth(0);
      }
    }
  };

  const fetchEventCount = async () => {
    try {
      // Check if user is still authenticated before making Firestore calls
      if (!currentUser) {
        console.log('User not authenticated, skipping event count fetch');
        return;
      }

      const eventsRef = collection(db, 'events');
      const querySnapshot = await getDocs(eventsRef);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Filter for upcoming events (date is in the future)
      const upcomingEvents = querySnapshot.docs.filter(doc => {
        const data = doc.data();
        if (!data.date) return false;
        const eventDate = new Date(data.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      });
      
      console.log('Upcoming event count:', upcomingEvents.length);
      setEventCount(upcomingEvents.length);
      
      // Calculate growth (for demo purposes, you can replace with actual historical data)
      const growth = Math.floor(Math.random() * 15) + 5; // Random growth between 5-20%
      setEventGrowth(growth);
    } catch (error) {
      console.error('Error fetching event count:', error);
      // Don't set error state if it's a permission error during logout
      if (error.code !== 'permission-denied') {
        setEventCount(0);
        setEventGrowth(0);
      }
    }
  };

  const fetchStudentList = async () => {
    try {
      // Check if user is still authenticated before making Firestore calls
      if (!currentUser) {
        console.log('User not authenticated, skipping student list fetch');
        return;
      }

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
      // Don't set error state if it's a permission error during logout
      if (error.code !== 'permission-denied') {
        setStudentList([]);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setDebug(prev => prev + '\nChecking auth state...');
        
        if (!user) {
          setDebug(prev => prev + '\nNo user found, redirecting to login');
          router.push('/Login');
          return;
        }

        setDebug(prev => prev + `\nUser found: ${user.email}`);

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setDebug(prev => prev + '\nNo user data found, redirecting to setup');
          router.push('/setup');
          return;
        }

        const userData = userSnap.data();
        setDebug(prev => prev + `\nUser role: ${userData.role}`);

        if (userData.role === 'student') {
          setDebug(prev => prev + '\nStudent role detected, redirecting to user dashboard');
          router.push('/user-dashboard');
          return;
        } else if (!['teacher', 'mentor', 'admin'].includes(userData.role)) {
          setDebug(prev => prev + '\nInvalid role, redirecting to setup');
          router.push('/setup');
          return;
        }

        setDebug(prev => prev + '\nUser authorized, showing dashboard');
        setShowLoading(false);

      } catch (error) {
        console.error('Error checking admin access:', error);
        setDebug(prev => prev + `\nError: ${error.message}`);
        router.push('/user-dashboard');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userDataObj && JSON.stringify(userDataObj) !== JSON.stringify(data)) {
      setData(userDataObj);
    }
  }, [userDataObj]);
  
  useEffect(() => {
    if (!showLoading && !currentUser) {
      router.push('/Login');
    }
  }, [showLoading, currentUser, router]);

  useEffect(() => {
    if (!showLoading) {
      fetchUserCount();
      fetchMentorCount();
      fetchWorkshopCount();
      fetchEventCount();
      fetchStudentList();
      // fetchActivities(); // Fetch activities when dashboard loads
    }
  }, [showLoading]);

  if (showLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 via-teal-100 to-slate-100">
        <Loading />
      </div>
    );
  }

  const stats = [
    {
      title: "Total Users",
      value: userCount.toString(),
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
      borderColor: "border-blue-500/20",
      growth: userGrowth
    },
    {
      title: "Total Mentors",
      value: mentorCount.toString(),
      icon: GraduationCap,
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-500/10 to-teal-500/10",
      borderColor: "border-emerald-500/20",
      growth: mentorGrowth
    },
    {
      title: "Active Workshops",
      value: workshopCount.toString(),
      icon: BookOpen,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/10 to-pink-500/10",
      borderColor: "border-purple-500/20",
      growth: workshopGrowth
    },
    {
      title: "Upcoming Events",
      value: eventCount.toString(),
      icon: Calendar,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-500/10 to-red-500/10",
      borderColor: "border-orange-500/20",
      growth: eventGrowth
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 overflow-y-auto">
            <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 dark:bg-transparent p-1 rounded-lg">
                  <Image src={'/uit_logo.png'} width={40} height={40} alt={'uit_logo'} />
                </div>
                <div>
                  <h1 className={`${montserrat.className} my-auto text-lg font-semibold text-slate-950 dark:text-white mt-1`}>UIT Coding Club</h1>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
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
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 min-w-[44px] min-h-[44px]"
            >
              <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </Button>
            <div className="flex items-center space-x-2 min-w-0 flex-1">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
                Overview of club activities and statistics
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 lg:mb-8">
            {stats.map((stat) => (
              <Card key={stat.title} className={`relative overflow-hidden border ${stat.borderColor} bg-white/70 dark:bg-slate-800/70 transition-all duration-300 hover:scale-105`}>
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.bgGradient} opacity-50`}></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 pt-4 sm:pt-6 sm:pb-4 px-4 sm:px-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-r ${stat.gradient} shadow-lg`}>
                    <stat.icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 pb-4 sm:pb-6 px-4 sm:px-6">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600 dark:text-green-400">
                      {stat.growth > 0 ? `+${stat.growth}%` : `${stat.growth}%`} from last month
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-7 mb-6 lg:mb-8">
            <Card className="lg:col-span-4 py-4 sm:py-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300">
              <CardTitle className="px-4 sm:px-6 mb-3 text-foreground dark:text-foreground flex items-center text-sm sm:text-base">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                Recent Activity
              </CardTitle>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-2 sm:space-y-3">
                  {activities.length > 0 ? (
                    activities.map((activity) => {
                      const config = getActivityConfig(activity.type);
                      return (
                        <div key={activity.id} className={`flex items-center p-2 sm:p-3 rounded-lg ${config.bgGradient}`}>
                          <div className={`p-1.5 sm:p-2 rounded-lg ${config.color} shadow-lg mr-2 sm:mr-3 flex-shrink-0`}>
                            <config.icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 break-words">{activity.description}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center p-2 sm:p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded-lg">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gray-500 shadow-lg mr-2 sm:mr-3">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">No recent activity</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Activities will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 py-4 sm:py-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300">
              <CardTitle className="px-4 sm:px-6 mb-3 text-foreground dark:text-foreground text-sm sm:text-base">Quick Actions</CardTitle>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-2 sm:space-y-3">
                  <Button 
                    onClick={() => router.push('/adm-dashboard/users')}
                    className="w-full bg-slate-200 text-slate-950 shadow-sm hover:bg-slate-300 transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5"
                  >
                    Add New User
                  </Button>
                  <Button 
                    onClick={() => router.push('/adm-dashboard/workshops')}
                    className="w-full bg-slate-200 text-slate-950 shadow-sm hover:bg-slate-300 transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5"
                  >
                    Create Course
                  </Button>
                  <Button 
                    onClick={() => router.push('/adm-dashboard/events')}
                    className="w-full bg-slate-200 text-slate-950 shadow-sm hover:bg-slate-300 transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5"
                  >
                    Schedule Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Details Section */}
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border-2 border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center my-auto">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-indigo-600" />
                Student Details
              </h2>
            </div>
            
            {/* Mobile Student Cards */}
            <div className="lg:hidden p-4 space-y-4">
              {studentList.map((student, index) => (
                <div key={student.id} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">#{index + 1}</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      Year {student.yearLevel}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{student.name}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{student.email}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {student.major}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{student.studentId}</span>
                  </div>
                </div>
              ))}
              {studentList.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No students found</p>
                </div>
              )}
            </div>

            {/* Desktop Student Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Major</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Year</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {studentList.map((student, index) => (
                    <tr key={student.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {student.major}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Year {student.yearLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-mono">
                        {student.studentId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {studentList.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No students found</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
