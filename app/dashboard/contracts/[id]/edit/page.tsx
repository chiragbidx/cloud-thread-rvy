"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { contractInputSchema, updateContract, getContractById } from "../../actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ContractEditPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [contract, setContract] = React.useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const data = await getContractById(params.id);
        if (!data) {
          setError("Contract not found or inaccessible.");
          setLoading(false);
          return;
        }
        setContract(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load contract.");
        setLoading(false);
      }
    })();
  }, [params.id]);

  const form = useForm<z.infer<typeof contractInputSchema>>({
    defaultValues: contract
      ? {
          title: contract.title,
          contractType: contract.contractType,
          content: contract.content,
          clientId: contract.clientId,
          status: contract.status,
        }
      : {},
  });

  useEffect(() => {
    if (contract) {
      form.reset({
        title: contract.title,
        contractType: contract.contractType,
        content: contract.content,
        clientId: contract.clientId,
        status: contract.status,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract]);

  const onSubmit = async (data: z.infer<typeof contractInputSchema>) => {
    setError(null);
    try {
      await updateContract(params.id, {
        title: data.title,
        contractType: data.contractType,
        content: data.content,
        clientId: data.clientId,
        status: data.status,
      });
      router.push(`/dashboard/contracts/${params.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to update contract.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-destructive">{error}</div>;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-3">Edit Contract</h1>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <label className="block text-sm mb-1 font-medium">Contract Title</label>
          <input className="w-full border rounded p-2" {...form.register("title")} required />
        </div>
        <div>
          <label className="block text-sm mb-1 font-medium">Type</label>
          <input className="w-full border rounded p-2" {...form.register("contractType")} required />
        </div>
        <div>
          <label className="block text-sm mb-1 font-medium">Client ID</label>
          <input className="w-full border rounded p-2" {...form.register("clientId")} required />
        </div>
        <div>
          <label className="block text-sm mb-1 font-medium">Status</label>
          <select className="w-full border rounded p-2" {...form.register("status")} required>
            <option value="draft">Draft</option>
            <option value="pending_signature">Pending Signature</option>
            <option value="signed">Signed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1 font-medium">Content</label>
          <textarea
            className="w-full border rounded p-2 min-h-[180px] font-mono"
            {...form.register("content")}
            required
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Save Changes</Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/contracts/${params.id}`)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}