"use client"
import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import { CheckCircleSolid, Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import Divider from "@modules/common/components/divider"
import MedusaRadio from "@modules/common/components/radio"
import { Button, clx, Heading, Text } from "@modules/common/components/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

function formatAddress(address: HttpTypes.StoreCartAddress) {
  if (!address) {
    return ""
  }

  let ret = ""

  if (address.address_1) {
    ret += ` ${address.address_1}`
  }

  if (address.address_2) {
    ret += `, ${address.address_2}`
  }

  if (address.postal_code) {
    ret += `, ${address.postal_code} ${address.city}`
  }

  if (address.country_code) {
    ret += `, ${address.country_code.toUpperCase()}`
  }

  return ret
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)

  const [showPickupOptions, setShowPickupOptions] =
    useState<string>(PICKUP_OPTION_OFF)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  const _shippingMethods = availableShippingMethods?.filter(
    (sm) => (sm as unknown as { service_zone?: { fulfillment_set?: { type?: string; location?: { address: HttpTypes.StoreCartAddress } } } }).service_zone?.fulfillment_set?.type !== "pickup"
  )

  const _pickupMethods = availableShippingMethods?.filter(
    (sm) => (sm as unknown as { service_zone?: { fulfillment_set?: { type?: string; location?: { address: HttpTypes.StoreCartAddress } } } }).service_zone?.fulfillment_set?.type === "pickup"
  )

  const hasPickupOptions = !!_pickupMethods?.length

  useEffect(() => {
    setIsLoadingPrices(true)

    if (_shippingMethods?.length) {
      const promises = _shippingMethods
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

      if (promises.length) {
        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r) => r.status === "fulfilled")
            .forEach((p) => {
              if (p.value?.id) {
                pricesMap[p.value.id] = p.value.amount ?? 0
              }
            })

          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      }
    }

    if (_pickupMethods?.find((m) => m.id === shippingMethodId)) {
      setShowPickupOptions(PICKUP_OPTION_ON)
    }
  }, [availableShippingMethods])

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const handleSetShippingMethod = async (
    id: string,
    variant: "shipping" | "pickup"
  ) => {
    setError(null)

    if (variant === "pickup") {
      setShowPickupOptions(PICKUP_OPTION_ON)
    } else {
      setShowPickupOptions(PICKUP_OPTION_OFF)
    }

    let currentId: string | null = null
    setIsLoading(true)
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setShippingMethodId(currentId)

        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-white">
      <div className="mb-8 flex flex-row items-center justify-between border-b border-neutral-200 pb-4">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row items-baseline gap-x-2 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-950",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
            }
          )}
        >
          Delivery Method
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircleSolid />
          )}
        </Heading>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <div>
              <button
                onClick={handleEdit}
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 transition-colors hover:text-neutral-950"
                data-testid="edit-delivery-button"
              >
                Edit
              </button>
            </div>
          )}
      </div>
      {isOpen ? (
        <>
          <div className="grid">
            <div className="flex flex-col">
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-950">
                Shipping method
              </span>
              <span className="mb-5 text-sm text-neutral-500">
                How would you like you order delivered
              </span>
            </div>
            <div data-testid="delivery-options-container">
              <div className="pb-8 md:pt-0 pt-2">
                {hasPickupOptions && (
                  <RadioGroup
                    value={showPickupOptions}
                    onChange={(_value) => {
                      const id = _pickupMethods.find(
                        (option) => !option.insufficient_inventory
                      )?.id

                      if (id) {
                        handleSetShippingMethod(id, "pickup")
                      }
                    }}
                  >
                    <Radio
                      value={PICKUP_OPTION_ON}
                      data-testid="delivery-option-radio"
                      className={clx(
                        "mb-2 flex cursor-pointer items-center justify-between border border-neutral-300 px-5 py-5 text-sm transition-colors hover:border-black",
                        {
                          "border-black":
                            showPickupOptions === PICKUP_OPTION_ON,
                        }
                      )}
                    >
                      <div className="flex items-center gap-x-4">
                        <MedusaRadio
                          checked={showPickupOptions === PICKUP_OPTION_ON}
                        />
                        <span className="text-sm font-normal text-neutral-950">
                          Pick up your order
                        </span>
                      </div>
                      <span className="justify-self-end text-sm text-neutral-950">
                        -
                      </span>
                    </Radio>
                  </RadioGroup>
                )}
                <RadioGroup
                  value={shippingMethodId}
                  onChange={(v) => {
                    if (v) {
                      return handleSetShippingMethod(v, "shipping")
                    }
                  }}
                >
                  {_shippingMethods?.map((option) => {
                    const isDisabled =
                      option.price_type === "calculated" &&
                      !isLoadingPrices &&
                      typeof calculatedPricesMap[option.id] !== "number"

                    return (
                      <Radio
                        key={option.id}
                        value={option.id}
                        data-testid="delivery-option-radio"
                        disabled={isDisabled}
                        className={clx(
                          "mb-2 flex cursor-pointer items-center justify-between border border-neutral-300 px-5 py-5 text-sm transition-colors hover:border-black",
                          {
                            "border-black":
                              option.id === shippingMethodId,
                            "cursor-not-allowed opacity-50":
                              isDisabled,
                          }
                        )}
                      >
                        <div className="flex items-center gap-x-4">
                          <MedusaRadio
                            checked={option.id === shippingMethodId}
                          />
                          <span className="text-sm font-normal text-neutral-950">
                            {option.name}
                          </span>
                        </div>
                        <span className="justify-self-end text-sm text-neutral-950">
                          {option.price_type === "flat" ? (
                            convertToLocale({
                              amount: option.amount!,
                              currency_code: cart?.currency_code,
                            })
                          ) : calculatedPricesMap[option.id] ? (
                            convertToLocale({
                              amount: calculatedPricesMap[option.id],
                              currency_code: cart?.currency_code,
                            })
                          ) : isLoadingPrices ? (
                            <Loader />
                          ) : (
                            "-"
                          )}
                        </span>
                      </Radio>
                    )
                  })}
                </RadioGroup>
              </div>
            </div>
          </div>

          {showPickupOptions === PICKUP_OPTION_ON && (
            <div className="grid">
              <div className="flex flex-col">
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-950">
                  Store
                </span>
                <span className="mb-5 text-sm text-neutral-500">
                  Choose a store near you
                </span>
              </div>
              <div data-testid="delivery-options-container">
                <div className="pb-8 md:pt-0 pt-2">
                  <RadioGroup
                    value={shippingMethodId}
                    onChange={(v) => {
                      if (v) {
                        return handleSetShippingMethod(v, "pickup")
                      }
                    }}
                  >
                    {_pickupMethods?.map((option) => {
                      return (
                        <Radio
                          key={option.id}
                          value={option.id}
                          disabled={option.insufficient_inventory}
                          data-testid="delivery-option-radio"
                          className={clx(
                            "mb-2 flex cursor-pointer items-center justify-between border border-neutral-300 px-5 py-5 text-sm transition-colors hover:border-black",
                            {
                              "border-black":
                                option.id === shippingMethodId,
                              "cursor-not-allowed opacity-50":
                                option.insufficient_inventory,
                            }
                          )}
                        >
                          <div className="flex items-start gap-x-4">
                            <MedusaRadio
                              checked={option.id === shippingMethodId}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-normal text-neutral-950">
                                {option.name}
                              </span>
                              <span className="text-sm text-neutral-500">
                                {formatAddress(
                                  (option as unknown as { service_zone?: { fulfillment_set?: { location?: { address: HttpTypes.StoreCartAddress } } } }).service_zone?.fulfillment_set?.location
                                    ?.address as HttpTypes.StoreCartAddress
                                )}
                              </span>
                            </div>
                          </div>
                          <span className="justify-self-end text-sm text-neutral-950">
                            {convertToLocale({
                              amount: option.amount!,
                              currency_code: cart?.currency_code,
                            })}
                          </span>
                        </Radio>
                      )
                    })}
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          <div>
            <ErrorMessage
              error={error}
              data-testid="delivery-option-error-message"
            />
            <Button
              size="large"
              className="mt-2 h-14 w-full rounded-none bg-black px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-neutral-900 small:w-auto small:min-w-[320px]"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!cart.shipping_methods?.[0]}
              data-testid="submit-delivery-option-button"
            >
              Continue to payment
            </Button>
          </div>
        </>
      ) : (
        <div>
          {cart && (cart.shipping_methods?.length ?? 0) > 0 && cart.shipping_address && (
            <div className="flex flex-col border border-neutral-200 p-5 mt-2">
              <div className="flex items-center gap-x-3 text-[13px] font-bold text-neutral-950 uppercase tracking-[0.05em]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <span>{cart.shipping_methods!.at(-1)!.name}</span>
                <span className="font-normal text-neutral-500 ml-1">
                  {cart.shipping_methods!.at(-1)!.amount === 0 ? "FREE" : convertToLocale({ amount: cart.shipping_methods!.at(-1)!.amount!, currency_code: cart?.currency_code })}
                </span>
              </div>
              <div className="mt-5 text-[13px] text-neutral-950">
                <span className="font-semibold uppercase tracking-[0.05em]">Delivery:</span> Monday, 17 Aug - Wednesday, 2 Sept
              </div>
              <div className="mt-1 text-[12px] text-neutral-600">
                This may be slightly later than estimated, due to increased orders during sales.
              </div>
              <div className="mt-6 flex justify-between items-start">
                <div className="flex flex-col gap-y-1 text-[13px] text-neutral-800">
                  <span>{cart.shipping_address?.first_name} {cart.shipping_address?.last_name}</span>
                  <span>{cart.email}</span>
                  <span>{cart.shipping_address?.phone}</span>
                  <span>
                    {cart.shipping_address?.address_1} {cart.shipping_address?.address_2 && `, ${cart.shipping_address.address_2}`}, {cart.shipping_address?.postal_code}, {cart.shipping_address?.city}
                  </span>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(true)}
                  className="text-[11px] font-bold uppercase tracking-[0.05em] text-neutral-950 underline underline-offset-[3px] transition-colors hover:text-neutral-500"
                >
                  Edit Address
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {searchParams.get("step") === "delivery" ? <Divider className="mt-10 border-neutral-200" /> : null}
      
      {/* Side Drawer for My Addresses */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 transition-opacity" 
            onClick={() => setIsDrawerOpen(false)} 
          />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-[420px] bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-8 pt-10">
              <h2 className="text-[14px] font-bold uppercase tracking-[0.05em] text-neutral-950">
                My Addresses
              </h2>
              <button onClick={() => setIsDrawerOpen(false)} className="text-neutral-950 hover:text-neutral-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-4">
              {cart.shipping_address && (
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-y-1 text-[13px] text-neutral-950">
                    <span>{cart.shipping_address.first_name} {cart.shipping_address.last_name}</span>
                    <span>{cart.email}</span>
                    <span>{cart.shipping_address.phone}</span>
                    <span>
                      {cart.shipping_address.address_1} {cart.shipping_address.address_2 && `, ${cart.shipping_address.address_2}`}, {cart.shipping_address.postal_code}, {cart.shipping_address.city}
                    </span>
                    <div className="mt-4">
                      <span className="bg-[#f0f0f0] text-neutral-900 text-[12px] px-3 py-[6px]">
                        Default delivery address
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsDrawerOpen(false)
                      router.push(pathname + "?step=address", { scroll: false })
                    }}
                    className="text-[12px] font-bold uppercase tracking-[0.05em] text-neutral-950 hover:text-neutral-500 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 pb-10">
              <button 
                onClick={() => {
                  setIsDrawerOpen(false)
                  router.push(pathname + "?step=address", { scroll: false })
                }}
                className="w-full py-4 border border-black bg-white text-[12px] font-bold uppercase tracking-[0.05em] text-black hover:bg-neutral-50 transition-colors"
              >
                Add Another Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Shipping
