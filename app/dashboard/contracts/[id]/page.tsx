import { getContractById, getContractActivities, changeContractStatus } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ContractDetailPage({ params }: { params: { id: string } }) {
  const contract = await getContractById(params.id);
  if (!contract) {
    return <div className="text-destructive">Contract not found or inaccessible.</div>;
  }

  const activities = await getContractActivities(contract.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{contract.title}</h1>
        <div>
          <Badge>{contract.status}</Badge>
          <Button asChild className="ml-4" variant="outline">
            <Link href={`/dashboard/contracts/${contract.id}/edit`}>Edit</Link>
          </Button>
        </div>
      </div>
      <div className="mb-4 text-muted-foreground">
        <span className="mr-4 font-mono">
          Last updated {new Date(contract.updatedAt).toLocaleString()}
        </span>
        <Badge variant={contract.generatedByAI ? "default" : "secondary"}>
          {contract.generatedByAI ? "AI Generated" : "Manual"}
        </Badge>
      </div>

      <section className="prose bg-muted/60 rounded-xl p-6 mb-10">
        <pre className="whitespace-pre-wrap bg-transparent rounded-none border-none font-mono text-base leading-relaxed">
          {contract.content}
        </pre>
      </section>

      <form
        className="flex items-center gap-2"
        action={async (formData: FormData) => {
          "use server";
          const status = formData.get("status") as string;
          await changeContractStatus(contract.id, status as any);
        }}
      >
        <label htmlFor="status" className="mr-2 font-medium">
          Update status:
        </label>
        <select
          defaultValue={contract.status}
          name="status"
          id="status"
          className="border rounded px-2 py-1"
        >
          <option value="draft">Draft</option>
          <option value="pending_signature">Pending Signature</option>
          <option value="signed">Signed</option>
          <option value="archived">Archived</option>
        </select>
        <Button type="submit" size="sm">
          Save Status
        </Button>
      </form>

      <h2 className="text-xl font-semibold mt-8 mb-2">Activity Log</h2>
      <ul className="divide-y border rounded-lg bg-muted/50">
        {activities.length === 0 && <li className="p-4">No activity yet.</li>}
        {activities.map((act) => (
          <li key={act.id} className="p-3">
            <span className="font-semibold">{act.action.replace("_", " ")}</span> &mdash;{" "}
            <span>
              {new Date(act.createdAt).toLocaleString()}
            </span>
            {act.details && (
              <span className="ml-4 text-muted-foreground text-xs">
                {JSON.stringify(act.details)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}