'use client'
import Hero from '@/components/Hero'
import Main from '@/components/Main'
import React from 'react'
import { useState, useEffect } from 'react';
import { FaGraduationCap, FaCode, FaUsers } from 'react-icons/fa';
import { CardBody, CardItem, CardContainer } from '@/components/ui/3d-card';
import { Calendar, Plus, Database } from 'lucide-react';

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


export default function page() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  return (
    <>
    {/* Hero Section */}
      <section className="hero-section">
        <Hero />
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
                There's always something <span className="text-[#387d8a]">new</span> to look forward to. Keep an eye out for the latest Computing Club <span className="text-[#387d8a]">events</span>!
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
