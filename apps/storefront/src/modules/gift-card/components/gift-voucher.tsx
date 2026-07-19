"use client"

import { useState } from "react"
import Image from "next/image"

export default function GiftVoucher() {
  const [selectedAmount, setSelectedAmount] = useState<string>("Rs. 2,000")

  const amounts = [
    "Rs. 2,000",
    "Rs. 6,000",
    "Rs. 10,000",
    "Rs. 4,000",
    "Rs. 8,000",
    "Rs. 12,000",
  ]

  return (
    <div className="min-h-screen bg-white pt-[31px] text-[#111111]">
      <div className="mx-auto flex max-w-[1920px] flex-col lg:flex-row">
        <div className="relative w-full lg:sticky lg:top-[82px] lg:w-1/2 lg:self-start">
          <div className="relative aspect-[1.04/1] w-full bg-[#f2f2f2] sm:aspect-[1.02/1]">
            <Image
              src="/Giftcard/pdp_gift_card.avif"
              alt="Mango Gift Card"
              fill
              className="object-cover object-center lg:object-[center_46%]"
              priority
            />
            <div className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-6 text-center text-white lg:hidden">
              <h1 className="text-[60px] font-semibold uppercase leading-[0.92] tracking-[-0.05em]">
                Gift Card
              </h1>
              <p className="mt-2 text-[16px] font-semibold uppercase leading-[1.15]">
                The perfect gift, that everyone can use!
              </p>
            </div>
          </div>
        </div>

        <div className="w-full px-6 pb-20 pt-6 sm:px-8 lg:w-1/2 lg:px-[68px] lg:pb-24 lg:pt-[56px]">
          <div className="max-w-[610px]">
            <h1 className="hidden text-[84px] font-semibold uppercase leading-[0.94] tracking-[-0.045em] text-[#111111] lg:block">
              Gift Card
            </h1>

            <p className="hidden mt-5 text-[19px] font-semibold uppercase leading-[1.15] text-[#111111] lg:block">
              The perfect gift, that everyone can use!
            </p>

            <div className="mt-0 lg:mt-[42px]">
              <h2 className="text-[18px] font-semibold uppercase leading-none text-[#111111] lg:text-[19px]">
                About the card
              </h2>

              <ul className="mt-6 flex flex-col gap-y-3 lg:mt-7">
                {[
                  "Valid online and in stores.",
                  "Never expires.",
                  "Sent by e-mail.",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-[16px] font-normal leading-[1.38] text-[#111111] lg:text-[17px]"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-[42px] lg:mt-[44px]">
              <h2 className="text-[18px] font-semibold uppercase leading-none text-[#111111] lg:text-[19px]">
                Choose the amount
              </h2>

              <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-9 sm:grid-cols-3 lg:mt-9 lg:gap-x-8 lg:gap-y-12">
                {amounts.map((amount) => (
                  <label
                    key={amount}
                    className="flex cursor-pointer items-center gap-4"
                  >
                    <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-[#111111] lg:h-[22px] lg:w-[22px]">
                      {selectedAmount === amount && (
                        <span className="h-[9px] w-[9px] rounded-full bg-[#111111]" />
                      )}
                    </span>
                    <span className="text-[16px] font-normal leading-none text-[#111111] lg:text-[17px]">
                      {amount}
                    </span>
                    <input
                      type="radio"
                      name="amount"
                      value={amount}
                      checked={selectedAmount === amount}
                      onChange={(e) => setSelectedAmount(e.target.value)}
                      className="sr-only"
                    />
                  </label>
                ))}
              </div>

              <button className="mt-10 flex items-center gap-2 text-[16px] font-normal leading-none text-[#111111] transition-colors hover:text-[#444444] lg:mt-11 lg:text-[17px]">
                <span>Other amounts</span>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            <div className="mt-10 lg:mt-[42px]">
              <button className="flex h-[58px] w-full items-center justify-center bg-[#111111] text-[13px] font-semibold uppercase tracking-[0.03em] text-white transition-colors hover:bg-black lg:h-[62px] lg:text-[14px]">
                Purchase now
              </button>

              <div className="mt-9 lg:mt-[42px]">
                <h2 className="text-[18px] font-semibold uppercase leading-[1.15] text-[#111111] lg:text-[19px]">
                  Already have a Mango gift card?
                </h2>

                <button className="mt-6 flex h-[58px] w-full items-center justify-center border border-[#9a9a9a] bg-transparent text-[13px] font-semibold uppercase tracking-[0.03em] text-[#111111] transition-colors hover:bg-[#fafafa] lg:mt-7 lg:h-[62px] lg:text-[14px]">
                  Check the balance
                </button>
              </div>
            </div>

            <div className="mt-8 max-w-[620px] lg:mt-9">
              <a
                href="#"
                className="inline-block text-[15px] font-semibold text-[#111111] underline"
              >
                Terms of use
              </a>

              <p className="mt-6 text-[13px] leading-[1.5] text-[#111111] lg:mt-7 lg:text-[14px]">
                HOW DO WE TREAT AND PROTECT YOUR DATA? DATA CONTROLLER: MANGO
                MNG, S.A. PURPOSE: Manage the sending and use of the gift
                voucher. RIGHTS: You can, at any time, exercise your rights of
                access, rectification, erasure, objection and other
                legally-established rights at personaldata@mango.com. ADDITIONAL
                INFORMATION: Consult more information in our{" "}
                <a href="#" className="font-semibold underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
