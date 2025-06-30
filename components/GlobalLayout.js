'use client';

import { usePathname } from 'next/navigation';
import Navbar from "@/components/user_dash/Navbar";
import Footer from "@/components/user_dash/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import Image from "next/image";
import { Montserrat } from 'next/font/google'
import NavbarWprofile from "@/components/user_dash/NavbarWprofile.js";
const montserrat = Montserrat({ subsets: ["latin"], weight: ['500']})

export default function GlobalLayout({ children }) {
  const pathname = usePathname();
  
  // Check if it's the admin dashboard route
  if (pathname?.startsWith('/adm-dashboard')) {
    return <>{children}</>;
  }

  if (pathname?.startsWith('/card-preview')) {
    return <>{children}</>;
  }

  if (pathname?.startsWith('/profile')) {
    return <div className='bg-amber-50 h-screen w-full'>{children}</div>;
  }

  // If the route is exactly '/' (home), use Navbar
  if (pathname === '/') {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-20">
          {children}
        </main>
        <Footer />
      </>
    );
  }

  // For all other user-facing pages, use NavbarWprofile
  return (
    <>
      <NavbarWprofile />
      <main className="min-h-screen pt-20">
        {children}
      </main>
      <Footer />
    </>
  );
} 