import { z } from "zod";

export const clientInputSchema = z.object({
  name: z.string().min(2).max(120),
  contactEmail: z.string().email(),
  company: z.string().optional(),
  notes: z.string().optional(),
});