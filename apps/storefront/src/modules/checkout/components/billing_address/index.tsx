import { HttpTypes } from "@medusajs/types"
import Input from "@modules/common/components/input"
import React, { useState } from "react"
import CountrySelect from "../country-select"
import { State, City } from "country-state-city"
import Select from "react-select"

const BillingAddress = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    "billing_address.first_name": cart?.billing_address?.first_name || "",
    "billing_address.last_name": cart?.billing_address?.last_name || "",
    "billing_address.address_1": cart?.billing_address?.address_1 || "",
    "billing_address.company": cart?.billing_address?.company || "",
    "billing_address.postal_code": cart?.billing_address?.postal_code || "",
    "billing_address.city": cart?.billing_address?.city || "",
    "billing_address.country_code": cart?.billing_address?.country_code || "",
    "billing_address.province": cart?.billing_address?.province || "",
    "billing_address.phone": cart?.billing_address?.phone || "",
  })

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-y-6">
        <Input
          label="First name"
          name="billing_address.first_name"
          autoComplete="given-name"
          value={formData["billing_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="billing-first-name-input"
        />
        <Input
          label="Last name"
          name="billing_address.last_name"
          autoComplete="family-name"
          value={formData["billing_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="billing-last-name-input"
        />
        <Input
          label="Address"
          name="billing_address.address_1"
          autoComplete="address-line1"
          value={formData["billing_address.address_1"]}
          onChange={handleChange}
          required
          data-testid="billing-address-input"
        />
        <Input
          label="Company"
          name="billing_address.company"
          value={formData["billing_address.company"]}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="billing-company-input"
        />
        <Input
          label="Postal code"
          name="billing_address.postal_code"
          autoComplete="postal-code"
          value={formData["billing_address.postal_code"]}
          onChange={handleChange}
          required
          data-testid="billing-postal-input"
        />
        <CountrySelect
          name="billing_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["billing_address.country_code"]}
          onChange={handleChange}
          required
          data-testid="billing-country-select"
        />
        <div className="flex flex-col gap-2">
          <label className="text-ui-fg-base text-xs">State / Province</label>
          <Select
            options={State.getStatesOfCountry(formData["billing_address.country_code"]?.toUpperCase()).map(s => ({ value: s.name, label: s.name, isoCode: s.isoCode }))}
            value={{ value: formData["billing_address.province"], label: formData["billing_address.province"] || "Select State" }}
            onChange={(selectedOption: any) => {
              setFormData({
                ...formData,
                "billing_address.province": selectedOption.value,
                "billing_address.city": "" // Reset city when state changes
              })
            }}
            isDisabled={!formData["billing_address.country_code"]}
            placeholder="Search State"
            className="text-sm"
            styles={{ control: (base) => ({ ...base, minHeight: '40px', borderRadius: '8px' }) }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-ui-fg-base text-xs">City</label>
          <Select
            options={
              formData["billing_address.province"] 
                ? City.getCitiesOfState(
                    formData["billing_address.country_code"]?.toUpperCase(), 
                    State.getStatesOfCountry(formData["billing_address.country_code"]?.toUpperCase()).find(s => s.name === formData["billing_address.province"])?.isoCode || ""
                  ).map(c => ({ value: c.name, label: c.name }))
                : []
            }
            value={{ value: formData["billing_address.city"], label: formData["billing_address.city"] || "Select City" }}
            onChange={(selectedOption: any) => {
              handleChange({ target: { name: "billing_address.city", value: selectedOption.value } } as any)
            }}
            isDisabled={!formData["billing_address.province"]}
            placeholder="Search City"
            className="text-sm"
            styles={{ control: (base) => ({ ...base, minHeight: '40px', borderRadius: '8px' }) }}
          />
        </div>
        {/* Hidden inputs so the react-select State/City values reach FormData
            (same fix as the shipping address form). */}
        <input
          type="hidden"
          name="billing_address.province"
          value={formData["billing_address.province"] || ""}
        />
        <input
          type="hidden"
          name="billing_address.city"
          value={formData["billing_address.city"] || ""}
        />
        <Input
          label="Phone"
          name="billing_address.phone"
          autoComplete="tel"
          value={formData["billing_address.phone"]}
          onChange={handleChange}
          data-testid="billing-phone-input"
        />
      </div>
    </>
  )
}

export default BillingAddress
