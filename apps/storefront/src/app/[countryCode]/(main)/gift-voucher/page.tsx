import { Metadata } from "next"
import GiftVoucher from "@modules/gift-card/components/gift-voucher"

export const metadata: Metadata = {
  title: "Gift Voucher",
  description: "The perfect gift, that everyone can use! Valid online and in stores.",
}

export default function GiftVoucherPage() {
  return <GiftVoucher />
}
