import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import { BacoolaRazorpayService } from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [BacoolaRazorpayService],
})
