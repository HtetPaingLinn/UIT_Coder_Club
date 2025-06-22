import { Montserrat } from 'next/font/google'
import React from 'react'
import Button from './Button'
import Link from 'next/link'
import { BackgroundLines } from './ui/background-lines'

const montserrat = Montserrat({ subsets: ["latin"], weight: ['500']})

export default function Hero() {
  return (
    <BackgroundLines className="relative min-h-screen flex items-center justify-center">
      <div className={`${montserrat.className} px-5 w-full mx-auto max-w-[1200px] flex flex-col gap-6 sm:gap-8 relative z-10 text-center`}>
        <h1 className={`${montserrat.className} text-5xl text-center sm:text-6xl md:text-7xl`}> 
        <span className="text-5xl md:text-7xl bg-gradient-to-r from-[#387d8a] to-[#2c5f6a] bg-clip-text text-transparent"> Code, Learn, </span> <span className="text-5xl md:text-7xl "> and </span> <span className="text-5xl md:text-7xl bg-gradient-to-r from-[#387d8a] to-[#2c5f6a] bg-clip-text text-transparent"> Innovate </span> <span className='text-5xl md:text-7xl '> with UIT Coding Club </span>
        </h1>
        <p className='text-md text-center sm:text-xl md:text-2xl'>
          Join our community at the <span className='font-semibold text-md sm:text-xl md:text-2xl'>UIT Coding Club</span> to learn, code, and innovate together!
        </p>
        <div className='grid grid-cols-2 gap-4 mx-auto mt-3 w-fit'>
          <Link href={'/Signup'}>
            <Button text="Sign Up"/>
          </Link>
          <Link href={'/Login'}>
            <Button text="Login" dark/>
          </Link>
        </div>
      </div>
    </BackgroundLines>
  )
}