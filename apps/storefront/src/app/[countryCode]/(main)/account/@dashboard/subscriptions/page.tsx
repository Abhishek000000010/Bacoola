import React from "react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Subscriptions",
  description: "Manage your newsletter and notification preferences.",
}

export default function Subscriptions() {
  return (
    <div className="w-full max-w-[500px] mx-auto pt-0 font-sans text-[#111111]">
      <div className="mb-12">
        <h1 className="text-[14px] sm:text-[15px] font-bold uppercase tracking-[0.05em] mb-4">
          My subscriptions
        </h1>
        <p className="text-[14px] font-normal tracking-wide leading-relaxed">
          Manage your newsletter and notification preferences. To unsubscribe, uncheck all the boxes.
        </p>
      </div>

      <form className="flex flex-col gap-y-12">
        {/* Contents Section */}
        <section>
          <h2 className="text-[13px] font-bold uppercase tracking-[0.05em] mb-6">
            Contents
          </h2>
          <div className="flex flex-col gap-y-4">
            <label className="flex items-center gap-x-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" defaultChecked className="peer appearance-none w-4 h-4 border border-[#cccccc] rounded-none checked:bg-black checked:border-black transition-colors" />
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100">
                  <path d="M11.5 11.5h-7v-7h7z"></path>
                  <path fillRule="evenodd" d="M14 14H2V2h12zM3 13h10V3H3z" clipRule="evenodd"></path>
                </svg>
              </div>
              <span className="text-[14px] tracking-wide text-[#111111]">Woman</span>
            </label>

            <label className="flex items-center gap-x-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" defaultChecked className="peer appearance-none w-4 h-4 border border-[#cccccc] rounded-none checked:bg-black checked:border-black transition-colors" />
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100">
                  <path d="M11.5 11.5h-7v-7h7z"></path>
                  <path fillRule="evenodd" d="M14 14H2V2h12zM3 13h10V3H3z" clipRule="evenodd"></path>
                </svg>
              </div>
              <span className="text-[14px] tracking-wide text-[#111111]">Man</span>
            </label>

            <label className="flex items-center gap-x-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" defaultChecked className="peer appearance-none w-4 h-4 border border-[#cccccc] rounded-none checked:bg-black checked:border-black transition-colors" />
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100">
                  <path d="M11.5 11.5h-7v-7h7z"></path>
                  <path fillRule="evenodd" d="M14 14H2V2h12zM3 13h10V3H3z" clipRule="evenodd"></path>
                </svg>
              </div>
              <span className="text-[14px] tracking-wide text-[#111111]">Kids</span>
            </label>
          </div>
        </section>

        {/* Channels Section */}
        <section>
          <h2 className="text-[13px] font-bold uppercase tracking-[0.05em] mb-6">
            Channels
          </h2>
          <div className="flex flex-col gap-y-4">
            <label className="flex items-center gap-x-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" defaultChecked className="peer appearance-none w-4 h-4 border border-[#cccccc] rounded-none checked:bg-black checked:border-black transition-colors" />
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100">
                  <path d="M11.5 11.5h-7v-7h7z"></path>
                  <path fillRule="evenodd" d="M14 14H2V2h12zM3 13h10V3H3z" clipRule="evenodd"></path>
                </svg>
              </div>
              <span className="text-[14px] tracking-wide text-[#111111]">e-mail</span>
            </label>

            <label className="flex items-center gap-x-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" defaultChecked className="peer appearance-none w-4 h-4 border border-[#cccccc] rounded-none checked:bg-black checked:border-black transition-colors" />
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100">
                  <path d="M11.5 11.5h-7v-7h7z"></path>
                  <path fillRule="evenodd" d="M14 14H2V2h12zM3 13h10V3H3z" clipRule="evenodd"></path>
                </svg>
              </div>
              <span className="text-[14px] tracking-wide text-[#111111]">SMS</span>
            </label>

            <label className="flex items-center gap-x-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" className="peer appearance-none w-4 h-4 border border-[#cccccc] rounded-none checked:bg-black checked:border-black transition-colors" />
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100">
                  <path d="M11.5 11.5h-7v-7h7z"></path>
                  <path fillRule="evenodd" d="M14 14H2V2h12zM3 13h10V3H3z" clipRule="evenodd"></path>
                </svg>
              </div>
              <span className="text-[14px] tracking-wide text-[#111111]">Post</span>
            </label>
          </div>
        </section>

        <button
          type="submit"
          className="w-full bg-[#111111] hover:bg-[#333333] text-white transition-colors h-[48px] text-[12px] font-bold uppercase tracking-[0.1em]"
        >
          Save
        </button>
      </form>
    </div>
  )
}
