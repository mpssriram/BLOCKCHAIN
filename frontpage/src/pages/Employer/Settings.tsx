import React, { useEffect, useState } from "react";
import {
  getBlockchainConfig,
  getCompanyTax,
  getEmployees,
  getTaxSlabs,
  updateCompanyTax,
  createTaxSlab,
  deleteTaxSlab,
  setEmployeeTax,
  getAuthRole,
} from "../../lib/api";
import { loginAndConnectContract } from "../../blockchain/wallet";
import { CORE_PAYROLL_ABI, HELA_CHAIN_CONFIG } from "../../blockchain/config";
import { ethers } from "ethers";
import { ActionButton, ErrorState, LoadingState, PageHeader, PageShell, SectionCard, StatusBadge } from "../../components/dashboard/DashboardUI";

type EmployeeRecord = {
  id: number;
  name: string;
  use_custom_tax?: boolean;
  custom_tax_rate?: number | null;
};

type TaxSlab = {
  id: number;
  min_income: number;
  max_income: number | null;
  tax_rate: number;
};

export default function Settings() {
  const authRole = getAuthRole();
  const isAdmin = authRole === "admin";

  const [companyTax, setCompanyTax] = useState(0);
  const [slabs, setSlabs] = useState<TaxSlab[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [contractAdmin, setContractAdmin] = useState<string | null>(null);
  const [contractEmployer, setContractEmployer] = useState<string | null>(null);
  const [newEmployer, setNewEmployer] = useState("");
  const [roleLoading, setRoleLoading] = useState(false);

  const [minIncome, setMinIncome] = useState("");
  const [maxIncome, setMaxIncome] = useState("");
  const [rate, setRate] = useState("");
  const [slabLoading, setSlabLoading] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [customRate, setCustomRate] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [employeeTaxError, setEmployeeTaxError] = useState("");
  const [employeeTaxLoading, setEmployeeTaxLoading] = useState(false);
  const [companyTaxLoading, setCompanyTaxLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadRoleConfig();
  }, []);

  useEffect(() => {
    if (!selectedEmployee) return;
    const match = employees.find((emp) => String(emp.id) === selectedEmployee);
    if (!match) return;
    setUseCustom(!!match.use_custom_tax);
    setCustomRate(
      match.custom_tax_rate !== null && match.custom_tax_rate !== undefined ? String(match.custom_tax_rate) : ""
    );
  }, [employees, selectedEmployee]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [tax, slabData, emp] = await Promise.all([getCompanyTax(), getTaxSlabs(), getEmployees()]);
      setCompanyTax(Number(tax.default_tax_rate));
      setSlabs(Array.isArray(slabData) ? slabData : []);
      setEmployees(Array.isArray(emp) ? emp : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }

  async function loadRoleConfig() {
    try {
      const cfg = await getBlockchainConfig();
      const addr = (cfg?.contract_address || "").trim();
      if (!addr) return;
      setContractAddress(addr);

      const provider = new ethers.JsonRpcProvider(HELA_CHAIN_CONFIG.rpcTarget);
      const contract = new ethers.Contract(addr, CORE_PAYROLL_ABI, provider);
      const [adminAddr, employerAddr] = await Promise.all([
        contract.admin?.().catch(() => null),
        contract.employer?.().catch(() => null),
      ]);

      setContractAdmin(adminAddr ? String(adminAddr) : null);
      setContractEmployer(employerAddr ? String(employerAddr) : null);
    } catch {
      setContractAdmin(null);
      setContractEmployer(null);
    }
  }

  async function handleCompanyTaxUpdate() {
    try {
      setCompanyTaxLoading(true);
      setFeedback("");
      await updateCompanyTax(companyTax);
      setFeedback("Company tax updated.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to update company tax.");
    } finally {
      setCompanyTaxLoading(false);
    }
  }

  async function handleAddSlab(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSlabLoading(true);
      await createTaxSlab(Number(minIncome), maxIncome ? Number(maxIncome) : null, Number(rate));
      setMinIncome("");
      setMaxIncome("");
      setRate("");
      await loadData();
      setFeedback("Tax slab added.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to add tax slab.");
    } finally {
      setSlabLoading(false);
    }
  }

  async function handleDeleteSlab(id: number) {
    try {
      await deleteTaxSlab(id);
      await loadData();
      setFeedback("Tax slab deleted.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to delete tax slab.");
    }
  }

  async function handleEmployeeTaxUpdate() {
    if (!selectedEmployee) {
      setEmployeeTaxError("Select an employee before saving custom tax settings.");
      return;
    }

    try {
      setEmployeeTaxLoading(true);
      setEmployeeTaxError("");
      await setEmployeeTax(Number(selectedEmployee), useCustom, customRate ? Number(customRate) : undefined);
      await loadData();
      setFeedback("Employee tax updated.");
    } catch (err) {
      setEmployeeTaxError(err instanceof Error ? err.message : "Failed to update employee tax.");
    } finally {
      setEmployeeTaxLoading(false);
    }
  }

  async function handleEmployerUpdate() {
    if (!isAdmin) {
      alert("Only admin can reassign the on-chain employer.");
      return;
    }
    if (!contractAddress) {
      alert("Contract not configured.");
      return;
    }
    const nextEmployer = newEmployer.trim();
    if (!nextEmployer || !nextEmployer.startsWith("0x")) {
      alert("Enter a valid employer wallet address.");
      return;
    }

    try {
      setRoleLoading(true);
      const { contract } = await loginAndConnectContract(contractAddress);
      const tx = await contract.setEmployer(nextEmployer);
      await tx.wait();
      setNewEmployer("");
      await loadRoleConfig();
      setFeedback("Employer wallet updated.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update employer wallet.");
    } finally {
      setRoleLoading(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Settings"
        title="Settings"
        description="Manage company tax defaults, progressive slabs, employee-specific tax overrides, and contract role visibility without changing backend behavior."
      />

      {loading ? <LoadingState label="Loading settings..." /> : null}
      {!loading && error ? <ErrorState description={error} onRetry={loadData} /> : null}

      {!loading && !error ? (
        <>
          {feedback ? (
            <div className="rounded-[1.45rem] border border-emerald-300/18 bg-emerald-500/8 px-5 py-4 text-sm leading-7 text-slate-200">
              {feedback}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <SectionCard
              eyebrow="Contract roles"
              title="On-chain role visibility"
              description="Admin controls employer reassignment and emergency recovery. Employer keeps day-to-day stream operations."
              actions={<StatusBadge tone={isAdmin ? "active" : "neutral"}>{authRole || "unknown role"}</StatusBadge>}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5 text-sm leading-7 text-slate-300">
                  <p><span className="font-medium text-white">Admin wallet:</span> {contractAdmin || "Not available"}</p>
                  <p className="mt-2"><span className="font-medium text-white">Employer wallet:</span> {contractEmployer || "Not available"}</p>
                </div>
                <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                  <input
                    type="text"
                    placeholder="New employer wallet address"
                    value={newEmployer}
                    onChange={(e) => setNewEmployer(e.target.value)}
                    disabled={!isAdmin || roleLoading || !contractAddress}
                    className="w-full rounded-2xl border border-white/10 bg-[#08111d] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none disabled:opacity-50"
                  />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionButton
                      variant="primary"
                      onClick={handleEmployerUpdate}
                      disabled={!isAdmin || roleLoading || !contractAddress}
                    >
                      {roleLoading ? "Updating..." : "Assign employer"}
                    </ActionButton>
                  </div>
                  {!isAdmin ? (
                    <p className="mt-4 text-sm leading-7 text-amber-200">
                      Employer reassignment is available only to admin accounts.
                    </p>
                  ) : null}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Company tax"
              title="Default payroll tax"
              description="This rate is used when an employee does not have a custom backend tax override."
            >
              <div className="flex flex-col gap-4 sm:flex-row">
                <input
                  type="number"
                  value={companyTax}
                  onChange={(e) => setCompanyTax(Number(e.target.value))}
                  className="w-full rounded-2xl border border-white/10 bg-[#08111d] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
                />
                <ActionButton variant="primary" onClick={handleCompanyTaxUpdate} disabled={companyTaxLoading}>
                  {companyTaxLoading ? "Updating..." : "Update"}
                </ActionButton>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            eyebrow="Progressive slabs"
            title="Tax slab management"
            description="Create and remove backend tax slabs with explicit min, max, and rate ranges."
          >
            <div className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#08111d]">
              <div className="grid grid-cols-[0.9fr_0.9fr_0.7fr_0.6fr] gap-4 border-b border-white/10 px-5 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                <span>Min income</span>
                <span>Max income</span>
                <span>Rate</span>
                <span>Action</span>
              </div>
              <div className="divide-y divide-white/8">
                {slabs.map((slab) => (
                  <div key={slab.id} className="grid grid-cols-[0.9fr_0.9fr_0.7fr_0.6fr] gap-4 px-5 py-4 text-sm text-slate-300">
                    <span>{slab.min_income}</span>
                    <span>{slab.max_income || "No limit"}</span>
                    <span>{slab.tax_rate}%</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlab(slab.id)}
                      className="text-left font-semibold text-rose-300 transition hover:text-rose-200"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddSlab} className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_0.8fr_auto]">
              <input
                placeholder="Min income"
                value={minIncome}
                onChange={(e) => setMinIncome(e.target.value)}
                className="rounded-2xl border border-white/10 bg-[#08111d] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
                required
              />
              <input
                placeholder="Max income (optional)"
                value={maxIncome}
                onChange={(e) => setMaxIncome(e.target.value)}
                className="rounded-2xl border border-white/10 bg-[#08111d] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
              />
              <input
                placeholder="Rate %"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="rounded-2xl border border-white/10 bg-[#08111d] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
                required
              />
              <ActionButton type="submit" variant="primary" disabled={slabLoading}>
                {slabLoading ? "Adding..." : "Add slab"}
              </ActionButton>
            </form>
          </SectionCard>

          <SectionCard
            eyebrow="Employee overrides"
            title="Custom employee tax"
            description="This save flow preserves the existing validation rule: employee tax cannot be saved until an employee is selected."
          >
            <div className="max-w-xl space-y-4">
              <select
                value={selectedEmployee}
                onChange={(e) => {
                  setSelectedEmployee(e.target.value);
                  if (e.target.value) setEmployeeTaxError("");
                }}
                className="w-full rounded-2xl border border-white/10 bg-[#08111d] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none"
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={useCustom}
                  onChange={(e) => setUseCustom(e.target.checked)}
                  className="h-4 w-4 accent-cyan-300"
                />
                Use custom tax rate for selected employee
              </label>

              {useCustom ? (
                <input
                  type="number"
                  placeholder="Custom tax %"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#08111d] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
                />
              ) : null}

              {employeeTaxError ? (
                <div className="rounded-[1.35rem] border border-rose-300/18 bg-rose-500/8 px-4 py-4 text-sm leading-7 text-slate-200">
                  {employeeTaxError}
                </div>
              ) : null}

              <ActionButton variant="primary" onClick={handleEmployeeTaxUpdate} disabled={employeeTaxLoading}>
                {employeeTaxLoading ? "Saving..." : "Save employee tax"}
              </ActionButton>
            </div>
          </SectionCard>
        </>
      ) : null}
    </PageShell>
  );
}
