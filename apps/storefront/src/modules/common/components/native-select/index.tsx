import { ChevronUpDown } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import {
  SelectHTMLAttributes,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

export type NativeSelectProps = {
  placeholder?: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  wrapperClassName?: string
  selectClassName?: string
} & SelectHTMLAttributes<HTMLSelectElement>

const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  (
    {
      placeholder = "Select...",
      defaultValue,
      className,
      children,
      wrapperClassName,
      selectClassName,
      ...props
    },
    ref
  ) => {
    const innerRef = useRef<HTMLSelectElement>(null)
    const [isPlaceholder, setIsPlaceholder] = useState(false)

    useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
      ref,
      () => innerRef.current
    )

    useEffect(() => {
      if (innerRef.current && innerRef.current.value === "") {
        setIsPlaceholder(true)
      } else {
        setIsPlaceholder(false)
      }
    }, [innerRef.current?.value])

    return (
      <div className={wrapperClassName}>
        <div
          onFocus={() => innerRef.current?.focus()}
          onBlur={() => innerRef.current?.blur()}
          className={clx(
            "relative flex h-16 items-center border border-neutral-300 bg-white text-neutral-950 transition-colors hover:border-neutral-400 focus-within:border-black",
            className,
            {
              "text-neutral-400": isPlaceholder,
            }
          )}
        >
          <select
            ref={innerRef}
            defaultValue={defaultValue}
            {...props}
            className={clx(
              "h-full w-full appearance-none bg-transparent border-none px-4 pb-3 pt-6 text-[17px] font-normal outline-none",
              selectClassName
            )}
          >
            <option disabled value="">
              {placeholder}
            </option>
            {children}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neutral-700">
            <ChevronUpDown />
          </span>
        </div>
      </div>
    )
  }
)

NativeSelect.displayName = "NativeSelect"

export default NativeSelect
