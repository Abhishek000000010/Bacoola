import React, { useState } from "react"
import { teenData } from "./menu-data"
import MenuList from "./MenuList"

const TeenSwitcher: React.FC = () => {
  const [activeSub, setActiveSub] = useState<"Teen Girl" | "Teen Boy">("Teen Girl")

  return (
    <div className="flex flex-col h-full">
      {/* Segmented Switcher */}
      <div className="flex gap-2 p-1 bg-neutral-100 rounded-md select-none mb-4">
        {teenData.subcategories.map((sub) => {
          const isActive = activeSub === sub
          return (
            <button
              key={sub}
              onClick={() => setActiveSub(sub)}
              className={`flex-1 text-center py-1.5 text-xs tracking-wider uppercase rounded-none transition-all duration-300 focus:outline-none ${
                isActive ? "bg-white text-black shadow-sm font-semibold" : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {sub}
            </button>
          )
        })}
      </div>

      {/* Height Indicator Helper */}
      <div className="text-[10px] text-neutral-400 uppercase tracking-widest mb-2 select-none">
        {teenData.heightRange}
      </div>

      {/* Categorized Menu List */}
      <MenuList items={teenData.menus[activeSub]} />
    </div>
  )
}

export default TeenSwitcher
