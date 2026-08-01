"use client"

import React from "react"

import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Badge, Heading, Text } from "@modules/common/components/ui"
import Trash from "@modules/common/icons/trash"
import ErrorMessage from "../error-message"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  const { promotions = [] } = cart

  const removePromotionCode = async (code: string) => {
    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )

    await applyPromotions(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")

    const code = formData.get("code")
    if (!code) {
      return
    }

    const input = document.getElementById("promotion-input") as HTMLInputElement
    const codes = promotions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)

    codes.push(code.toString())

    try {
      await applyPromotions(codes)
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e))
    }

    if (input) {
      input.value = ""
    }
  }

  return (
    <div className="flex w-full flex-col bg-white">
      <div className="text-xs lg:text-sm">
        <form action={(formData) => addPromotionCode(formData)} className="mb-0 lg:mb-4 w-full border-0 p-0">
          <div className="flex w-full items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="flex w-full items-center justify-between py-0 lg:py-1 px-0 text-left focus:outline-none"
              data-testid="add-discount-button"
            >
              <span className="text-[12px] lg:text-[14px] font-normal text-neutral-950 uppercase tracking-[0.05em] lg:normal-case lg:tracking-normal">Promotional code or gift card</span>
              {isOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              )}
            </button>
          </div>

          <div
            className={`grid transition-all duration-300 ease-in-out ${
              isOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="px-0 pb-2 pt-3 flex flex-col gap-y-4">
                <div className="relative w-full">
                  <input
                    id="promotion-input"
                    name="code"
                    type="text"
                    placeholder=" "
                    data-testid="discount-input"
                    className="peer block h-12 w-full appearance-none rounded-none border border-neutral-300 bg-transparent px-4 pt-[22px] pb-[6px] text-[12px] lg:text-[14px] leading-none text-neutral-900 focus:border-black focus:outline-none focus:ring-0"
                  />
                  <label
                    htmlFor="promotion-input"
                    data-no-global-float
                    className="pointer-events-none absolute left-4 top-[7px] z-10 text-[12px] lg:text-[14px] leading-none text-black transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[12px] lg:text-[14px] peer-focus:top-[7px] peer-focus:translate-y-0 peer-focus:text-[12px] lg:text-[14px] uppercase"
                  >
                    Code or card
                  </label>
                </div>
                <button
                  type="submit"
                  className="h-12 w-full border border-black bg-white text-[12px] lg:text-[14px] font-bold uppercase text-black transition-colors hover:bg-neutral-50"
                  data-testid="discount-apply-button"
                >
                  Apply
                </button>

                <ErrorMessage
                  error={errorMessage}
                  data-testid="discount-error-message"
                />
              </div>
            </div>
          </div>
        </form>

        {promotions.length > 0 && (
          <div className="flex w-full items-center">
            <div className="flex w-full flex-col border-t border-neutral-200 pt-4">
              <Heading className="mb-3 text-[12px] lg:text-[14px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Promotion(s) applied:
              </Heading>

              {promotions.map((promotion) => {
                return (
                  <div
                    key={promotion.id}
                    className="mb-2 flex w-full max-w-full items-center justify-between"
                    data-testid="discount-row"
                  >
                    <Text className="flex w-4/5 items-baseline gap-x-1 pr-1 text-sm text-neutral-700">
                      <span className="truncate" data-testid="discount-code">
                        <Badge color={promotion.is_automatic ? "green" : "grey"}>
                          {promotion.code}
                        </Badge>{" "}
                        (
                        {promotion.application_method?.value !== undefined &&
                          promotion.application_method.currency_code !==
                            undefined && (
                            <>
                              {promotion.application_method.type === "percentage"
                                ? `${promotion.application_method.value}%`
                                : convertToLocale({
                                    amount: +promotion.application_method.value,
                                    currency_code:
                                      promotion.application_method.currency_code,
                                  })}
                            </>
                          )}
                        )
                      </span>
                    </Text>
                    {!promotion.is_automatic && (
                      <button
                        className="flex items-center text-neutral-500 transition-colors hover:text-neutral-950"
                        onClick={() => {
                          if (!promotion.code) {
                            return
                          }

                          removePromotionCode(promotion.code)
                        }}
                        data-testid="remove-discount-button"
                      >
                        <Trash size={14} />
                        <span className="sr-only">
                          Remove discount code from order
                        </span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiscountCode
