import React from 'react'
import { MoonLoader } from "react-spinners";

function CustomMoonLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <MoonLoader size={40} />
    </div>
  )
}

export default CustomMoonLoader
