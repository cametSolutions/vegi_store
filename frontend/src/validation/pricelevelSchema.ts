import { z } from "zod"
const objectIdRegex = /^[a-fA-F0-9]{24}$/
export const PricelevelSchema = z.object({
  pricelevelName: z
    .string()
    .min(1, "Pricelevel Name must be at least 1 character"),
  companyId: z.string().regex(objectIdRegex, "Invalid Company Id"),
  branchId: z
    .array(z.string().regex(objectIdRegex, "Invalid Branch id"))
    .min(1, "At least one branch must be selected")
})
export type PricelevelFormData=z.infer<typeof PricelevelSchema>
