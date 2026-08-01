import React from "react"
import { MegaMenuItem } from "./navigation-data"

interface MegaMenuColumnProps {
  menuItems: MegaMenuItem[]
}

const MegaMenuColumn: React.FC<MegaMenuColumnProps> = ({ menuItems }) => {
  return (
    <div className="flex flex-col select-none pl-8 pr-12 pt-4 pb-8">
      {menuItems.map((item) => {
        const isSale = item.isHighlight || item.name.includes("SALE")

        return (
          <div
            key={item.name}
            className="w-full py-2.5 flex items-center"
          >
            <button
              className={`nav-underline text-left text-[12px] uppercase tracking-[0.12em] transition-colors duration-200 focus:outline-none font-semibold ${
                isSale
                  ? "text-[#D01313] hover:text-[#B01010]"
                  : "text-[#111111] hover:text-neutral-500"
              }`}
            >
              {item.name}
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default MegaMenuColumn
