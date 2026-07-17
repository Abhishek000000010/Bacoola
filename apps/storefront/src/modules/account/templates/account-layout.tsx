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
    <div className={`flex-1 ${customer ? "pt-8 pb-24" : "py-0"}`} data-testid="account-page">
      <div className="flex-1 w-full mx-auto max-w-none bg-white flex flex-col">
        {customer ? (
          <div className="flex flex-col small:flex-row w-full max-w-[1440px] mx-auto pl-6 small:pl-[48px] pr-6 small:pr-12 gap-x-[100px]">
            <div className="w-full small:w-[220px] shrink-0">
              <AccountNav customer={customer} />
            </div>
            <div className="flex-1 w-full max-w-[700px]">
              {children}
            </div>
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
