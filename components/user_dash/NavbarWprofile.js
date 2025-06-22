"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import Logo from './Logo';
import { ArrowUpRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';

const navigationItems = [
  { name: 'Home', href: '/user-dashboard' },
  { name: 'About', href: '/about' },
  { name: 'Events', href: '/events' },
  { name: 'Resources', href: '/resources' },
  { name: 'Contact', href: '/contact' },
];

const navVariants = {
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
  hidden: { y: -100, opacity: 0, transition: { duration: 0.3 } },
};

export default function NavbarWprofile() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [prevScrollY, setPrevScrollY] = useState(0);
  const { logout, currentUser } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only lock scroll when mobile menu is open and screen is small
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = prevScrollY;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else if (latest < previous) {
      setHidden(false);
    }
    setPrevScrollY(latest);
  });

  if (!mounted) {
    return null;
  }

  return (
    <motion.nav
      className="fixed w-full top-0 left-0 z-50 bg-white shadow-sm"
      variants={navVariants}
      animate={hidden ? "hidden" : "visible"}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo on the left */}
          <Logo className="my-0" />

          {/* Desktop Navigation on the right */}
          <div className="hidden md:flex items-center space-x-3 sm:space-x-3.5 md:space-x-4">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-600 hover:text-[#387d8a] px-3 py-2 text-base font-medium transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 focus:outline-none ml-2">
                  <svg
                    className="w-6 h-6 text-gray-600 hover:text-[#387d8a]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    Account Settings <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#387d8a]"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div
        className={`fixed inset-0 z-50 bg-black/10 bg-opacity-50 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } md:hidden`}
        onClick={() => setIsOpen(false)}
      >
        <div
          className={`fixed top-0 right-0 w-64 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-end p-4">
            <button
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#387d8a]"
            >
              <span className="sr-only">Close main menu</span>
              <svg
                className="block h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#387d8a] hover:bg-gray-50 transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
            {/* Account Settings and Log out as direct items in mobile menu */}
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 block px-3 py-2 mt-2 rounded-md text-base font-medium text-gray-700 hover:text-[#387d8a] hover:bg-gray-50 transition-colors duration-200"
            >
              Account Settings <ArrowUpRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => { setIsOpen(false); logout(); }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50 transition-colors duration-200 mt-1"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
