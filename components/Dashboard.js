'use client';
import React, { useState, useEffect } from 'react'
import Loading from './Loading';
import { Montserrat } from 'next/font/google';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const monstserrat = Montserrat({ subsets: ['latin'], weight: ['500'] });

export default function Dashboard() {
  const { currentUser, userDataObj, loading } = useAuth();
  const [data, setData] = useState(null);
  const [showLoading, setShowLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
      if (!loading) {
        // Introduce a delay to ensure smooth loading transition
        const timer = setTimeout(() => setShowLoading(false), 300); // Adjust time as needed
        return () => clearTimeout(timer);
      } else {
        setShowLoading(true);
      }
    }, [loading]);
  
    useEffect(() => {
      if (userDataObj && JSON.stringify(userDataObj) !== JSON.stringify(data)) {
        setData(userDataObj);
      }
    }, [userDataObj]);
    
    // Handle redirect after loading is complete
    useEffect(() => {
        if (!showLoading && !currentUser) {
        router.push('/Login'); 
        }
    }, [showLoading, currentUser, router]);

    if (showLoading) {
      return <Loading />;
    }
  
    console.log('Current user in dashboard:', currentUser);

  return (
    <div className="flex flex-col text-3xl flex-1 gap-4 sm:gap-6 md:gap-8 max-w-[1350px] mx-10 sm:mx-auto md:mx-auto">
      This is main dashboard
    </div>
  )
}
