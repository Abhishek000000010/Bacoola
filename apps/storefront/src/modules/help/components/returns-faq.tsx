"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const CATEGORIES = [
  {
    id: "delivery",
    title: "Delivery and order tracking",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7h10v7H3z" />
        <path d="M13 10h4l3 3v1h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
        <path d="M5 5h5" />
        <path d="M3 10h4" />
      </svg>
    ),
    questions: [
      "What are the delivery times for an order?",
      "Where is my order?",
      "Can I change the delivery address of an order?",
      "Can I cancel my order?",
      "What should I do if I have not received all the items in my purchase?",
      "What can I do if I receive an incorrect or defective item?",
      "Why do we need your KYC to send you the order?",
    ],
  },
  {
    id: "returns",
    title: "Returns, exchanges and refunds",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 11a8 8 0 1 0 2.34-5.66L4 8" />
        <path d="M4 4v4h4" />
      </svg>
    ),
    questions: [
      "How can I exchange or return an online purchase?",
      "How can I exchange or return an in-store purchase?",
      "How can I find out the status of my return?",
      "How and when will I receive my refund?",
      "What are the return conditions?",
      "What can I do if I receive an incorrect or defective item?",
    ],
  },
  {
    id: "payments",
    title: "Payments, promotions and gift cards",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="6" width="18" height="12" />
        <path d="M3 10h18" />
      </svg>
    ),
    questions: [
      "What payment methods are accepted?",
      "How do I apply a promotional code?",
      "How can I purchase and use a gift card?",
      "Can I get a tax invoice for my purchase?",
    ],
  },
  {
    id: "products",
    title: "Information on sizes and products",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 4 7 6 4 5l-1 3 3 2v9h12v-9l3-2-1-3-3 1-2-2z" />
        <path d="M9 4c.5 1 1.6 2 3 2s2.5-1 3-2" />
      </svg>
    ),
    questions: [
      "How do I care for my garments so they last longer?",
      "How can I find out if an item is available in store?",
      "What is my size?",
    ],
  },
  {
    id: "personal",
    title: "Personal data and notifications",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1" />
        <circle cx="12" cy="8" r="4" />
      </svg>
    ),
    questions: [
      "How can I change my personal details?",
      "I've forgotten my password. How can I recover it?",
      "How can I manage the notifications I receive?",
      "How do I delete my account?",
    ],
  },
  {
    id: "stores",
    title: "Stores",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 4h12" />
        <path d="M7 4v16" />
        <path d="M17 4v16" />
        <path d="M7 10h10" />
        <path d="M7 20h10" />
        <path d="M11 10v10" />
      </svg>
    ),
    questions: [
      "How can I find my nearest store?",
      "What services are available in store?",
      "Can I return an online purchase in store?",
    ],
  },
]

export default function ReturnsFAQ() {
  const [activeCategoryId, setActiveCategoryId] = useState("returns")

  const activeCategory = CATEGORIES.find((cat) => cat.id === activeCategoryId)

  return (
    <div className="min-h-screen bg-white pb-[80px] pt-[80px] text-[#111111]">
      <div className="mx-auto flex max-w-[1200px] items-start gap-[60px] px-8 md:px-12">
        
        {/* Left Sidebar */}
        <div className="w-full md:w-[280px] flex-shrink-0">
          <h2 className="mb-[30px] pl-[12px] text-[12px] font-bold uppercase tracking-[0.05em] text-[#111111]">
            Categories
          </h2>

          <ul className="flex flex-col gap-y-[24px]">
            {CATEGORIES.map((category) => {
              const isActive = category.id === activeCategoryId

              return (
                <li key={category.id}>
                  <button
                    onClick={() => setActiveCategoryId(category.id)}
                    className="flex w-full items-center gap-[14px] pl-[12px] text-left text-[#111111] transition-colors"
                  >
                    <span className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center">
                      {category.icon}
                    </span>
                    <span
                      className={`text-[14px] leading-[1.4] transition-colors ${
                        isActive
                          ? "font-semibold text-black"
                          : "font-normal text-[#111111] hover:text-black"
                      }`}
                    >
                      {category.title}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Right Content */}
        <div className="flex-1 max-w-[800px]">
          {activeCategory && (
            <>
              <h1 className="mb-[40px] text-[20px] font-bold uppercase leading-none tracking-[-0.01em] text-[#111111]">
                {activeCategory.title}
              </h1>

              <ul className="flex flex-col">
                {activeCategory.questions.map((question, index) => (
                  <li key={index}>
                    <LocalizedClientLink
                      href="#"
                      className="group flex items-center justify-between gap-x-6 py-[16px] border-b border-transparent hover:border-[#111111]/10 transition-colors"
                    >
                      <span className="text-[15px] font-normal leading-[1.6] text-[#111111]">
                        {question}
                      </span>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="flex-shrink-0 text-[#111111] transition-transform duration-200 group-hover:translate-x-1"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
