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
      <div className="text-xs">
        <form action={(formData) => addPromotionCode(formData)} className="mb-4 w-full">
          <div className="flex w-full items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="flex w-full items-center justify-between border border-neutral-300 px-5 py-5 text-left text-xs font-semibold uppercase tracking-[0.18em] text-neutral-900 transition-colors hover:border-black focus:outline-none"
              data-testid="add-discount-button"
            >
              <span>Promotional code or gift card</span>
              <span className="text-[10px]">{isOpen ? "▲" : "▼"}</span>
            </button>
          </div>

          {isOpen && (
            <div className="mt-3 flex flex-col gap-y-3">
              <div className="flex w-full gap-x-2">
                <input
                  className="h-14 flex-1 border border-neutral-300 bg-white px-4 text-sm tracking-[0.08em] text-neutral-950 placeholder:text-neutral-400 focus:border-black focus:outline-none"
                  id="promotion-input"
                  name="code"
                  type="text"
                  placeholder="Code"
                  data-testid="discount-input"
                />
                <button
                  type="submit"
                  className="h-14 shrink-0 bg-black px-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-neutral-900"
                  data-testid="discount-apply-button"
                >
                  Apply
                </button>
              </div>

              <ErrorMessage
                error={errorMessage}
                data-testid="discount-error-message"
              />
            </div>
          )}
        </form>

        {promotions.length > 0 && (
          <div className="flex w-full items-center">
            <div className="flex w-full flex-col border-t border-neutral-200 pt-4">
              <Heading className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
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
