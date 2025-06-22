import Image from 'next/image';
import Link from 'next/link';
import { Montserrat, Fugaz_One } from 'next/font/google';

const fugaz_one = Fugaz_One({ subsets: ['latin'], weight: ['400'] });

export default function Logo({ className = '' }) {
  return (
    <Link href="/" className={`group relative my-4 sm:my-5 md:my-6 ${className}`}>
      <div className="flex items-center space-x-4">
        {/* Logo Container with Modern Design */}
        <div className="relative">
          {/* Animated Background Shape */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#387d8a]/20 to-transparent rounded-xl transform rotate-3 group-hover:rotate-0 transition-all duration-500"></div>

          {/* Main Logo Container */}
          <div className="relative w-14 h-14 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#387d8a]/5 to-transparent"></div>
            <Image
              src="/logo (1).png"
              alt="UIT Coder Club Logo"
              fill
              className="object-contain transform group-hover:scale-110 transition-transform duration-500"
              priority
            />
          </div>

          {/* Decorative Corner Accents */}
          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#387d8a] rounded-tr-lg opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#387d8a] rounded-bl-lg opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Text Container with Modern Typography */}
        <div className="flex flex-col">
          <div className="relative group">
            <span className={`${fugaz_one.className} text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 group-hover:text-[#387d8a] transition-colors duration-300`}>
              Coder Club
            </span>
            <div className="absolute left-0 w-full h-[2px] bg-[#387d8a]/50 origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </div>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className="hidden lg:inline text-xs sm:text-sm md:text-md font-medium text-gray-500 tracking-wide">
              University of Information Technology
            </span>
            <div className="w-1 h-1 rounded-full bg-[#387d8a]/30 group-hover:bg-[#387d8a] transition-colors duration-300"></div>
          </div>
        </div>
      </div>

      {/* Subtle Background Effects */}
      <div className="absolute -z-10 inset-0 bg-gradient-to-r from-[#387d8a]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </Link>
  );
}