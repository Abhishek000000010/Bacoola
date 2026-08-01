import { Label } from "@modules/common/components/ui"
import React, { useEffect, useImperativeHandle, useState } from "react"

import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"

type InputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  topLabel?: string
  wrapperClassName?: string
  inputClassName?: string
  labelClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type,
      name,
      label,
      errors,
      touched: _touched,
      required,
      topLabel,
      wrapperClassName,
      inputClassName,
      labelClassName,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [inputType, setInputType] = useState(type)

    useEffect(() => {
      if (type === "password" && showPassword) {
        setInputType("text")
      }

      if (type === "password" && !showPassword) {
        setInputType("password")
      }
    }, [type, showPassword])

    useImperativeHandle(ref, () => inputRef.current!)

    return (
      <div className={`flex flex-col w-full ${wrapperClassName ?? ""}`}>
        {topLabel && (
          <Label className="mb-2 txt-compact-medium-plus">{topLabel}</Label>
        )}
        <div className="flex relative z-0 w-full txt-compact-medium">
          <input
            type={inputType}
            name={name}
            placeholder=" "
            required={required}
            className={
              `peer block w-full h-12 px-4 pt-[22px] pb-[6px] text-[12px] lg:text-[14px] leading-none bg-transparent border appearance-none focus:outline-none focus:ring-0 focus:border-neutral-950 border-neutral-300 rounded-none transition-colors ` +
              `${
                errors && name in errors
                  ? "border-rose-500 focus:border-rose-500"
                  : ""
              } ${inputClassName ?? ""}`
            }
            {...props}
            ref={inputRef}
          />
          <label
            htmlFor={name}
            onClick={() => inputRef.current?.focus()}
            // Floats by shrinking the type and moving straight up: scaling from
            // an origin would drag the label sideways as well. The opt-out keeps
            // the global `input:focus ~ label` rules from overriding both.
            data-no-global-float
            className={
              `absolute left-4 top-[7px] z-10 text-[12px] lg:text-[14px] leading-none text-black transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[12px] lg:text-[14px] peer-focus:top-[7px] peer-focus:translate-y-0 peer-focus:text-[12px] lg:text-[14px] cursor-text ` +
              `${labelClassName ?? ""}`
            }
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-ui-fg-subtle px-4 focus:outline-none transition-all duration-150 outline-none focus:text-ui-fg-base absolute right-0 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input
