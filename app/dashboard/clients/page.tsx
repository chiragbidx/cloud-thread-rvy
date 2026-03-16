import { getClients } from "./actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Button asChild>
          <Link href="/dashboard/clients/new">+ Add Client</Link>
        </Button>
      </div>
      {clients.length === 0 ? (
        <div className="rounded-lg bg-muted/60 p-8 text-center text-muted-foreground">
          No clients yet—add your first client to get started!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Company</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-t align-top">
                  <td className="p-2 font-medium">{client.name}</td>
                  <td className="p-2">{client.contactEmail}</td>
                  <td className="p-2">{client.company || "--"}</td>
                  <td className="p-2">
                    <Link href={`/dashboard/clients/${client.id}`} className="underline mr-2">
                      View
                    </Link>
                    <Link href={`/dashboard/clients/${client.id}/edit`} className="underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}