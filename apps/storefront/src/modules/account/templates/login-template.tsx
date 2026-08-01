"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="w-full min-h-[50vh] flex flex-col justify-between items-center px-4 pt-12 pb-4 bg-white select-none">
      {/* Centered form wrapper */}
      <div className="w-full max-w-[340px] flex flex-col items-center">
        {currentView === "sign-in" ? (
          <Login setCurrentView={setCurrentView} />
        ) : (
          <Register setCurrentView={setCurrentView} />
        )}
      </div>

    </div>
  )
}

export default LoginTemplate
