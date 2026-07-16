import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className={`flex-1 ${customer ? "py-4 small:py-8" : "py-0"}`} data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-5xl mx-auto bg-white flex flex-col">
        {customer ? (
          <div className="grid grid-cols-1 small:grid-cols-[240px_1fr] py-12">
            <div><AccountNav customer={customer} /></div>
            <div className="flex-1">{children}</div>
          </div>
        ) : (
          <div className="flex-1 flex justify-center items-center py-0 w-full">
            <div className="w-full flex justify-center">{children}</div>
          </div>
        )}

        {/* Removed Got questions block to match Mango UI */}
      </div>
    </div>
  )
}

export default AccountLayout
