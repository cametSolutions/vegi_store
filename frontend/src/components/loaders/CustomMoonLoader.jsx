import React from 'react'
import { MoonLoader } from "react-spinners";

function CustomMoonLoader({size=40}) {
  return (
    <div className="flex items-center justify-center h-screen">
      <MoonLoader size={size} />
    </div>
  )
}

export default CustomMoonLoader
