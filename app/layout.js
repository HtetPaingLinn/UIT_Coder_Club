import { AuthProvider } from '@/context/AuthContext';
import GlobalLayout from '@/components/GlobalLayout';
import { DM_Sans, Lexend } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
});

const bodyClassName = "font-lexend antialiased text-slate-800 bg-white w-full text-sm sm:text-base min-h-screen flex flex-col justify-center";

export const metadata = {
  title: "UIT Coding Club",
  icons: {
    icon: '/logo2.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${lexend.variable}`}>
      <body className={bodyClassName} suppressHydrationWarning={true}>
        <AuthProvider>
          <GlobalLayout>
            {children}
          </GlobalLayout>
        </AuthProvider>
      </body>
    </html>
  );
}