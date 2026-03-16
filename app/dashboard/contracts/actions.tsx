"use server";

import { z } from "zod";
import { db } from "@/lib/db/client";
import { contracts, contractActivities, contractStatus } from "@/lib/db/schema";
import { getAuthSession } from "@/lib/auth/session";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import { getOpenAIClient, DEFAULT_OPENAI_MODEL } from "@/lib/openai";

// SCHEMAS
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

export async function createContract(input: z.infer<typeof contractInputSchema>) {
  const session = await getAuthSession();
  if (!session) throw new Error("Unauthorized");

  const validated = contractInputSchema.safeParse(input);
  if (!validated.success) return { error: validated.error.message };

  const contractId = crypto.randomUUID();

  await db.insert(contracts).values({
    id: contractId,
    teamId: session.teamId,
    ...validated.data,
    createdAt: new Date(),
    updatedAt: new Date(),
    archivedAt: null,
  });

  await db.insert(contractActivities).values({
    contractId,
    teamId: session.teamId,
    userId: session.userId,
    action: "generated",
    details: {
      generatedByAI: validated.data.generatedByAI ?? false,
    },
    createdAt: new Date(),
  });

  return { success: true, id: contractId };
}

export async function updateContract(
  id: string,
  input: Partial<z.infer<typeof contractInputSchema>>
) {
  const session = await getAuthSession();
  if (!session) throw new Error("Unauthorized");

  // Only allow update of contracts belonging to this team
  const existing = await db.query.contracts.findFirst({
    where: and(eq(contracts.id, id), eq(contracts.teamId, session.teamId)),
  });
  if (!existing) return { error: "Not found" };

  await db
    .update(contracts)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(contracts.id, id), eq(contracts.teamId, session.teamId)));

  await db.insert(contractActivities).values({
    contractId: id,
    teamId: session.teamId,
    userId: session.userId,
    action: "edited",
    details: input,
    createdAt: new Date(),
  });

  return { success: true };
}

export async function changeContractStatus(
  id: string,
  status: typeof contractStatus[number]
) {
  const session = await getAuthSession();
  if (!session) throw new Error("Unauthorized");

  if (!contractStatus.includes(status)) {
    return { error: "Invalid status" };
  }

  const contract = await db.query.contracts.findFirst({
    where: and(eq(contracts.id, id), eq(contracts.teamId, session.teamId)),
  });
  if (!contract) return { error: "Not found" };

  await db
    .update(contracts)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(contracts.id, id), eq(contracts.teamId, session.teamId)));

  await db.insert(contractActivities).values({
    contractId: id,
    teamId: session.teamId,
    userId: session.userId,
    action: "status_changed",
    details: { from: contract.status, to: status },
    createdAt: new Date(),
  });

  return { success: true };
}

export async function archiveContract(id: string) {
  const session = await getAuthSession();
  if (!session) throw new Error("Unauthorized");
  const contract = await db.query.contracts.findFirst({
    where: and(eq(contracts.id, id), eq(contracts.teamId, session.teamId)),
  });
  if (!contract) return { error: "Not found" };

  await db
    .update(contracts)
    .set({ archivedAt: new Date(), status: "archived", updatedAt: new Date() })
    .where(and(eq(contracts.id, id), eq(contracts.teamId, session.teamId)));

  await db.insert(contractActivities).values({
    contractId: id,
    teamId: session.teamId,
    userId: session.userId,
    action: "archived",
    details: {},
    createdAt: new Date(),
  });

  return { success: true };
}

export async function getContracts({ search = "", status = "" } = {}) {
  const session = await getAuthSession();
  if (!session) throw new Error("Unauthorized");

  // Basic search by title/client, filter by status
  let whereClause = eq(contracts.teamId, session.teamId);
  if (search || status) {
    whereClause = and(
      eq(contracts.teamId, session.teamId),
      ...(search
        ? [
            or(
              ilike(contracts.title, `%${search}%`),
              ilike(contracts.contractType, `%${search}%`)
            ),
          ]
        : []),
      ...(status
        ? [
            eq(contracts.status, status as typeof contractStatus[number]),
          ]
        : [])
    );
  }

  const rows = await db
    .select()
    .from(contracts)
    .where(whereClause)
    .orderBy(desc(contracts.updatedAt));

  return rows;
}

export async function getContractById(id: string) {
  const session = await getAuthSession();
  if (!session) throw new Error("Unauthorized");

  const row = await db.query.contracts.findFirst({
    where: and(eq(contracts.id, id), eq(contracts.teamId, session.teamId)),
  });
  return row;
}

// ---- AI Generation ----
export async function generateAIDraftContract({
  contractType,
  parties,
  variables,
  prompt,
}: z.infer<typeof generateContractSchema>) {
  const session = await getAuthSession();
  if (!session) throw new Error("Unauthorized");

  const model = DEFAULT_OPENAI_MODEL;

  const systemPrompt = `You are a legal AI assistant tasked with drafting a legally sound "${contractType}" between the following parties: ${parties}. The following terms and key variables should be included: ${variables}.
${prompt ? "Additional instructions: " + prompt : ""}
Format with components: title, preamble, clauses, signature section. Do not include sample data beyond what is provided. Write in clear, professional English.`;

  const openai = getOpenAIClient();

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are a senior legal contract drafting assistant." },
        { role: "user", content: systemPrompt },
      ],
      max_tokens: 2200,
      temperature: 0.15,
    });
    const contractText = completion.choices[0]?.message?.content ?? "";
    return { contractText, model };
  } catch (err: any) {
    return { error: "AI contract generation failed: " + err?.message || "Unknown error" };
  }
}

export async function getContractActivities(contractId: string) {
  const session = await getAuthSession();
  if (!session) throw new Error("Unauthorized");
  return db
    .select()
    .from(contractActivities)
    .where(and(eq(contractActivities.contractId, contractId), eq(contractActivities.teamId, session.teamId)))
    .orderBy(desc(contractActivities.createdAt));
}