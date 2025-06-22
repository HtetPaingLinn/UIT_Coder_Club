import React from 'react'

export default function Loading() {

  console.log('Loading state is called')

  return (
    <div className='flex flex-col flex-1 justify-center items-center'>
      {/* <i className={`fa-solid fa-spinner animate-spin text-4xl sm:text-5xl text-slate dark:text-white `}></i> */}

      <div className="spinner">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      </div>
    </div>
  )
}