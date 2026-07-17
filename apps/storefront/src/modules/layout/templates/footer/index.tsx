import React from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Simple SVG Icons for Social Links (monochrome)
const InstagramIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
)

const FacebookIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const PinterestIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.965 1.406-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.622 0 11.988-5.367 11.988-11.987C24.012 5.367 18.643 0 12.017 0z" />
  </svg>
)

const LinkedinIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
  </svg>
)

export default function Footer() {
  return (
    <footer className="border-t border-neutral-100 bg-white w-full text-neutral-800 font-sans tracking-wide">
      {/* 4-Column Desktop Layout */}
      <div className="w-full px-8 small:px-12 max-w-[1550px] mx-auto py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8">
        
        {/* Column 1: Brand & Logo */}
        <div className="flex flex-col items-start gap-y-4">
          <LocalizedClientLink
            href="/"
            className="text-2xl font-bold tracking-[0.25em] text-[#111111] uppercase select-none"
          >
            Bacoola
          </LocalizedClientLink>
          <p className="text-xs text-neutral-400 tracking-wide leading-relaxed max-w-[250px]">
            Modern essentials designed with timeless elegance and premium craftsmanship.
          </p>
        </div>

        {/* Column 2: Shop links */}
        <div className="flex flex-col items-start gap-y-4 text-xs font-semibold uppercase tracking-wider text-[#111111]">
          <span className="text-[13px] font-bold text-[#111111] tracking-widest">Shop</span>
          <ul className="flex flex-col gap-y-2.5 font-normal text-neutral-500 lowercase first-letter:uppercase">
            <li>
              <LocalizedClientLink href="/categories/women" className="hover:text-black transition-colors duration-200 uppercase tracking-wider text-[11px] font-semibold">
                Women
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink href="/categories/men" className="hover:text-black transition-colors duration-200 uppercase tracking-wider text-[11px] font-semibold">
                Men
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink href="/categories/teen" className="hover:text-black transition-colors duration-200 uppercase tracking-wider text-[11px] font-semibold">
                Teen
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink href="/categories/kids" className="hover:text-black transition-colors duration-200 uppercase tracking-wider text-[11px] font-semibold">
                Kids
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink href="/store" className="hover:text-black transition-colors duration-200 uppercase tracking-wider text-[11px] font-semibold">
                New Arrivals
              </LocalizedClientLink>
            </li>
          </ul>
        </div>

        {/* Column 3: Customer Care */}
        <div className="flex flex-col items-start gap-y-4 text-xs font-semibold uppercase tracking-wider text-[#111111]">
          <span className="text-[13px] font-bold text-[#111111] tracking-widest">Customer Care</span>
          <ul className="flex flex-col gap-y-2.5 font-normal text-neutral-500 lowercase first-letter:uppercase">
            <li>
              <LocalizedClientLink href="#" className="hover:text-black transition-colors duration-200 uppercase tracking-wider text-[11px] font-semibold">
                Contact
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink href="#" className="hover:text-black transition-colors duration-200 uppercase tracking-wider text-[11px] font-semibold">
                FAQs
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink href="#" className="hover:text-black transition-colors duration-200 uppercase tracking-wider text-[11px] font-semibold">
                Shipping
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink href="#" className="hover:text-black transition-colors duration-200 uppercase tracking-wider text-[11px] font-semibold">
                Returns
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink href="#" className="hover:text-black transition-colors duration-200 uppercase tracking-wider text-[11px] font-semibold">
                Size Guide
              </LocalizedClientLink>
            </li>
          </ul>
        </div>

        {/* Column 4: Company */}
        <div className="flex flex-col items-start gap-y-4 text-xs font-semibold uppercase tracking-wider text-[#111111]">
          <span className="text-[13px] font-bold text-[#111111] tracking-widest">Company</span>
          <ul className="flex flex-col gap-y-2.5 font-normal text-neutral-500 lowercase first-letter:uppercase">
            <li>
              <LocalizedClientLink href="#" className="hover:text-black transition-colors duration-200 uppercase tracking-wider text-[11px] font-semibold">
                About
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink href="#" className="hover:text-black transition-colors duration-200 uppercase tracking-wider text-[11px] font-semibold">
                Careers
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink href="#" className="hover:text-black transition-colors duration-200 uppercase tracking-wider text-[11px] font-semibold">
                Sustainability
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink href="#" className="hover:text-black transition-colors duration-200 uppercase tracking-wider text-[11px] font-semibold">
                Privacy Policy
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink href="#" className="hover:text-black transition-colors duration-200 uppercase tracking-wider text-[11px] font-semibold">
                Stores
              </LocalizedClientLink>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="w-full border-t border-neutral-100 py-8 px-8 small:px-12 max-w-[1550px] mx-auto flex flex-col md:flex-row items-center justify-between gap-y-6 text-xs text-neutral-400">
        
        {/* Left: Copyright */}
        <div className="order-3 md:order-1 select-none font-semibold tracking-wide">
          © {new Date().getFullYear()} BACOOLA. ALL RIGHTS RESERVED.
        </div>

        {/* Center: Minimal Monochrome Payment Indicators */}
        <div className="order-1 md:order-2 flex items-center gap-x-4 text-[10px] font-semibold tracking-widest select-none text-neutral-300">
          <span>VISA</span>
          <span>MC</span>
          <span>AMEX</span>
          <span>DISCOVER</span>
          <span>STRIPE</span>
        </div>

        {/* Right: Monochrome Social Links */}
        <div className="order-2 md:order-3 flex items-center gap-x-6 text-[#111111]">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#555555] transition-colors duration-200"
            aria-label="Follow us on Instagram"
          >
            <InstagramIcon />
          </a>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#555555] transition-colors duration-200"
            aria-label="Follow us on Facebook"
          >
            <FacebookIcon />
          </a>
          <a
            href="https://pinterest.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#555555] transition-colors duration-200"
            aria-label="Follow us on Pinterest"
          >
            <PinterestIcon />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#555555] transition-colors duration-200"
            aria-label="Follow us on LinkedIn"
          >
            <LinkedinIcon />
          </a>
        </div>
      </div>
    </footer>
  )
}
