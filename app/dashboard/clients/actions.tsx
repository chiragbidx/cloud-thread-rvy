"use server";

import { z } from "zod";
import { db } from "@/lib/db/client";
import { clients } from "@/lib/db/schema";
import { getAuthSession } from "@/lib/auth/session";
import { v4 as uuidv4 } from "uuid";
import { eq, and, desc, ilike } from "drizzle-orm";

export const clientInputSchema = z.object({
  name: z.string().min(2).max(120),
  contactEmail: z.string().email(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

export async function createClient(input: z.infer<typeof clientInputSchema>) {
  const session = await getAuthSession();
  if (!session) throw new Error("Unauthorized");

  const validated = clientInputSchema.safeParse(input);
  if (!validated.success) return { error: validated.error.message };

  const clientId = uuidv4();
  await db.insert(clients).values({
    id: clientId,
    name: validated.data.name,
    contactEmail: validated.data.contactEmail,
    company: validated.data.company,
    notes: validated.data.notes,
    teamId: session.teamId,
    createdAt: new Date(),
    updatedAt: new Date(),
    archivedAt: null,
  });

  return { success: true, id: clientId };
}

export async function updateClient(
  id: string,
  input: Partial<z.infer<typeof clientInputSchema>>
) {
  const session = await getAuthSession();
  if (!session) throw new Error("Unauthorized");
  // Only allow update of clients belonging to this team
  const existing = await db.query.clients.findFirst({
    where: and(eq(clients.id, id), eq(clients.teamId, session.teamId)),
  });
  if (!existing) return { error: "Not found" };

  await db
    .update(clients)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(clients.id, id), eq(clients.teamId, session.teamId)));
  return { success: true };
}

export async function archiveClient(id: string) {
  const session = await getAuthSession();
  if (!session) throw new Error("Unauthorized");
  const existing = await db.query.clients.findFirst({
    where: and(eq(clients.id, id), eq(clients.teamId, session.teamId)),
  });
  if (!existing) return { error: "Not found" };
  await db
    .update(clients)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(clients.id, id), eq(clients.teamId, session.teamId)));
  return { success: true };
}

export async function getClients({ search = "" } = {}) {
  const session = await getAuthSession();
  if (!session) throw new Error("Unauthorized");

  let whereClause = and(eq(clients.teamId, session.teamId), eq(clients.archivedAt, null));
  if (search) {
    whereClause = and(
      eq(clients.teamId, session.teamId),
      ilike(clients.name, `%${search}%`),
      eq(clients.archivedAt, null)
    );
  }

  const rows = await db
    .select()
    .from(clients)
    .where(whereClause)
    .orderBy(desc(clients.updatedAt));

  return rows;
}

export async function getClientById(id: string) {
  const session = await getAuthSession();
  if (!session) throw new Error("Unauthorized");

  const client = await db.query.clients.findFirst({
    where: and(eq(clients.id, id), eq(clients.teamId, session.teamId)),
  });
  return client;
}