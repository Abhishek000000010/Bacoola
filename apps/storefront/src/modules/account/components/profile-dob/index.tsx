"use client"

import React, { useState } from "react"
import Input from "@modules/common/components/input"
import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfileDob: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = useState(false)
  
  // Try to parse DOB from metadata
  const currentDob = (customer.metadata?.dob as string) || ""

  const updateDob = async () => {
    // Mock update function
    setSuccessState(true)
  }

  const clearState = () => {
    setSuccessState(false)
  }

  return (
    <form action={updateDob} onReset={() => clearState()} className="w-full">
      <AccountInfo
        label="Date of birth"
        currentInfo={currentDob || "When is your birthday?"}
        isSuccess={successState}
        isError={false}
        errorMessage={undefined}
        clearState={clearState}
        data-testid="account-dob-editor"
      >
        <div className="grid grid-cols-1 gap-y-4">
          <Input
            label="Date of birth"
            name="dob"
            type="date"
            defaultValue={currentDob}
            data-testid="dob-input"
            inputClassName="transition-all duration-300 ease-in-out focus:border-black focus:ring-[0.5px] focus:ring-black focus:shadow-[0_4px_14px_rgba(0,0,0,0.05)] hover:border-neutral-400"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileDob
