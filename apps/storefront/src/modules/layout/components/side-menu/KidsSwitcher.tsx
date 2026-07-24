import React, { useState } from "react"
import { kidsData } from "./menu-data"
import MenuList from "./MenuList"

type KidCategory = "Girls" | "Boys" | "Baby Girls" | "Baby Boys" | "Newborn"

const KidsSwitcher: React.FC = () => {
  const [activeSub, setActiveSub] = useState<KidCategory>("Girls")

  return (
    <div className="flex flex-col h-full">
      {/* Segmented Switcher (horizontal scrollable on mobile/tablet) */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-md overflow-x-auto select-none mb-4 scrollbar-none">
        {kidsData.subcategories.map((sub) => {
          const isActive = activeSub === sub
          return (
            <button
              key={sub}
              onClick={() => setActiveSub(sub)}
              className={`flex-none px-3 py-1.5 text-[10px] sm:text-xs tracking-wider uppercase rounded-none transition-all duration-300 whitespace-nowrap focus:outline-none ${
                isActive ? "bg-white text-black shadow-sm font-semibold" : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {sub}
            </button>
          )
        })}
      </div>

      {/* Height/Age Indicator Helper */}
      <div className="text-[10px] text-neutral-400 uppercase tracking-widest mb-2 select-none">
        {kidsData.heightRange}
      </div>

      {/* Categorized Menu List */}
      <MenuList items={kidsData.menus[activeSub]} />
    </div>
  )
}

export default KidsSwitcher
