import { Metadata } from "next"
import ReturnsFAQ from "@modules/help/components/returns-faq"

export const metadata: Metadata = {
  title: "Returns and Help",
  description: "Get help with returns, exchanges, refunds, and order tracking.",
}

export default function ReturnsPage() {
  return <ReturnsFAQ />
}
