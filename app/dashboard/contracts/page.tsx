import { getContracts } from "./actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const contracts = await getContracts();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Contracts</h1>
        <Button asChild>
          <Link href="/dashboard/contracts/new">+ Generate Contract</Link>
        </Button>
      </div>
      {contracts.length === 0 ? (
        <div className="rounded-lg bg-muted/60 p-8 text-center text-muted-foreground">
          <div className="mb-2 text-lg">
            No contracts yet—generate your first contract with AI!
          </div>
          <Button asChild>
            <Link href="/dashboard/contracts/new">Generate with AI</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2">Title</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Last Updated</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id} className="border-t align-top">
                  <td className="p-2">
                    <Link
                      href={`/dashboard/contracts/${contract.id}`}
                      className="font-medium underline"
                    >
                      {contract.title}
                    </Link>
                  </td>
                  <td className="p-2">{contract.contractType}</td>
                  <td className="p-2">
                    <Badge variant={contract.status === "signed" ? "default" : "outline"}>
                      {contract.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="p-2">
                    {new Date(contract.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-2">
                    <Link href={`/dashboard/contracts/${contract.id}`} className="mr-2 underline">
                      View
                    </Link>
                    <Link href={`/dashboard/contracts/${contract.id}/edit`} className="underline">
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