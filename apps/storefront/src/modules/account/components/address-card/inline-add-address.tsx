"use client"

import { useActionState, useEffect, useState } from "react"
import { addCustomerAddress } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"

export default function InlineAddAddress({
  region,
}: {
  region: HttpTypes.StoreRegion
}) {
  const [successState, setSuccessState] = useState(false)

  const [formState, formAction] = useActionState(addCustomerAddress, {
    success: false,
    error: null,
  } as { success: boolean; error: string | null })

  useEffect(() => {
    if (formState.success) {
      setSuccessState(true)
      // Refresh to update the address list
      window.location.reload()
    }
  }, [formState])

  return (
    <div className="w-full max-w-[520px] mx-auto font-sans text-[#111111] text-left">
      <form action={formAction} className="flex flex-col w-full gap-y-4">
        
        <div className="w-full border border-[#d0d0d0] h-[48px] px-4 flex items-center bg-white focus-within:border-[#111111] transition-colors">
          <input
            id="firstName"
            name="first_name"
            required
            placeholder="Name"
            className="w-full text-[13px] text-[#111111] bg-transparent outline-none p-0 m-0 border-none focus:ring-0 placeholder:text-[#555555]"
          />
        </div>

        <div className="w-full border border-[#d0d0d0] h-[48px] px-4 flex items-center bg-white focus-within:border-[#111111] transition-colors">
          <input
            id="lastName"
            name="last_name"
            required
            placeholder="Surname"
            className="w-full text-[13px] text-[#111111] bg-transparent outline-none p-0 m-0 border-none focus:ring-0 placeholder:text-[#555555]"
          />
        </div>

        <div className="w-full border border-[#d0d0d0] h-[48px] px-4 flex flex-col justify-center bg-white">
          <label className="text-[9px] uppercase tracking-widest text-[#999999] leading-none" htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            readOnly
            value="jiveshwork16@gmail.com"
            className="w-full text-[13px] text-[#999999] bg-transparent outline-none p-0 m-0 border-none cursor-not-allowed"
          />
        </div>

        <div className="w-full border border-[#d0d0d0] h-[48px] flex items-center focus-within:border-[#111111] bg-white transition-colors">
          <div className="flex items-center px-4 border-r border-[#d0d0d0] h-[24px] text-[13px] shrink-0">
            <span>+91</span>
            <svg className="w-3 h-3 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
          <div className="flex-1 h-full px-4 flex items-center">
            <input
              id="phone"
              name="phone"
              placeholder="Mobile"
              className="w-full text-[13px] text-[#111111] bg-transparent outline-none p-0 m-0 border-none focus:ring-0 placeholder:text-[#555555]"
            />
          </div>
        </div>

        <div className="w-full border border-[#d0d0d0] h-[48px] px-4 flex flex-col justify-center bg-white">
          <label className="text-[9px] uppercase tracking-widest text-[#999999] leading-none" htmlFor="countryCode">Country</label>
          <input type="hidden" name="country_code" value={region.countries?.[0]?.iso_2 || ""} />
          <select
            id="countryCode"
            disabled
            defaultValue={region.countries?.[0]?.iso_2 || ""}
            className="w-full text-[13px] text-[#999999] bg-transparent outline-none appearance-none cursor-not-allowed p-0 m-0 border-none focus:ring-0"
          >
            {region.countries?.map((c) => (
              <option key={c.iso_2} value={c.iso_2}>
                {c.display_name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full border border-[#d0d0d0] h-[48px] px-4 flex items-center bg-white focus-within:border-[#111111] transition-colors">
          <input
            id="address"
            name="address_1"
            required
            placeholder="Address"
            className="w-full text-[13px] text-[#111111] bg-transparent outline-none p-0 m-0 border-none focus:ring-0 placeholder:text-[#555555]"
          />
        </div>

        <div className="w-full border border-[#d0d0d0] h-[48px] px-4 flex items-center bg-white focus-within:border-[#111111] transition-colors">
          <input
            id="postalCode"
            name="postal_code"
            required
            placeholder="Postcode"
            className="w-full text-[13px] text-[#111111] bg-transparent outline-none p-0 m-0 border-none focus:ring-0 placeholder:text-[#555555]"
          />
        </div>

        <div className="w-full border border-[#d0d0d0] h-[48px] px-4 flex items-center bg-white focus-within:border-[#111111] transition-colors">
          <input
            id="city"
            name="city"
            required
            placeholder="Town / City"
            className="w-full text-[13px] text-[#111111] bg-transparent outline-none p-0 m-0 border-none focus:ring-0 placeholder:text-[#555555]"
          />
        </div>

        {formState.error && (
          <div className="text-red-500 text-[13px] py-2">
            {formState.error}
          </div>
        )}

        <p className="text-[13px] mt-6 mb-6 text-[#111111] text-left">
          This will be saved as your default delivery address.
        </p>

        <button
          type="submit"
          className="w-full bg-[#111111] hover:bg-[#333333] text-white transition-colors h-[48px] text-[12px] font-bold uppercase tracking-widest"
        >
          SAVE ADDRESS
        </button>

        <p className="text-[12px] mt-4 text-[#111111] text-left">
          By continuing, you confirm you have read the <a href="#" className="font-bold underline underline-offset-2 decoration-[1px] hover:text-[#555555]">Privacy Policy</a>
        </p>
      </form>
    </div>
  )
}
