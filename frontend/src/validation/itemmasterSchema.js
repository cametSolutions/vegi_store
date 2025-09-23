import { z } from "zod"
export const ItemSchema = z.object({
  itemName: z.string().min(2, "Item name must be atleast 2 character"),
  companyId: z.string().min(1, "Associated company is required"),
  branchIds: z.array(z.string()).min(1, "At least one branch must be selected"),
  itemCode: z.string().min(1, "itemcode must be atleast 1 digit"),
  unit: z.string().min(1, "unit is required")
})
