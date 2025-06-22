import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import GlobalLayout from "@/components/GlobalLayout";
import { DM_Sans, Lexend } from 'next/font/google';

const montserrat = Montserrat({ subsets: ["latin"], weight: ['400'] });
const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-dm-sans', });
const lexend = Lexend({ subsets: ['latin'], display: 'swap', variable: '--font-lexend', });

export const metadata = {
  title: "UIT Coding Club",
  icons: {
    icon: '/logo2.png',
    shortcut: '/logo2.png',
    apple: '/logo2.png',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${lexend.variable}`}>
      <body className="font-lexend antialiased text-slate-800 bg-white w-full text-sm sm:text-base min-h-screen flex flex-col justify-center">
        <AuthProvider>
          <GlobalLayout>
            {children}
          </GlobalLayout>
        </AuthProvider>
      </body>
    </html>
  );
}