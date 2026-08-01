"use client"

import React, { useEffect, useRef, useState } from "react"
import { clx } from "@medusajs/ui"

type FadeInProps = {
  children: React.ReactNode
  className?: string
  delay?: number
  randomize?: boolean
}

export const FadeIn = ({ children, className, delay = 0, randomize = false }: FadeInProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [actualDelay, setActualDelay] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (randomize) {
      setActualDelay(Math.floor(Math.random() * 400))
    } else {
      setActualDelay(delay)
    }
    setIsMounted(true)
  }, [delay, randomize])

  useEffect(() => {
    if (!isMounted) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true)
          }, actualDelay)
          if (ref.current) {
            observer.unobserve(ref.current)
          }
        }
      },
      {
        rootMargin: "0px 0px -50px 0px",
        threshold: 0.1,
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [actualDelay, isMounted])

  return (
    <div
      ref={ref}
      className={clx(
        "transition-opacity duration-1000 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {children}
    </div>
  )
}
