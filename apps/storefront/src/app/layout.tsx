import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import NavigationLoader from "@modules/common/components/navigation-loader"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body>
        <NavigationLoader />
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
