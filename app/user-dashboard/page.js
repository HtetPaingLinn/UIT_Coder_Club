'use client';
import React, { useState, useEffect } from 'react'
import Loading from '@/components/Loading';
import { Montserrat, Fugaz_One } from 'next/font/google';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { FaGraduationCap, FaCode, FaUsers } from 'react-icons/fa';
import Hero from '@/components/Hero';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';
import { BackgroundBeamsWithCollision } from '@/components/ui/background-beams-with-collision';
import { getAllEvents, getAllWorkshops } from '@/firebase/utils';
import Image from 'next/image';

const monstserrat = Montserrat({ subsets: ['latin'], weight: ['500'] });

export default function Dashboard() {
  const { currentUser, userDataObj, loading } = useAuth();
  const [data, setData] = useState(null);
  const [showLoading, setShowLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();

  {/** Demo info */}
  const userStats = {
    eventsAttended: 5,
    projectsCompleted: 3,
    skillsLearned: 8,
    contributions: 12
  };

  const upcomingActivities = [
    {
      id: 1,
      title: 'Web Development Workshop',
      date: 'March 15, 2024',
      type: 'Workshop',
      status: 'Registered'
    },
    {
      id: 2,
      title: 'Hackathon Preparation',
      date: 'March 22, 2024',
      type: 'Workshop',
      status: 'Pending'
    }
  ];

  const recentProjects = [
    {
      id: 1,
      name: 'Personal Portfolio',
      progress: 80,
      lastUpdated: '2 days ago'
    },
    {
      id: 2,
      name: 'E-commerce Website',
      progress: 45,
      lastUpdated: '1 week ago'
    }
  ];

  const latestAnnouncements = [
    {
      id: 1,
      title: 'Hackathon Registration Open',
      description: 'Join our annual hackathon and showcase your coding skills!',
      date: 'March 10, 2024',
      type: 'Event',
      image: 'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?q=80&w=500&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'New Workshop Series',
      description: 'Learn advanced web development techniques in our new workshop series.',
      date: 'March 8, 2024',
      type: 'Workshop',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=500&auto=format&fit=crop'
    },
    {
      id: 3,
      title: 'Club Meeting Schedule',
      description: 'Updated meeting schedule for the upcoming month.',
      date: 'March 5, 2024',
      type: 'General',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=500&auto=format&fit=crop'
    }
  ];

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [upcomingWorkshops, setUpcomingWorkshops] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingEventsAndWorkshops = async () => {
      try {
        setEventsLoading(true);
        
        // Fetch both events and workshops
        const [allEvents, allWorkshops] = await Promise.all([
          getAllEvents(),
          getAllWorkshops()
        ]);
        
        // Filter for upcoming events (events with dates >= today)
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalize to start of day for comparison

        const filteredEvents = allEvents.filter(event => {
          const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
          eventDate.setHours(0, 0, 0, 0); // Normalize event date to start of day
          return eventDate >= now;
        }).sort((a, b) => {
          const dateA = a.date instanceof Date ? a.date : new Date(a.date);
          const dateB = b.date instanceof Date ? b.date : new Date(b.date);
          return dateA - dateB;
        }); // Sort by date

        // Filter for upcoming workshops (workshops with start dates >= today or no end date)
        const filteredWorkshops = allWorkshops.filter(workshop => {
          if (!workshop.startDate) return false; // Skip workshops without start date
          const startDate = workshop.startDate instanceof Date ? workshop.startDate : new Date(workshop.startDate);
          startDate.setHours(0, 0, 0, 0);
          
          // If workshop has end date, check if it's not ended yet
          if (workshop.endDate) {
            const endDate = workshop.endDate instanceof Date ? workshop.endDate : new Date(workshop.endDate);
            endDate.setHours(0, 0, 0, 0);
            return startDate >= now && endDate >= now;
          }
          
          // If no end date, just check if start date is in the future
          return startDate >= now;
        }).sort((a, b) => {
          const dateA = a.startDate instanceof Date ? a.startDate : new Date(a.startDate);
          const dateB = b.startDate instanceof Date ? b.startDate : new Date(b.startDate);
          return dateA - dateB;
        }); // Sort by start date

        setUpcomingEvents(filteredEvents);
        setUpcomingWorkshops(filteredWorkshops);
      } catch (error) {
        console.error('Error fetching upcoming events and workshops:', error);
        setUpcomingEvents([]);
        setUpcomingWorkshops([]);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchUpcomingEventsAndWorkshops();
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          router.push('/Login');
          return;
        }

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          router.push('/setup');
          return;
        }

        const userData = userSnap.data();

        // If role is not student, redirect to appropriate dashboard
        if (['teacher', 'mentor', 'admin'].includes(userData.role)) {
          router.push('/adm-dashboard');
          return;
        } else if (userData.role !== 'student') {
          router.push('/setup');
          return;
        }

        // If we get here, user is authorized
        setShowLoading(false);

      } catch (error) {
        console.error('Error checking user access:', error);
        router.push('/login');
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userDataObj && JSON.stringify(userDataObj) !== JSON.stringify(data)) {
      setData(userDataObj);
    }
  }, [userDataObj]);
  
  // Handle redirect after loading is complete
  useEffect(() => {
    if (!showLoading && !currentUser) {
      router.push('/Login'); // Use router.push for client-side navigation
    }
  }, [showLoading, currentUser, router]);

  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  console.log('Current user in dashboard:', currentUser);

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <BackgroundBeamsWithCollision className="min-h-screen">
          <div className="container">
            <div className="w-full relative z-10">
              <h1 className="mb-6 text-4xl md:text-5xl lg:text-6xl">
                Welcome to <span className="text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-[#387d8a] to-[#2c5f6a] bg-clip-text text-transparent">UIT Coder Club</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Empowering students through code, collaboration, and innovation
              </p>
              <button className="btn btn-primary">
                Check Events
              </button>
            </div>
          </div>
        </BackgroundBeamsWithCollision>
      </section>

      {/* Latest Announcements Section */}
      <section className="section bg-white py-5 my-24">
        <div className="container px-2 sm:px-4 md:px-0">
          <div className="relative">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#387d8a]/5 to-transparent rounded-3xl"></div>
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-[#387d8a]/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#387d8a]/10 rounded-full blur-2xl"></div>

            {/* Content */}
            <div className="relative">
              <div className="text-center py-16 sm:py-12 mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
                  Latest Announcements
                </h2>
                <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                  Stay updated with our latest news and events
                </p>
              </div>

              <div className="px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {latestAnnouncements.map((announcement) => (
                  <CardContainer key={announcement.id} className="w-full" containerClassName="py-0">
                    <CardBody className="w-full h-auto md:h-[240px] overflow-hidden rounded-2xl border-2 border-[#333333] drop-shadow-[8px_8px_0px_#387d8a] flex flex-col bg-white">
                      {/* Window Frame Header */}
                      <CardItem translateZ="20" className="flex flex-row p-1.5 bg-gray-100 border-b-2 border-[#333333]">
                        <div className="rounded-full w-2.5 h-2.5 mx-1 bg-[#ff605c]"></div>
                        <div className="rounded-full w-2.5 h-2.5 mx-1 bg-[#ffbd44]"></div>
                        <div className="rounded-full w-2.5 h-2.5 mx-1 bg-[#00ca4e]"></div>
                      </CardItem>

                      {/* Card Content */}
                      <div className="bg-white flex-1 flex flex-col sm:flex-row">
                        {/* Image */}
                        <CardItem translateZ="50" className="relative w-full sm:w-2/5 h-32 sm:h-auto">
                          <div className="absolute inset-0 bg-gradient-to-br from-[#387d8a]/20 to-transparent"></div>
                          <img
                            src={announcement.image}
                            alt={announcement.title}
                            className="w-full h-full object-cover"
                          />
                          {/* Type Badge */}
                          <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/90 text-[#387d8a]">
                              {announcement.type}
                            </span>
                          </div>
                        </CardItem>

                        {/* Content */}
                        <div className="w-2/5 sm:w-3/5 p-3 flex flex-col">
                          {/* Title and Date */}
                          <CardItem translateZ="60" className="text-sm sm:text-base font-bold text-gray-900 mb-0.5 line-clamp-1">
                            {announcement.title}
                          </CardItem>
                          <CardItem translateZ="40" className="text-xs text-gray-500 mb-1">
                            {announcement.date}
                          </CardItem>

                          {/* Description */}
                          <CardItem translateZ="30" className="text-xs text-gray-600 mb-2 line-clamp-2 flex-1">
                            {announcement.description}
                          </CardItem>

                          {/* Read More Button */}
                          <CardItem translateZ="80" as="button" className="inline-flex items-center text-[#387d8a] hover:text-[#2c5f6a] font-medium transition-colors duration-200 mt-auto text-xs">
                            Read More
                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </CardItem>
                        </div>
                      </div>
                    </CardBody>
                  </CardContainer>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Hero Section */}
      <section className="section bg-gradient-to-br from-[#f8faf8] to-[#e8f0f0] py-6">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 lg:gap-24 items-center">
            {/* Left side - Illustration */}
            <div className="relative flex justify-center items-center h-full mb-8 md:mb-0">
              <img
                src="/event-side-img.png" 
                alt="Events Illustration"
                className="max-w-[80vw] sm:max-w-xs md:max-w-full h-auto object-contain"
              />
            </div>
            
            {/* Right side - Content */}
            <div className="relative px-2 md:pl-8 lg:pl-24 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-[#6a809b] mb-2 mt-6">
                Wondering
              </h2>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-[#387d8a] mb-4 md:mb-6 leading-tight">
                What's up?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 md:mb-8 font-medium">
                There's always something <span className="text-[#387d8a]">new</span> to look forward to. Keep an eye out for the latest Computing Club <span className="text-[#387d8a]">events and workshops</span>!
              </p>
              <a href="/events" className="inline-flex items-center px-4 py-2 mb-4 sm:px-6 sm:py-3 rounded-lg bg-[#387d8a] text-white font-medium hover:bg-[#2c5f6a] transition-colors duration-200">
                View Events
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="section bg-white py-2 my-24">
        <div className="container">
          <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-12">Upcoming Events & Workshops</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {eventsLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#387d8a] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading upcoming events and workshops...</p>
              </div>
            ) : (upcomingEvents.length > 0 || upcomingWorkshops.length > 0) ? (
              // Combine events and workshops, add type identifier, and sort by date
              [...upcomingEvents.map(event => ({ ...event, type: 'event' })), 
               ...upcomingWorkshops.map(workshop => ({ ...workshop, type: 'workshop' }))]
                .sort((a, b) => {
                  const dateA = a.type === 'event' ? 
                    (a.date instanceof Date ? a.date : new Date(a.date)) :
                    (a.startDate instanceof Date ? a.startDate : new Date(a.startDate));
                  const dateB = b.type === 'event' ? 
                    (b.date instanceof Date ? b.date : new Date(b.date)) :
                    (b.startDate instanceof Date ? b.startDate : new Date(b.startDate));
                  return dateA - dateB;
                })
                .slice(0, 4) // Show up to 4 items (2 rows of 2)
                .map(item => {
                  const isEvent = item.type === 'event';
                  const itemDate = isEvent ? 
                    (item.date instanceof Date ? item.date : new Date(item.date)) :
                    (item.startDate instanceof Date ? item.startDate : new Date(item.startDate));
                  
                  const formattedDate = itemDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  
                  return (
                    <div key={`${item.type}-${item.id}`} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 group">
                      {/* Event/Workshop Image */}
                      {item.imageUrl ? (
                        <div className="relative h-48 w-full overflow-hidden">
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority={false}
                            onError={(e) => {
                              // Hide the image container on error
                              e.target.parentElement.style.display = 'none';
                            }}
                          />
                          {/* Gradient overlay for better text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                          {/* Date badge */}
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm">
                            <div className="text-[#387d8a] text-xs font-semibold">
                              {formattedDate}
                            </div>
                          </div>
                          {/* Type badge */}
                          <div className="absolute top-3 right-3 bg-[#387d8a]/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm">
                            <div className="text-white text-xs font-semibold">
                              {isEvent ? 'Event' : 'Workshop'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative h-48 w-full bg-gradient-to-br from-[#387d8a]/10 to-[#2c5f6a]/10 flex items-center justify-center group-hover:from-[#387d8a]/15 group-hover:to-[#2c5f6a]/15 transition-all duration-300">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-[#387d8a]/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                              <svg className="w-8 h-8 text-[#387d8a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-[#387d8a] text-sm font-medium">{isEvent ? 'Event' : 'Workshop'} Image</p>
                            <p className="text-[#387d8a]/70 text-xs mt-1">No image available</p>
                          </div>
                          {/* Date badge for no-image case */}
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm">
                            <div className="text-[#387d8a] text-xs font-semibold">
                              {formattedDate}
                            </div>
                          </div>
                          {/* Type badge for no-image case */}
                          <div className="absolute top-3 right-3 bg-[#387d8a]/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm">
                            <div className="text-white text-xs font-semibold">
                              {isEvent ? 'Event' : 'Workshop'}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Event/Workshop Content */}
                      <div className="p-6">
                        {/* Time and location info */}
                        <div className="flex items-center gap-3 text-[#387d8a] text-sm mb-3">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {isEvent ? (item.time || 'TBD') : (item.schedule || 'TBD')}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {isEvent ? (item.location || 'Location TBD') : (item.location || 'Location TBD')}
                          </span>
                        </div>
                        
                        {/* Title */}
                        <h3 className="text-xl font-bold mb-3 text-gray-900 line-clamp-2 group-hover:text-[#387d8a] transition-colors duration-200">
                          {item.title}
                        </h3>
                        
                        {/* Description */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {isEvent ? 
                            (item.shortDescription || item.description || 'No description available') :
                            (item.description || 'No description available')
                          }
                        </p>
                        
                        {/* Action button */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>Max: {isEvent ? (item.maxParticipants || 'Unlimited') : (item.maxStudents || 'Unlimited')} participants</span>
                          </div>
                          <a 
                            href={isEvent ? "/events" : "/resources"} 
                            className="inline-flex items-center px-4 py-2 bg-[#387d8a] text-white text-sm font-medium rounded-lg hover:bg-[#2c5f6a] transition-all duration-200 group-hover:shadow-md"
                          >
                            Learn More
                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-center text-base text-gray-500 col-span-full">No upcoming events or workshops at the moment. Check back soon!</p>
            )}
          </div>
        </div>
      </section>

      {/* Study Plans Section */}
      <section className="section bg-gradient-to-br from-[#e8f0f0] to-[#f8faf8] py-2 my-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:gap-16 lg:gap-24 items-center">
            {/* Left side - Content */}
            <div className="relative md:pr-8 lg:pr-24 py-32">
              <h2 className="text-3xl md:text-4xl font-medium text-[#6a809b] mb-2"> Stressed about </h2>
              <h2 className="text-6xl md:text-7xl font-black text-[#387d8a] mb-6 leading-tight"> Study plans? </h2>
              <p className="text-xl text-gray-600 mb-8 font-medium">
                Set yourself up for <span className="text-[#387d8a]">academic success</span> with our <span className="text-[#387d8a]">study planner</span>!
              </p>
              <a href="/resources" className="inline-flex items-center px-6 py-3 rounded-lg bg-[#387d8a] text-white font-medium hover:bg-[#2c5f6a] transition-colors duration-200">
                Resources
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
            
            {/* Right side - Illustration */}
            <div className="relative flex justify-center items-center h-full">
              <img src="/planner.png" alt="Study Planner Illustration" width={550} height={550} className="max-w-full h-auto object-contain"/>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-gray-50 py-12 my-24">
        <div className="container">
          <h2 className="text-center mb-16 my-12">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#387d8a]/10 to-[#2c5f6a]/10 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:from-[#387d8a] group-hover:to-[#2c5f6a]">
                <FaGraduationCap className="text-[#387d8a] text-4xl transition-colors duration-300 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-[#387d8a] transition-colors duration-300">Learn & Grow</h3>
              <p className="text-lg text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                Access to workshops, tutorials, and mentorship programs to enhance your coding skills.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#387d8a]/10 to-[#2c5f6a]/10 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:from-[#387d8a] group-hover:to-[#2c5f6a]">
                <FaCode className="text-[#387d8a] text-4xl transition-colors duration-300 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-[#387d8a] transition-colors duration-300">Build Projects</h3>
              <p className="text-lg text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                Work on real-world projects and build your portfolio with hands-on experience.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#387d8a]/10 to-[#2c5f6a]/10 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:from-[#387d8a] group-hover:to-[#2c5f6a]">
                <FaUsers className="text-[#387d8a] text-4xl transition-colors duration-300 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-[#387d8a] transition-colors duration-300">Network</h3>
              <p className="text-lg text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                Connect with like-minded developers and industry professionals.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}