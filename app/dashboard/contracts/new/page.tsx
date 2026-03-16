"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateContractSchema, generateAIDraftContract, createContract } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

const formSchema = generateContractSchema.extend({
  title: z.string().min(3).max(120),
  clientId: z.string().min(1, "Client is required"),
});

export default function NewContractPage() {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAIResult] = useState<string | null>(null);
  const [aiError, setAIError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contractType: "",
      parties: "",
      variables: "",
      prompt: "",
      title: "",
      clientId: "",
    },
  });

  async function handleGenerate(data: z.infer<typeof formSchema>) {
    setAiError(null);
    setAIResult(null);
    setAiLoading(true);
    try {
      const res = await generateAIDraftContract({
        contractType: data.contractType,
        parties: data.parties,
        variables: data.variables,
        prompt: data.prompt,
      });
      if (res.error) {
        setAIError(res.error);
      } else {
        setAIResult(res.contractText);
      }
    } catch (err: any) {
      setAIError(err?.message || "AI generation failed.");
    }
    setAiLoading(false);
  }

  async function handleSaveContract(data: z.infer<typeof formSchema>) {
    const input = {
      clientId: data.clientId,
      title: data.title,
      contractType: data.contractType,
      content: aiResult || "",
      status: "draft",
      generatedByAI: true,
      aiPrompt: data.prompt ?? "",
    };
    const res = await createContract(input);
    if (res.success && res.id) {
      router.push(`/dashboard/contracts/${res.id}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-3">Generate contract with AI</h1>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(handleGenerate)}
        autoComplete="off"
      >
        <div>
          <label className="block text-sm mb-1 font-medium">
            Contract type
          </label>
          <Input
            {...form.register("contractType")}
            placeholder="Consulting Agreement"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1 font-medium">
            Parties
          </label>
          <Input
            {...form.register("parties")}
            placeholder="E.g. John Doe and Acme Corp"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1 font-medium">
            Key variables/terms
          </label>
          <Input
            {...form.register("variables")}
            placeholder="e.g. Scope of work, fees, deliverables, duration"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1 font-medium">
            Additional instructions (optional)
          </label>
          <Textarea {...form.register("prompt")} placeholder="Any special clauses or instructions?" />
        </div>

        <Button type="submit" className="w-full" disabled={aiLoading}>
          {aiLoading ? "Generating..." : "Generate AI Draft"}
        </Button>
      </form>
      {aiError && (
        <div className="text-red-500 border border-destructive rounded-md bg-destructive/10 p-3 mt-6">
          {aiError}
        </div>
      )}

      {aiResult && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">
            AI-Generated Contract
            <Badge className="ml-2">DRAFT</Badge>
          </h2>
          <Textarea
            value={aiResult}
            rows={16}
            readOnly
            className="bg-card border shadow-inner text-muted-foreground"
            style={{ fontSize: "1rem" }}
          />
          <div className="mt-5 flex justify-end">
            <form
              onSubmit={form.handleSubmit(handleSaveContract)}
              className="w-full flex gap-2"
            >
              <Input
                {...form.register("title")}
                placeholder="Contract Title"
                required
                className="flex-1"
              />
              <Input
                {...form.register("clientId")}
                placeholder="Client ID"
                required
                className="w-40"
              />
              <Button className="w-40" disabled={!aiResult}>
                Save Contract
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}