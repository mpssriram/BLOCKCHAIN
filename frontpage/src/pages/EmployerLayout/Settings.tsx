import React, { useEffect, useState } from "react";
import {
  getCompanyTax,
  updateCompanyTax,
  getTaxSlabs,
  createTaxSlab,
  deleteTaxSlab,
  setEmployeeTax,
  getEmployees,
  getAuthRole,
  getBlockchainConfig,
} from "../../app/api";
import { loginAndConnectContract } from "../../blockchain/web3Auth";
import { CORE_PAYROLL_ABI, HELA_CHAIN_CONFIG } from "../../blockchain/config";
import { ethers } from "ethers";

export default function Settings() {
  const authRole = getAuthRole();
  const isAdmin = authRole === "admin";

  const [companyTax, setCompanyTax] = useState(0);
  const [slabs, setSlabs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [contractAdmin, setContractAdmin] = useState<string | null>(null);
  const [contractEmployer, setContractEmployer] = useState<string | null>(null);
  const [newEmployer, setNewEmployer] = useState("");
  const [roleLoading, setRoleLoading] = useState(false);

  const [minIncome, setMinIncome] = useState("");
  const [maxIncome, setMaxIncome] = useState("");
  const [rate, setRate] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [customRate, setCustomRate] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const tax = await getCompanyTax();
    setCompanyTax(tax.default_tax_rate);

    const slabData = await getTaxSlabs();
    setSlabs(slabData);

    const emp = await getEmployees();
    setEmployees(emp);
  }

  useEffect(() => {
    loadRoleConfig();
  }, []);

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
    await updateCompanyTax(companyTax);
    alert("Company tax updated!");
  }

  async function handleAddSlab(e: React.FormEvent) {
    e.preventDefault();

    await createTaxSlab(
      Number(minIncome),
      maxIncome ? Number(maxIncome) : null,
      Number(rate)
    );

    setMinIncome("");
    setMaxIncome("");
    setRate("");

    loadData();
  }

  async function handleDeleteSlab(id: number) {
    await deleteTaxSlab(id);
    loadData();
  }

  async function handleEmployeeTaxUpdate() {
    await setEmployeeTax(
      Number(selectedEmployee),
      useCustom,
      customRate ? Number(customRate) : undefined
    );

    alert("Employee tax updated!");
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
      alert("Employer wallet updated.");
    } catch (err: any) {
      alert(err?.message || "Failed to update employer wallet.");
    } finally {
      setRoleLoading(false);
    }
  }

  return (
    <div className="p-8 space-y-12">

      <h1 className="text-2xl font-bold">Tax Settings</h1>

      <div className="bg-white p-6 rounded shadow max-w-2xl space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">
            Contract Roles
          </h2>
          <p className="text-sm text-slate-500">
            Admin controls employer reassignment and emergency recovery. Employer keeps day-to-day stream operations.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">Signed-in role:</span> {authRole || "unknown"}</p>
          <p><span className="font-medium">Admin wallet:</span> {contractAdmin || "Not available"}</p>
          <p><span className="font-medium">Employer wallet:</span> {contractEmployer || "Not available"}</p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            placeholder="New employer wallet address"
            value={newEmployer}
            onChange={(e) => setNewEmployer(e.target.value)}
            disabled={!isAdmin || roleLoading || !contractAddress}
            className="border p-2 rounded w-full disabled:bg-slate-100"
          />
          <button
            onClick={handleEmployerUpdate}
            disabled={!isAdmin || roleLoading || !contractAddress}
            className="bg-slate-900 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {roleLoading ? "Updating..." : "Assign Employer"}
          </button>
        </div>
        {!isAdmin && (
          <p className="text-sm text-amber-700">
            Employer reassignment is available only to admin accounts.
          </p>
        )}
      </div>

      {/* ================= COMPANY TAX ================= */}
      <div className="bg-white p-6 rounded shadow max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          Company Default Tax (%)
        </h2>

        <div className="flex gap-4">
          <input
            type="number"
            value={companyTax}
            onChange={(e) => setCompanyTax(Number(e.target.value))}
            className="border p-2 rounded w-full"
          />

          <button
            onClick={handleCompanyTaxUpdate}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Update
          </button>
        </div>
      </div>

      {/* ================= TAX SLABS ================= */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">
          Progressive Tax Slabs
        </h2>

        <table className="w-full border mb-4">
          <thead>
            <tr>
              <th className="border p-2">Min</th>
              <th className="border p-2">Max</th>
              <th className="border p-2">Rate %</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {slabs.map((slab) => (
              <tr key={slab.id}>
                <td className="border p-2">{slab.min_income}</td>
                <td className="border p-2">
                  {slab.max_income || "No Limit"}
                </td>
                <td className="border p-2">{slab.tax_rate}%</td>
                <td className="border p-2">
                  <button
                    onClick={() => handleDeleteSlab(slab.id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form onSubmit={handleAddSlab} className="flex gap-2">
          <input
            placeholder="Min Income"
            value={minIncome}
            onChange={(e) => setMinIncome(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <input
            placeholder="Max Income (optional)"
            value={maxIncome}
            onChange={(e) => setMaxIncome(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            placeholder="Rate %"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <button className="bg-green-600 text-white px-4 py-2 rounded">
            Add
          </button>
        </form>
      </div>

      {/* ================= EMPLOYEE TAX OVERRIDE ================= */}
      <div className="bg-white p-6 rounded shadow max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          Employee Custom Tax
        </h2>

        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="border p-2 rounded w-full mb-3"
        >
          <option value="">Select Employee</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={useCustom}
            onChange={(e) => setUseCustom(e.target.checked)}
          />
          <label>Use Custom Tax</label>
        </div>

        {useCustom && (
          <input
            type="number"
            placeholder="Custom Tax %"
            value={customRate}
            onChange={(e) => setCustomRate(e.target.value)}
            className="border p-2 rounded w-full mb-3"
          />
        )}

        <button
          onClick={handleEmployeeTaxUpdate}
          className="bg-purple-600 text-white px-4 py-2 rounded w-full"
        >
          Save
        </button>
      </div>

    </div>
  );
}
