"use client"

import React, { useState } from "react"
import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfileGender: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = useState(false)
  
  // Try to parse gender from metadata, fallback to "Prefer not to say"
  const currentGender = (customer.metadata?.gender as string) || "Prefer not to say"

  const updateGender = async () => {
    // Mock update function since Medusa customer doesn't have native gender field by default without metadata handling
    setSuccessState(true)
  }

  const clearState = () => {
    setSuccessState(false)
  }

  return (
    <form action={updateGender} onReset={() => clearState()} className="w-full">
      <AccountInfo
        label="Gender"
        currentInfo={currentGender}
        isSuccess={successState}
        isError={false}
        errorMessage={undefined}
        clearState={clearState}
        data-testid="account-gender-editor"
      >
        <div className="flex flex-col gap-y-4">
          <p className="text-[13px] text-[#111111] mb-2">Select one of the following:</p>
          
          <div className="flex flex-col gap-y-4">
            {["Female", "Male", "Non-binary", "I'd rather not say"].map((option) => (
              <label key={option} className="flex items-center gap-x-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="radio" 
                    name="gender" 
                    value={option}
                    defaultChecked={currentGender === option || (currentGender === "Prefer not to say" && option === "I'd rather not say")}
                    className="peer appearance-none w-5 h-5 border border-black rounded-full checked:border-[5px] checked:border-black transition-all" 
                  />
                </div>
                <span className="text-[14px] text-[#111111]">{option}</span>
              </label>
            ))}
          </div>
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileGender
