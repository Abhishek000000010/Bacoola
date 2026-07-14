"use client"

import { useActionState, useState } from "react"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
)

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signup, null)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div
      className="w-full flex flex-col items-center animate-fade-in"
      data-testid="register-page"
    >
      <h1 className="text-lg font-semibold tracking-[0.1em] uppercase text-black mb-8">
        Create your account
      </h1>

      {message?.state === "verification_required" && (
        <div
          className="w-full mb-6 text-center text-xs font-medium text-neutral-600 bg-neutral-50 border border-neutral-200 p-4"
          data-testid="register-verification-message"
        >
          We sent a verification link to <strong>{message.email}</strong>.
          Please check your inbox to verify your email, then sign in.
        </div>
      )}

      <form className="w-full flex flex-col gap-y-6" action={formAction}>
        {/* First Name Input */}
        <div className="w-full">
          <input
            type="text"
            name="first_name"
            required
            autoComplete="given-name"
            placeholder="First name"
            className="w-full h-[52px] px-4 border border-neutral-300 focus:border-black transition-colors focus:ring-0 focus:outline-none rounded-none text-sm placeholder-neutral-400"
            data-testid="first-name-input"
          />
        </div>

        {/* Last Name Input */}
        <div className="w-full">
          <input
            type="text"
            name="last_name"
            required
            autoComplete="family-name"
            placeholder="Last name"
            className="w-full h-[52px] px-4 border border-neutral-300 focus:border-black transition-colors focus:ring-0 focus:outline-none rounded-none text-sm placeholder-neutral-400"
            data-testid="last-name-input"
          />
        </div>

        {/* Email Input */}
        <div className="w-full">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="E-mail"
            className="w-full h-[52px] px-4 border border-neutral-300 focus:border-black transition-colors focus:ring-0 focus:outline-none rounded-none text-sm placeholder-neutral-400"
            data-testid="email-input"
          />
        </div>

        {/* Password Input */}
        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            required
            autoComplete="new-password"
            placeholder="Password"
            className="w-full h-[52px] pl-4 pr-12 border border-neutral-300 focus:border-black transition-colors focus:ring-0 focus:outline-none rounded-none text-sm placeholder-neutral-400"
            data-testid="password-input"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black transition-colors focus:outline-none"
          >
            {showPassword ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        </div>

        {/* Phone Input with Country Code Selector */}
        <div className="flex border border-neutral-300 focus-within:border-black transition-colors rounded-none w-full h-[52px]">
          <select
            defaultValue="+91"
            className="h-full px-3 bg-transparent text-sm border-0 focus:ring-0 focus:outline-none cursor-pointer appearance-none relative text-black"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M7 9l3 3 3-3' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundPosition: 'right 0.25rem center',
              backgroundSize: '1.25em 1.25em',
              backgroundRepeat: 'no-repeat',
              paddingRight: '1.75rem'
            }}
          >
            <option value="+91">+91</option>
            <option value="+1">+1</option>
            <option value="+44">+44</option>
            <option value="+971">+971</option>
          </select>
          <div className="w-[1px] h-6 bg-neutral-200 self-center" />
          <input
            type="tel"
            name="phone"
            required
            autoComplete="tel"
            placeholder="Mobile"
            className="flex-1 h-full px-4 border-0 focus:ring-0 focus:outline-none text-sm placeholder-neutral-400"
            data-testid="phone-input"
          />
        </div>

        {/* Consent Checkbox */}
        <div className="flex items-start">
          <label className="flex items-start gap-x-3 cursor-pointer select-none text-[13px] text-black font-medium leading-relaxed">
            <input
              type="checkbox"
              className="w-4 h-4 rounded-none border-neutral-300 text-black focus:ring-0 focus:ring-offset-0 accent-black cursor-pointer mt-1"
            />
            <span>
              I would like 10% off on my next purchase, plus personalised offers, news and the latest trends
            </span>
          </label>
        </div>

        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="register-error"
        />

        {/* Action Button */}
        <div className="flex flex-col gap-y-3 mt-2">
          <button
            type="submit"
            className="w-full h-[52px] bg-black hover:bg-neutral-900 text-white font-semibold text-xs tracking-[0.15em] uppercase transition-colors rounded-none flex items-center justify-center"
            data-testid="register-button"
          >
            Create Account
          </button>
        </div>
      </form>

      {/* Switch View Link */}
      <span className="text-center text-xs mt-8 text-black">
        Already have an account?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline font-semibold hover:text-neutral-600 transition-colors"
          type="button"
        >
          Sign in
        </button>
      </span>

      {/* Terms Disclaimer */}
      <span className="text-center text-[11px] text-neutral-500 leading-normal max-w-sm mt-8">
        By creating an account and subscribing, you confirm that you have read our{" "}
        <LocalizedClientLink
          href="/content/privacy-policy"
          className="underline hover:text-black transition-colors"
        >
          Privacy Policy
        </LocalizedClientLink>{" "}
        and accept our{" "}
        <LocalizedClientLink
          href="/content/terms-of-use"
          className="underline hover:text-black transition-colors"
        >
          Terms & Conditions
        </LocalizedClientLink>
        .
      </span>
    </div>
  )
}

export default Register
