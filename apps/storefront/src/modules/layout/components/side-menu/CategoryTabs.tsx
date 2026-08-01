import React from "react"
import { CategoryKey } from "./menu-data"

interface CategoryTabsProps {
  activeTab: CategoryKey
  onTabChange: (tab: CategoryKey) => void
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: { key: CategoryKey; label: string }[] = [
    { key: "women", label: "WOMEN" },
    { key: "men", label: "MEN" },
    { key: "teen", label: "TEEN" },
    { key: "kids", label: "KIDS" },
  ]

  return (
    <div className="flex flex-1 relative select-none gap-x-5 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`py-2 text-xs font-semibold tracking-wider transition-all duration-300 relative focus:outline-none whitespace-nowrap ${
              isActive ? "text-black font-bold" : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-black animate-in fade-in duration-300" />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default CategoryTabs
