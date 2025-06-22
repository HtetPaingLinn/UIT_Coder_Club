'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'; // Import motion and hooks
import Logo from './Logo';
import { useAuth } from '@/context/AuthContext'; // Import useAuth hook

const navigationItems = [
  { name: 'About', href: '/about' },
  { name: 'Events', href: '/events' },
  { name: 'Resources', href: '/resources' },
  { name: 'Contact', href: '/contact' },
];

// Define animation variants for the navbar
const navVariants = {
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
  hidden: { y: -100, opacity: 0, transition: { duration: 0.3 } },
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll(); // Get scroll Y position
  const [hidden, setHidden] = useState(false);
  const { currentUser } = useAuth(); // Get current user from auth context
  
  const [prevScrollY, setPrevScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Hook to handle scroll events for hiding/showing the navbar
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = prevScrollY; // Use the state to get the previous scroll value

    // Hide navbar if scrolling down past 150px (adjust as needed)
    if (latest > previous && latest > 150) {
      setHidden(true);
    }
    // Show navbar if scrolling up
    else if (latest < previous) {
      setHidden(false);
    }
    setPrevScrollY(latest); // Update previous scroll Y
  });

  if (!mounted) {
    return null;
  }

  return (
    <motion.nav
      className="fixed w-full top-0 left-0 z-50 bg-white shadow-sm" // Add fixed positioning
      variants={navVariants}
      animate={hidden ? "hidden" : "visible"} // Animate based on 'hidden' state
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo on the left */}
          <Logo className="my-0" />

          {/* Desktop Navigation on the right */}
          <div className="hidden md:flex items-center space-x-3 sm:space-x-3.5 md:space-x-4">
            {/* Conditional Home link */}
            <Link
              href={currentUser ? '/user-dashboard' : '/'}
              className="text-gray-600 hover:text-[#387d8a] px-3 py-2 text-base font-medium transition-colors duration-200"
            >
              Home
            </Link>
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-600 hover:text-[#387d8a] px-3 py-2 text-base font-medium transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
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
        onClick={() => setIsOpen(false)} // Close when clicking overlay
      >
        <div
          className={`fixed top-0 right-0 w-64 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the menu
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
            {/* Conditional Home link for mobile */}
            <Link
              href={currentUser ? '/user-dashboard' : '/'}
              onClick={() => setIsOpen(false)} // Close menu on navigation
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#387d8a] hover:bg-gray-50 transition-colors duration-200"
            >
              Home
            </Link>
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)} // Close menu on navigation
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#387d8a] hover:bg-gray-50 transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}