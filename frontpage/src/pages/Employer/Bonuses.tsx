import React, { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { getCompanyTax, getEmployees, giveBonus } from "../../lib/api";
import {
  ActionButton,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  PageShell,
  SectionCard,
  StatusBadge,
} from "../../components/dashboard/DashboardUI";

type EmployeeRecord = {
  id: number;
  name: string;
  use_custom_tax?: boolean;
  custom_tax_rate?: number | null;
};

export default function Bonuses() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [companyTaxRate, setCompanyTaxRate] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    loadBonusWorkspace();
  }, []);

  async function loadBonusWorkspace() {
    try {
      setLoading(true);
      setError("");
      const [employeeData, companyTax] = await Promise.all([getEmployees(), getCompanyTax()]);
      setEmployees(Array.isArray(employeeData) ? employeeData : []);
      setCompanyTaxRate(Number(companyTax?.default_tax_rate || 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bonus workspace.");
    } finally {
      setLoading(false);
    }
  }

  const selectedEmployeeRecord = useMemo(
    () => employees.find((emp) => String(emp.id) === selectedEmployee),
    [employees, selectedEmployee]
  );

  const previewRate = useMemo(() => {
    if (
      selectedEmployeeRecord?.use_custom_tax &&
      selectedEmployeeRecord?.custom_tax_rate !== null &&
      selectedEmployeeRecord?.custom_tax_rate !== undefined
    ) {
      return Number(selectedEmployeeRecord.custom_tax_rate);
    }
    return companyTaxRate;
  }, [companyTaxRate, selectedEmployeeRecord]);

  const grossAmount = Number(amount) || 0;
  const taxPreview = grossAmount > 0 ? (grossAmount * previewRate) / 100 : 0;
  const netPreview = grossAmount > 0 ? grossAmount - taxPreview : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitState("submitting");
      setSubmitMessage("");
      await giveBonus(Number(selectedEmployee), Number(amount), reason);
      setSubmitState("success");
      setSubmitMessage("Bonus applied successfully.");
      setSelectedEmployee("");
      setAmount("");
      setReason("");
    } catch (err) {
      setSubmitState("error");
      setSubmitMessage(err instanceof Error ? err.message : "Failed to apply bonus.");
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Bonuses"
        title="Bonus payout preparation"
        description="Allocate one-off employee bonuses with clear tax previewing, clean form feedback, and no fake payout history."
      />

      {loading ? <LoadingState label="Loading bonus workspace..." /> : null}
      {!loading && error ? <ErrorState description={error} onRetry={loadBonusWorkspace} /> : null}

      {!loading && !error ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SectionCard
            eyebrow="Create bonus"
            title="Bonus request form"
            description="Use available backend tax settings for previewing. Final tax treatment still comes from the backend save flow."
          >
            {employees.length === 0 ? (
              <EmptyState
                title="No employees available"
                description="Create employee records first so bonuses can be assigned to a valid payroll recipient."
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#08111d] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
                  required
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Bonus amount (gross)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#08111d] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
                  required
                />

                <input
                  type="text"
                  placeholder="Reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#08111d] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
                  required
                />

                <ActionButton type="submit" variant="primary" disabled={submitState === "submitting"}>
                  <Sparkles className="h-4 w-4" />
                  {submitState === "submitting" ? "Submitting..." : "Apply bonus"}
                </ActionButton>
              </form>
            )}
          </SectionCard>

          <SectionCard
            eyebrow="Preview"
            title="Tax-aware payout estimate"
            description="This preview is shown only from available company or employee tax data and is labeled as an estimate rather than a final payout."
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <StatusBadge tone="info">
                  {selectedEmployeeRecord?.use_custom_tax ? "employee custom tax" : "company default tax"}
                </StatusBadge>
                <StatusBadge tone="neutral">{previewRate.toFixed(2)}%</StatusBadge>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Gross bonus</p>
                  <p className="mt-3 text-2xl font-semibold text-white">Rs {grossAmount.toFixed(2)}</p>
                </div>
                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Estimated tax</p>
                  <p className="mt-3 text-2xl font-semibold text-white">Rs {taxPreview.toFixed(2)}</p>
                </div>
                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Estimated net</p>
                  <p className="mt-3 text-2xl font-semibold text-white">Rs {netPreview.toFixed(2)}</p>
                </div>
              </div>

              <div className="rounded-[1.45rem] border border-cyan-300/12 bg-cyan-500/8 px-4 py-4 text-sm leading-7 text-slate-300">
                Estimated using {selectedEmployeeRecord?.use_custom_tax ? "employee custom tax" : "company default tax"} at{" "}
                {previewRate.toFixed(2)}%. Final tax is calculated by the backend when the bonus is submitted.
              </div>

              {submitState !== "idle" ? (
                <div
                  className={`rounded-[1.45rem] border px-4 py-4 text-sm leading-7 ${
                    submitState === "success"
                      ? "border-emerald-300/18 bg-emerald-500/8 text-slate-200"
                      : submitState === "error"
                        ? "border-rose-300/18 bg-rose-500/8 text-slate-200"
                        : "border-white/10 bg-white/[0.03] text-slate-200"
                  }`}
                >
                  {submitMessage || (submitState === "submitting" ? "Submitting bonus..." : "")}
                </div>
              ) : null}

              <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                <p className="font-semibold text-white">Bonus history</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  A dedicated bonus-history list is not exposed by the current frontend API surface, so this page does not fabricate one.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      ) : null}
    </PageShell>
  );
}
