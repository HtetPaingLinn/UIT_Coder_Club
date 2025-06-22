'use client';

import { useTheme } from '@/context/ThemeContext';
import { SunIcon, MoonIcon } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <SunIcon className="h-5 w-5 text-yellow-500" />
            ) : (
                <MoonIcon className="h-5 w-5 text-gray-600" />
            )}
        </button>
    );
} 