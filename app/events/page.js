"use client";
import React, { useState, useEffect } from 'react';
import { getAllEvents, getEventsByDate, createSampleEvents, registerForEvent, isUserRegisteredForEvent, getUserRegisteredEvents } from '@/firebase/utils';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Database, CheckCircle, Clock, MapPin } from 'lucide-react';
import Image from 'next/image';

export default function Events() {
  // State to manage the selected date and events for that date
  const [selectedDate, setSelectedDate] = React.useState(new Date(2025, 5, 19));
  const [eventsForSelectedDate, setEventsForSelectedDate] = React.useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [registrationConfirm, setRegistrationConfirm] = useState({});
  const [userRegistrations, setUserRegistrations] = useState({});
  const [registrationLoading, setRegistrationLoading] = useState({});
  const [userRegisteredEvents, setUserRegisteredEvents] = useState([]);
  const [registeredEventsLoading, setRegisteredEventsLoading] = useState(false);

  // Get current user from auth context
  const { currentUser } = useAuth();

  // Load events from Firebase on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const events = await getAllEvents();
        console.log('All events loaded:', events); // Debug log
        console.log('Event dates:', events.map(e => ({
          title: e.title,
          date: e.date,
          dateType: typeof e.date,
          dateString: e.date instanceof Date ? e.date.toDateString() : new Date(e.date).toDateString()
        }))); // Debug log
        setAllEvents(events);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Function to get events for a specific date
  useEffect(() => {
    const fetchEventsForDate = async () => {
      try {
        const eventsOnDate = await getEventsByDate(selectedDate);
        console.log('Events for date:', selectedDate.toDateString(), eventsOnDate); // Debug log
        
        // Fallback: if no events found via Firestore query, try filtering locally
        if (eventsOnDate.length === 0 && allEvents.length > 0) {
          console.log('No events found via Firestore query, trying local filter...');
          const selectedDateString = selectedDate.toDateString();
          const localEvents = allEvents.filter(event => {
            const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
            const eventDateString = eventDate.toDateString();
            console.log('Comparing:', eventDateString, 'with', selectedDateString);
            return eventDateString === selectedDateString;
          });
          console.log('Local filter found:', localEvents);
          setEventsForSelectedDate(localEvents);
        } else {
          setEventsForSelectedDate(eventsOnDate);
        }
      } catch (err) {
        console.error('Error fetching events for date:', err);
        setEventsForSelectedDate([]);
      }
    };

    if (allEvents.length > 0) {
      fetchEventsForDate();
    }
  }, [selectedDate, allEvents]);

  // Check user registrations for all events
  useEffect(() => {
    const checkUserRegistrations = async () => {
      if (!currentUser || allEvents.length === 0) return;
      
      try {
        const registrations = {};
        for (const event of allEvents) {
          const isRegistered = await isUserRegisteredForEvent(currentUser.uid, event.id);
          registrations[event.id] = isRegistered;
        }
        setUserRegistrations(registrations);
      } catch (error) {
        console.error('Error checking user registrations:', error);
      }
    };

    checkUserRegistrations();
  }, [currentUser, allEvents]);

  // Load user's registered events
  useEffect(() => {
    const fetchUserRegisteredEvents = async () => {
      if (!currentUser) {
        setUserRegisteredEvents([]);
        return;
      }

      try {
        setRegisteredEventsLoading(true);
        const registeredEvents = await getUserRegisteredEvents(currentUser.uid);
        console.log('User registered events:', registeredEvents);
        setUserRegisteredEvents(registeredEvents);
      } catch (error) {
        console.error('Error fetching user registered events:', error);
        setUserRegisteredEvents([]);
      } finally {
        setRegisteredEventsLoading(false);
      }
    };

    fetchUserRegisteredEvents();
  }, [currentUser]);

  const handleRegisterClick = (eventId) => {
    if (!currentUser) {
      alert('Please log in to register for events.');
      return;
    }
    setRegistrationConfirm(prev => ({
      ...prev,
      [eventId]: true
    }));
  };

  const handleConfirmRegistration = async (event) => {
    if (!currentUser) {
      alert('Please log in to register for events.');
      return;
    }

    setRegistrationLoading(prev => ({
      ...prev,
      [event.id]: true
    }));

    try {
      // Register for the event
      const registrationResult = await registerForEvent(currentUser.uid, event.id, event);
      
      if (registrationResult.success) {
        // Show success message
        alert(`✅ Successfully registered for "${event.title}"!`);
        
        // Update local state
        setUserRegistrations(prev => ({
          ...prev,
          [event.id]: true
        }));
        
        // Refresh events to update participant count
        const events = await getAllEvents();
        setAllEvents(events);
        
        // Refresh user's registered events
        const registeredEvents = await getUserRegisteredEvents(currentUser.uid);
        setUserRegisteredEvents(registeredEvents);
      } else {
        alert(`❌ Registration failed: ${registrationResult.message}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('❌ Registration failed. Please try again.');
    } finally {
      setRegistrationLoading(prev => ({
        ...prev,
        [event.id]: false
      }));
      setRegistrationConfirm(prev => ({
        ...prev,
        [event.id]: false
      }));
    }
  };

  const handleCancelRegistration = (eventId) => {
    setRegistrationConfirm(prev => ({
      ...prev,
      [eventId]: false
    }));
  };

  // Calendar logic (simplified for now)
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null); // Empty slots for days before the 1st
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const eventDates = allEvents.map(event => {
    // Handle both string dates and Firestore Timestamp objects
    const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
    // Normalize the date to start of day for consistent comparison
    const normalizedDate = new Date(eventDate);
    normalizedDate.setHours(0, 0, 0, 0);
    return normalizedDate.toDateString();
  });

  const openForm = () => {
    setShowForm(true);
  };

  const handleCreateSampleEvents = async () => {
    try {
      console.log('Creating sample events...');
      const success = await createSampleEvents();
      if (success) {
        console.log('Sample events created successfully');
        // Refresh the events list
        const events = await getAllEvents();
        setAllEvents(events);
      } else {
        console.error('Failed to create sample events');
      }
    } catch (error) {
      console.error('Error creating sample events:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#387d8a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-[#387d8a] text-white rounded-lg hover:bg-[#2c5f6a] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="mb-6">Events</h1>
            <p className="text-xl text-gray-600">
              Join our exciting events and workshops
            </p>
          </div>
        </div>
      </section>

      {/* User's Registered Events Section */}
      {currentUser && (
        <section className="section bg-gray-50 py-12">
          <div className="container">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                My Registered Events
              </h2>
              <p className="text-gray-600">
                Events you've signed up for
              </p>
            </div>

            {registeredEventsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#387d8a] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your events...</p>
              </div>
            ) : userRegisteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userRegisteredEvents.map(event => {
                  const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
                  const formattedDate = eventDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  });
                  const isUpcoming = eventDate > new Date();
                  
                  return (
                    <div key={event.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-[#387d8a] mb-2 line-clamp-2">
                            {event.title}
                          </h3>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{formattedDate}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            isUpcoming 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {isUpcoming ? 'Upcoming' : 'Past'}
                          </span>
                        </div>
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                          {event.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>👥 {event.currentParticipants || 0}/{event.maxParticipants || '∞'} participants</span>
                        <span className="capitalize">{event.type || event.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-[#387d8a]/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-[#387d8a]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Events Registered Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  You haven't registered for any events yet. Browse the calendar below to find exciting events to join!
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Events Calendar and List Section */}
      {currentUser ? (
        <>
          <section className="section bg-white py-12">
            <div className="container">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
                  Events
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mx-auto">
                {/* Calendar Column */}
                <div className="p-6 rounded-lg shadow-md bg-white border border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                    <button onClick={() => navigateMonth(-1)} className="text-gray-600 hover:text-[#387d8a]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-lg font-normal text-gray-900">
                      {monthNames[currentMonth]} {currentYear}
                    </h3>
                    <button onClick={() => navigateMonth(1)} className="text-gray-600 hover:text-[#387d8a]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-7 text-center text-sm font-light text-gray-500 mb-4">
                    {daysOfWeek.map((day, index) => <div key={index}>{day}</div>)}
                  </div>

                  <div className="grid grid-cols-7 text-center text-base font-normal">
                    {calendarDays.map((day, index) => (
                      <div
                        key={index}
                        className={`
                          relative cursor-pointer rounded-full
                          ${day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear()
                            ? 'bg-[#EF4444] text-white'
                            : ''}
                          ${day ? 'hover:bg-gray-100' : 'text-gray-300'}
                          p-1 sm:p-2 md:p-3
                          min-w-[2rem] min-h-[2rem] sm:min-w-[2.5rem] sm:min-h-[2.5rem]
                          flex items-center justify-center mx-auto
                        `}
                        onClick={() => day && setSelectedDate(new Date(currentYear, currentMonth, day))}
                        style={{ aspectRatio: '1 / 1' }}
                      >
                        {day}
                        {day && eventDates.includes(new Date(currentYear, currentMonth, day).toDateString()) && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#387d8a] rounded-full"></span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Events List Column */}
                <div className="p-6 rounded-lg shadow-md bg-white border border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Events for {selectedDate.toDateString()}
                  </h3>
                  <div className="space-y-4">
                    {eventsForSelectedDate.length > 0 ? (
                      eventsForSelectedDate.map(event => {
                        // Handle Firestore Timestamp objects
                        const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
                        const formattedDate = eventDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                        
                        return (
                          <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex gap-4">
                              {/* Event Image */}
                              {event.imageUrl ? (
                                <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                                  <Image
                                    src={event.imageUrl}
                                    alt={event.title}
                                    fill
                                    className="object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="relative w-24 h-24 flex-shrink-0 rounded-lg bg-gradient-to-br from-[#387d8a]/10 to-[#2c5f6a]/10 flex items-center justify-center">
                                  <svg className="w-8 h-8 text-[#387d8a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="text-xl font-bold text-[#387d8a] mb-1 line-clamp-1">{event.title}</h4>
                                    <p className="text-sm text-gray-600 mb-2">
                                      📅 {formattedDate} | ⏰ {event.time} | 📍 {event.location}
                                    </p>
                                    <span className="inline-block mb-2 px-2 py-1 text-xs font-medium bg-[#387d8a]/10 text-[#387d8a] rounded-full">
                                      {event.category}
                                    </span>
                                    <p className="text-sm text-gray-500 mb-2">
                                      👥 {event.currentParticipants || 0}/{event.maxParticipants || '∞'} participants
                                    </p>
                                    {event.description && (
                                      <p className="text-base text-gray-700 whitespace-pre-wrap line-clamp-2">{event.description}</p>
                                    )}
                                  </div>
                                  <div className="ml-4 flex-shrink-0">
                                    {userRegistrations[event.id] ? (
                                      <span className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold shadow-md text-sm">
                                        Registered ✓
                                      </span>
                                    ) : !registrationConfirm[event.id] ? (
                                      <button
                                        onClick={() => handleRegisterClick(event.id)}
                                        disabled={registrationLoading[event.id]}
                                        className="px-6 py-2.5 bg-[#387d8a] text-white rounded-lg font-semibold hover:bg-[#2c5f6a] transition-colors shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {registrationLoading[event.id] ? 'Processing...' : 'Register'}
                                      </button>
                                    ) : (
                                      <div className="flex flex-col space-y-2">
                                        <button
                                          onClick={() => handleConfirmRegistration(event)}
                                          disabled={registrationLoading[event.id]}
                                          className="px-6 py-2.5 bg-[#047d8a] hover:bg-[#036570] text-white rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {registrationLoading[event.id] ? 'Processing...' : 'Confirm'}
                                        </button>
                                        <button
                                          onClick={() => handleCancelRegistration(event.id)}
                                          disabled={registrationLoading[event.id]}
                                          className="px-6 py-2.5 bg-slate-300 text-white rounded text-xs font-medium hover:bg-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-lg text-gray-500">No events for this date.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="section bg-white py-16">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-8">
                <Calendar className="h-16 w-16 text-[#387d8a] mx-auto mb-6" />
                <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
                  Join Our Exciting Events
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Discover workshops, coding sessions, and networking opportunities. 
                  Connect with fellow developers and enhance your skills!
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <div className="bg-[#387d8a]/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-[#387d8a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Learn & Grow</h3>
                  <p className="text-gray-600">Access workshops and coding sessions to enhance your technical skills</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-[#387d8a]/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-[#387d8a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Network</h3>
                  <p className="text-gray-600">Connect with fellow developers and industry professionals</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-[#387d8a]/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-[#387d8a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Stay Updated</h3>
                  <p className="text-gray-600">Get notified about upcoming events and opportunities</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => window.location.href = '/Login'}
                  className="inline-flex items-center px-8 py-4 bg-[#387d8a] text-white font-semibold rounded-lg hover:bg-[#2c5f6a] transition-colors shadow-lg text-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Join Now
                </button>
                <p className="text-sm text-gray-500">
                  Already have an account? 
                  <a href="/Login" className="text-[#387d8a] hover:underline ml-1">
                    Sign in here
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
} 