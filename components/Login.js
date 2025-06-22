'use client'

import React, { useState, useEffect } from 'react'
import Button from './Button'
import { Montserrat, Fugaz_One } from 'next/font/google'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

const montserrat = Montserrat({ subsets: ["latin"], weight: ['400'] })
const fugaz = Fugaz_One({ subsets: ["latin"], weight: ['400'] })

export default function Login(props) {

  const { state } = props;
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [authenticating, setAuthenticating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')  
  const router = useRouter()

  useEffect(() => {
    setIsRegister(state);
  }, [state]); 

  const { signup, login } = useAuth()

  async function handleSubmit() {
    setErrorMessage('') // Reset on each submit

    if (!email || !password || password.length < 8) {
      setErrorMessage('Please fill in both fields. Password must be at least 8 characters.')
      return
    }

    setAuthenticating(true)

    try {
      let result
      if (isRegister) {
        console.log("Signing up a new user")
        result = await signup(email, password)
        if (result.success) {
          setIsRegister(false) // Switch to login view after successful registration
        }
      } else {
        console.log('Logging in existing user')
        result = await login(email, password)
        
        // Handle redirect if login was successful
        if (result.success && result.redirectTo) {
          router.push(result.redirectTo)
          return
        }
      }

      if (!result.success) {
        console.log("the message is", result.message)
        setErrorMessage(result.message)
      }
      
    } catch (error) {
      setErrorMessage(error.message || 'Something went wrong.')
    } finally {
      setAuthenticating(false)
    }
  }

  useEffect(() => {
    console.log("errorMessage updated", errorMessage)
  }, [errorMessage])

  return (
    <div className='flex flex-col flex-1 justify-center items-center gap-4 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 '>
      <div className='w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto'>
        <h3 className={`${fugaz.className} font-fugaz text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-center text-gray-900 dark:text-white mb-6 sm:mb-8 md:mb-10 leading-tight`}>
          {isRegister ? 'Register' : 'Login'}
        </h3>

        {/* Error Message Display */}
        {errorMessage && (
          <div className='bg-yellow-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base text-center mb-4 sm:mb-6 w-full'>
            {errorMessage}
          </div>
        )}

        <div className='space-y-4 sm:space-y-5 md:space-y-6'>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full px-3 sm:px-4 py-2 sm:py-3 md:py-4 text-sm sm:text-base rounded-lg border border-teal-500 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors duration-200'
            placeholder='Email'
            type='email'
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full px-3 sm:px-4 py-2 sm:py-3 md:py-4 text-sm sm:text-base rounded-lg border border-teal-500 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors duration-200'
            placeholder='Password'
            type='password'
          />
          
          <div className='w-full'>
            <Button clickHandler={handleSubmit} text={authenticating ? 'Submitting...' : 'Submit'} full dark />
          </div>
        </div>

        <p className='text-center mt-6 sm:mt-8 text-sm sm:text-base text-gray-700 dark:text-gray-300'>
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <button 
            onClick={() => { setIsRegister(!isRegister); setErrorMessage('') }} 
            className='text-[#3d7d7d] hover:text-[#2a5a5a] dark:hover:text-[#4a9a9a] font-medium transition-colors duration-200 underline'
          >
            {isRegister ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}
