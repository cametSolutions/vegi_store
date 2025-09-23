import { z } from "zod"
export const AccountmasterSchema = z.object({
  accountName: z.string().min(2, "Account name must be altleast 2 character"),
  accountType: z.string().min(1, "Select one account type"),
  // pricelevel:z.string().length(1,"select one price level"),
  pricelevel: z.string().refine((val) => val !== "", {
    message: "Select one price level"
  }),
  openingBalance: z.string().optional(),
  openingBalanceType: z.string().optional(),
  address: z.string().optional(),
  phoneNo: z.string().optional()
})
