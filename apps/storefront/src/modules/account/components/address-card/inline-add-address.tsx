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
    <div className="w-full max-w-[520px] mx-auto font-sans text-[#111111]">
      <form action={formAction} className="flex flex-col w-full gap-y-4">
        
        <div className="w-full border border-[#e5e5e5] h-[48px] px-4 flex flex-col justify-center bg-white rounded-none focus-within:border-[#111111]">
          <label className="text-[10px] text-[#555555]" htmlFor="firstName">Name</label>
          <input
            id="firstName"
            name="first_name"
            required
            className="w-full text-[13px] text-[#111111] bg-transparent outline-none p-0 m-0 border-none focus:ring-0"
          />
        </div>

        <div className="w-full border border-[#e5e5e5] h-[48px] px-4 flex flex-col justify-center bg-white rounded-none focus-within:border-[#111111]">
          <label className="text-[10px] text-[#555555]" htmlFor="lastName">Surname</label>
          <input
            id="lastName"
            name="last_name"
            required
            className="w-full text-[13px] text-[#111111] bg-transparent outline-none p-0 m-0 border-none focus:ring-0"
          />
        </div>

        <div className="w-full border border-[#e5e5e5] h-[48px] px-4 flex flex-col justify-center bg-white rounded-none">
          <label className="text-[10px] text-[#999999]" htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            readOnly
            value="jiveshwork16@gmail.com"
            className="w-full text-[13px] text-[#999999] bg-transparent outline-none p-0 m-0 border-none cursor-not-allowed"
          />
        </div>

        <div className="w-full border border-[#e5e5e5] h-[48px] flex items-center focus-within:border-[#111111] bg-white rounded-none">
          <div className="flex items-center px-4 border-r border-[#e5e5e5] h-[24px] text-[13px]">
            <span>+91</span>
            <svg className="w-3 h-3 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
          <div className="flex-1 h-full px-4 flex flex-col justify-center">
            <label className="text-[10px] text-[#555555]" htmlFor="phone">Mobile</label>
            <input
              id="phone"
              name="phone"
              className="w-full text-[13px] text-[#111111] bg-transparent outline-none p-0 m-0 border-none focus:ring-0"
            />
          </div>
        </div>

        <div className="w-full border border-[#e5e5e5] h-[48px] px-4 flex flex-col justify-center bg-white rounded-none">
          <label className="text-[10px] text-[#999999]" htmlFor="countryCode">Country</label>
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

        <div className="w-full border border-[#e5e5e5] h-[48px] px-4 flex flex-col justify-center bg-white rounded-none focus-within:border-[#111111]">
          <label className="text-[10px] text-[#555555]" htmlFor="address">Address</label>
          <input
            id="address"
            name="address_1"
            required
            className="w-full text-[13px] text-[#111111] bg-transparent outline-none p-0 m-0 border-none focus:ring-0"
          />
        </div>

        <div className="w-full border border-[#e5e5e5] h-[48px] px-4 flex flex-col justify-center bg-white rounded-none focus-within:border-[#111111]">
          <label className="text-[10px] text-[#555555]" htmlFor="address_2">Apartment, suite, etc.</label>
          <input
            id="address_2"
            name="address_2"
            className="w-full text-[13px] text-[#111111] bg-transparent outline-none p-0 m-0 border-none focus:ring-0"
          />
        </div>

        <div className="w-full border border-[#e5e5e5] h-[48px] px-4 flex flex-col justify-center bg-white rounded-none focus-within:border-[#111111]">
          <label className="text-[10px] text-[#555555]" htmlFor="postalCode">Postcode</label>
          <input
            id="postalCode"
            name="postal_code"
            required
            className="w-full text-[13px] text-[#111111] bg-transparent outline-none p-0 m-0 border-none focus:ring-0"
          />
        </div>

        <div className="w-full border border-[#e5e5e5] h-[48px] px-4 flex flex-col justify-center bg-white rounded-none focus-within:border-[#111111]">
          <label className="text-[10px] text-[#555555]" htmlFor="city">Town / City</label>
          <input
            id="city"
            name="city"
            required
            className="w-full text-[13px] text-[#111111] bg-transparent outline-none p-0 m-0 border-none focus:ring-0"
          />
        </div>

        <div className="w-full border border-[#e5e5e5] h-[48px] px-4 flex flex-col justify-center bg-white rounded-none focus-within:border-[#111111]">
          <label className="text-[10px] text-[#555555]" htmlFor="province">Province / State</label>
          <input
            id="province"
            name="province"
            className="w-full text-[13px] text-[#111111] bg-transparent outline-none p-0 m-0 border-none focus:ring-0"
          />
        </div>

        {formState.error && (
          <div className="text-red-500 text-[13px] py-2">
            {formState.error}
          </div>
        )}

        <p className="text-[13px] mt-2 mb-2 text-[#111111] text-left">
          This will be saved as your default delivery address.
        </p>

        <button
          type="submit"
          className="w-full bg-[#111111] hover:bg-[#333333] text-white transition-colors h-[48px] text-[13px] font-bold"
        >
          Save address
        </button>

        <p className="text-[11px] mt-2 text-[#111111]">
          By continuing, you confirm you have read the <a href="#" className="font-bold underline hover:text-[#555555]">Privacy Policy</a>
        </p>
      </form>
    </div>
  )
}
