import React from 'react';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ subsets: ["latin"], weight: ['400'] });

export default function Button(props) {
    const { text, dark, full, clickHandler } = props;
    return (
        <button
            onClick={clickHandler}
            className={
                'rounded-full overflow-hidden duration-200 ' +
                'font-bold py-2 sm:py-3 px-8 sm:px-10 md:px-14 border-b-4 ' +
                (full ? 'w-full ' : 'max-w-xs sm:max-w-sm ') + // Adjust width
                (dark // Dark button styling
                    ? 'bg-[#5DA7A7] text-white border-[#2B7C7C] hover:bg-[#76D1CD] hover:border-[#5DA7A7] '
                    : 'bg-white text-[#5cafaf] border-[#2B7C7C] hover:bg-[#76D1CD] hover:text-white hover:border-[#76D1CD] ')
            }>
            <p
                className={`${montserrat.className} text-base sm:text-lg md:text-xl font-bold whitespace-nowrap`}>
                {text}
            </p>
        </button>
    );
}
