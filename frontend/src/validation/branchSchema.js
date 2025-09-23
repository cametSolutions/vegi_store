import { z } from "zod";

export const BranchSchema = z.object({
  branchName: z
    .string()
    .min(2, "Branch Name must be at least 2 characters"),
  companyId: z
    .string()
    .min(1, "Associated Company is required"), // usually store the company _id
  branchType: z.string().optional(), // e.g., Main, Regional, etc.
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Pincode must be 6 digits")
    .optional(),
  email: z
    .string()
    .email("Invalid email address")
    .optional(),
  mobile: z
    .string()
    .regex(/^\d{10}$/, "Mobile number must be 10 digits")
    .optional(),
  landline: z.string().optional(),
  gstNumber: z
    .string()
    .regex(/^\d{15}$/, "GST Number must be 15 digits")
    .optional(),
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format")
    .optional(),
  isActive: z.boolean().default(true),
status:z.string()
});



