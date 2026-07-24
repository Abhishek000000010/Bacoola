import { Disclosure } from "@headlessui/react"
import { Badge, Button, clx } from "@modules/common/components/ui"
import { useEffect } from "react"

import useToggleState from "@lib/hooks/use-toggle-state"
import { useFormStatus } from "react-dom"

type AccountInfoProps = {
  label: string
  currentInfo: string | React.ReactNode
  isSuccess?: boolean
  isError?: boolean
  errorMessage?: string
  clearState: () => void
  children?: React.ReactNode
  'data-testid'?: string
}

const AccountInfo = ({
  label,
  currentInfo,
  isSuccess,
  isError,
  clearState,
  errorMessage = "An error occurred, please try again",
  children,
  'data-testid': dataTestid
}: AccountInfoProps) => {
  const { state, close, toggle } = useToggleState()

  const { pending } = useFormStatus()

  const handleToggle = () => {
    if (!state) {
      // Dispatch event to close all other open sections
      window.dispatchEvent(new CustomEvent('close-account-info', { detail: label }))
    }
    clearState()
    setTimeout(() => toggle(), 100)
  }

  useEffect(() => {
    const handleCloseOthers = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail !== label && state) {
        close()
      }
    }
    window.addEventListener('close-account-info', handleCloseOthers)
    return () => window.removeEventListener('close-account-info', handleCloseOthers)
  }, [state, label, close])

  useEffect(() => {
    if (isSuccess) {
      close()
    }
  }, [isSuccess, close])

  return (
    <div className="w-full mb-[36px]" data-testid={dataTestid}>
      <div className="grid w-full grid-cols-[minmax(0,1fr)_56px] items-start gap-x-4">
        <div className="flex flex-col items-start">
          <span className="text-[14px] font-semibold leading-[1.3] text-[#111111]">
            {label}
          </span>
          {typeof currentInfo === "string" ? (
            <span
              className="text-[14px] font-normal leading-[1.6] mt-[2px] text-[#111111]"
              data-testid="current-info"
            >
              {currentInfo}
            </span>
          ) : (
            currentInfo
          )}
        </div>
        <div className="flex justify-start pt-0">
          <button
            onClick={handleToggle}
            type={state ? "reset" : "button"}
            className="text-[14px] font-semibold uppercase underline underline-offset-2 text-[#111111] hover:text-[#555555] transition-colors focus:outline-none"
            data-testid="edit-button"
            data-active={state}
          >
            {state
              ? "CANCEL"
              : typeof currentInfo === "string" &&
                (currentInfo.includes("?") || currentInfo === "")
              ? "ADD"
              : "EDIT"}
          </button>
        </div>
      </div>

      {/* Success state */}
      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
            {
              "max-h-[1000px] opacity-100": isSuccess,
              "max-h-0 opacity-0": !isSuccess,
            }
          )}
          data-testid="success-message"
        >
          <Badge className="p-2 my-4" color="green">
            <span>{label} updated succesfully</span>
          </Badge>
        </Disclosure.Panel>
      </Disclosure>

      {/* Error state  */}
      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
            {
              "max-h-[1000px] opacity-100": isError,
              "max-h-0 opacity-0": !isError,
            }
          )}
          data-testid="error-message"
        >
          <Badge className="p-2 my-4" color="red">
            <span>{errorMessage}</span>
          </Badge>
        </Disclosure.Panel>
      </Disclosure>

      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "grid transition-all duration-300 ease-in-out",
            {
              "grid-rows-[1fr] opacity-100 mt-4": state,
              "grid-rows-[0fr] opacity-0 mt-0": !state,
            }
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-y-4 py-1">
              <div>{children}</div>
              <div 
                className={clx(
                  "flex flex-col w-full mt-4 transition-opacity duration-300 delay-100",
                  {
                    "opacity-100": state,
                    "opacity-0": !state
                  }
                )}
              >
                <Button
                  isLoading={pending}
                  className="w-full h-[48px] tracking-wide transition-colors rounded-none"
                  type="submit"
                  data-testid="save-button"
                >
                  SAVE
                </Button>
                
                <p className="mt-4 text-[12px] text-neutral-500">
                  By saving your details you confirm you have read the <span className="font-bold text-neutral-950">Privacy Policy</span>.
                </p>
              </div>
            </div>
          </div>
        </Disclosure.Panel>
      </Disclosure>
    </div>
  )
}

export default AccountInfo
