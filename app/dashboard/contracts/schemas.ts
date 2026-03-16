import { z } from "zod";
import { contractStatus } from "@/lib/db/schema";

// SCHEMAS (now only used for type validation/import in actions.tsx)
export const contractInputSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  title: z.string().min(3).max(255),
  contractType: z.string().min(2).max(80),
  content: z.string().min(50),
  status: z.enum(contractStatus),
  generatedByAI: z.boolean().optional(),
  aiPrompt: z.string().optional(),
  aiModel: z.string().optional(),
});

export const generateContractSchema = z.object({
  contractType: z.string().min(3),
  parties: z.string().min(3),
  variables: z.string().min(3),
  prompt: z.string().optional(),
});