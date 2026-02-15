import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, PauseCircle } from "lucide-react";
import { getEmployee, startStream, pauseStream, createTransaction } from "../../../app/api";

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryDesc, setSalaryDesc] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getEmployee(Number(id))
      .then(setEmployee)
      .catch(() => setEmployee(null));
  }, [id]);

  const handleActivate = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await startStream(Number(id));
      setEmployee((prev: any) => ({ ...prev, is_streaming: data.is_streaming }));
    } catch {
      alert("Activate failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await pauseStream(Number(id));
      setEmployee((prev: any) => ({ ...prev, is_streaming: data.is_streaming }));
    } catch {
      alert("Pause failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePaySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !salaryAmount) return;
    setPayLoading(true);
    try {
      await createTransaction(Number(id), Number(salaryAmount), salaryDesc || "Salary payment");
      setSalaryAmount("");
      setSalaryDesc("");
      const updated = await getEmployee(Number(id));
      setEmployee(updated);
    } catch (err: any) {
      alert(err.message || "Payment failed");
    } finally {
      setPayLoading(false);
    }
  };

  if (!employee) return <div className="p-10">Loading...</div>;

  return (
    <div className="space-y-8 p-6">

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-blue-500 hover:underline"
      >
        ← Back
      </button>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold">
          {employee.name}
        </h2>

        <p className="text-slate-600 mt-2">
          Role: {employee.role}
        </p>

        <div className="mt-4 flex items-center gap-4">

          <span
            className={`px-4 py-1 rounded-full font-semibold ${
              employee.is_streaming
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {employee.is_streaming ? "Active" : "Paused"}
          </span>
        </div>
      </div>

      <div className="flex gap-6">
        <button
          type="button"
          disabled={loading}
          onClick={handleActivate}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 text-white disabled:opacity-50"
        >
          <Play size={18} />
          Activate
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={handlePause}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white disabled:opacity-50"
        >
          <PauseCircle size={18} />
          Pause
        </button>
      </div>

      {/* Pay Salary (only when stream is active) */}
      {employee.is_streaming && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Pay Salary (Gross)</h3>
          <form onSubmit={handlePaySalary} className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={salaryAmount}
                onChange={(e) => setSalaryAmount(e.target.value)}
                placeholder="Amount"
                className="border px-4 py-2 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Description</label>
              <input
                type="text"
                value={salaryDesc}
                onChange={(e) => setSalaryDesc(e.target.value)}
                placeholder="e.g. March salary"
                className="border px-4 py-2 rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={payLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {payLoading ? "Processing..." : "Pay"}
            </button>
          </form>
        </div>
      )}

      {/* Transaction history */}
      {employee.transactions && employee.transactions.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <ul className="space-y-2">
            {employee.transactions.slice(0, 10).map((t: any) => (
              <li key={t.id} className="flex justify-between py-2 border-b last:border-0">
                <span className="text-slate-600">{t.description}</span>
                <span className="font-medium">₹ {Number(t.amount).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
