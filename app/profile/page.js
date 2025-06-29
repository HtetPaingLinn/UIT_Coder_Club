'use client';
import ProfileScreen from '@/components/card/ProfileScreen'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'

export default function Page() {
  const { userDataObj, loading } = useAuth()
  const router = useRouter()
  const [showLoading, setShowLoading] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!userDataObj) {
        // User is not authenticated, redirect to login
        router.push('/Login')
        return
      }
      // User is authenticated, show the profile page
      setShowLoading(false)
    }
  }, [userDataObj, loading, router])

  // Show loading while checking authentication
  if (loading || showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  // Only render ProfileScreen if user is authenticated
  if (!userDataObj) {
    return null // This should not be reached due to redirect, but just in case
  }

  return (
    <ProfileScreen />
  )
}
