"use client"

import CardContainer from '../../components/card/CardContainer';
import React from 'react'
import { useAuth } from '@/context/AuthContext';

// export const metadata = {
//   title: "Coding Club · ID Card",
//   description: "Explore. Dream. Discover",
// };

export default function Page() {
  const { userDataObj, loading } = useAuth();
  if (loading || !userDataObj) return null;
  return (
    <CardContainer userData={userDataObj} />
  );
}
