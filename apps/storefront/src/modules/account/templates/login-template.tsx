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
    <div className="w-full min-h-[50vh] flex flex-col justify-between items-center px-4 pt-2 pb-16 bg-white select-none">
      {/* Centered form wrapper */}
      <div className="w-full max-w-[420px] flex flex-col items-center">
        {currentView === "sign-in" ? (
          <Login setCurrentView={setCurrentView} />
        ) : (
          <Register setCurrentView={setCurrentView} />
        )}
      </div>

      {/* Centered country indicator and social links at bottom */}
      <div className="w-full flex flex-col items-center gap-y-8 mt-10 text-[11px] tracking-[0.15em] font-semibold text-black uppercase">
        <button className="flex items-center gap-x-2 hover:opacity-75 focus:outline-none font-semibold">
          India <span className="text-[12px]">→</span>
        </button>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[11px] font-semibold tracking-[0.12em] text-black">
          <a href="#" className="hover:opacity-60 transition-opacity">Instagram</a>
          <a href="#" className="hover:opacity-60 transition-opacity">Facebook</a>
          <a href="#" className="hover:opacity-60 transition-opacity">Youtube</a>
          <a href="#" className="hover:opacity-60 transition-opacity">Tiktok</a>
          <a href="#" className="hover:opacity-60 transition-opacity">Spotify</a>
          <a href="#" className="hover:opacity-60 transition-opacity">Pinterest</a>
          <a href="#" className="hover:opacity-60 transition-opacity">X</a>
          <a href="#" className="hover:opacity-60 transition-opacity">Linkedin</a>
        </div>
      </div>
    </div>
  )
}

export default LoginTemplate
