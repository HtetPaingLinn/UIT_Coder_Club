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

  // If the route is exactly '/user-dashboard', use NavbarWprofile
  if (pathname === '/user-dashboard') {
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

  const specialRoutes = [
    '/user-dashboard',
    '/contact',
    '/resources',
    '/event',
    '/about',
    '/'
  ];
  const isSpecialPage = specialRoutes.some((route) => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(route);
  });

  if (isSpecialPage) {
    // Special layout
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

  // Default layout
  return (
    <>
      <header className={`${montserrat.className} flex items-center justify-between gap-4 p-4 sm:p-8`}>
        <div className="flex items-center gap-3">
          <div>
            <Image src={'/uit_logo.png'} width={70} height={70} alt={'uit_logo'} />
          </div>
          <div>
            <h1 className="mt-1 text-lg my-auto sm:text-xl md:text-2xl text-gradient-dark-bg-3 leading-none">
              UIT Coding Club
            </h1>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      {children}
      <footer className="p-4 sm:p-8">
        <p className={`text-center mx-auto text-gray-600 dark:text-gray-400`}>Created by HAK Dynamics</p>
      </footer>
    </>
  );
} 