import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { useActionState, useState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
)

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div
      className="w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <h1 className="text-lg font-semibold tracking-[0.1em] uppercase text-black mb-8">
        Sign in
      </h1>

      {message?.state === "verification_required" && (
        <div
          className="w-full mb-6 text-center text-xs font-medium text-neutral-600 bg-neutral-50 border border-neutral-200 p-4"
          data-testid="login-verification-message"
        >
          We sent a verification link to <strong>{message.email}</strong>.
          Please verify your email, then sign in.
        </div>
      )}

      <form className="w-full flex flex-col gap-y-6" action={formAction}>
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
            autoComplete="current-password"
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

        {/* Stay Signed In Checkbox */}
        <div className="flex items-center">
          <label className="flex items-center gap-x-3 cursor-pointer select-none text-[13px] text-black font-medium tracking-wide">
            <input
              type="checkbox"
              className="w-4 h-4 rounded-none border-neutral-300 text-black focus:ring-0 focus:ring-offset-0 accent-black cursor-pointer"
            />
            <span>Stay signed in</span>
          </label>
        </div>

        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="login-error-message"
        />

        {/* Action Buttons */}
        <div className="flex flex-col gap-y-3 mt-2">
          <button
            type="submit"
            className="w-full h-[52px] border border-black bg-black text-white hover:bg-white hover:text-black font-semibold text-xs tracking-[0.15em] uppercase transition-colors rounded-none flex items-center justify-center"
            data-testid="sign-in-button"
          >
            Sign in
          </button>
          
          <button
            type="button"
            onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
            className="w-full h-[52px] bg-white border border-black hover:bg-neutral-50 text-black font-semibold text-xs tracking-[0.15em] uppercase transition-colors rounded-none flex items-center justify-center"
            data-testid="register-button"
          >
            Create Account
          </button>
        </div>
      </form>

      <a
        href="#"
        className="text-[11px] font-semibold tracking-[0.12em] text-neutral-500 hover:text-black uppercase mt-8 transition-colors"
      >
        Forgotten your password?
      </a>
    </div>
  )
}

export default Login
