import { Checkbox, Label } from "@modules/common/components/ui"
import React from "react"

type CheckboxProps = {
  checked?: boolean
  onChange?: () => void
  label: string
  name?: string
  'data-testid'?: string
}

const CheckboxWithLabel: React.FC<CheckboxProps> = ({
  checked = true,
  onChange,
  label,
  name,
  'data-testid': dataTestId
}) => {
  return (
    <div className="flex items-center gap-x-3">
      <Checkbox
        className="h-[18px] w-[18px] rounded-none border-neutral-400 text-black focus:ring-0 focus:ring-offset-0"
        id="checkbox"
        role="checkbox"
        checked={checked}
        readOnly
        aria-checked={checked}
        onClick={onChange}
        name={name}
        data-testid={dataTestId}
      />
      <Label
        htmlFor="checkbox"
        className="!transform-none text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-900"
      >
        {label}
      </Label>
    </div>
  )
}

export default CheckboxWithLabel
