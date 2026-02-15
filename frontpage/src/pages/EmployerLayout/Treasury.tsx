import React, { useEffect, useState } from "react";
import { getTreasury, depositTreasury, withdrawTreasury } from "../../app/api";

export default function Treasury() {
  const [treasury, setTreasury] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTreasury();
  }, []);

  async function loadTreasury() {
    try {
      const data = await getTreasury();
      setTreasury(data);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDeposit() {
    if (!amount) return;

    try {
      setLoading(true);
      await depositTreasury(Number(amount));
      setAmount("");
      await loadTreasury();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!amount) return;

    try {
      setLoading(true);
      await withdrawTreasury(Number(amount));
      setAmount("");
      await loadTreasury();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!treasury) {
    return <div className="p-10">Loading treasury...</div>;
  }

  return (
    <div className="space-y-8 p-8">

      <h1 className="text-2xl font-bold">Treasury Overview</h1>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-2 gap-6">

        <div className="bg-white shadow rounded-xl p-6">
          <p className="text-gray-500">Web2 Balance</p>
          <h2 className="text-3xl font-semibold text-emerald-600">
            ₹ {Number(treasury.total_balance).toFixed(2)}
          </h2>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <p className="text-gray-500">On-Chain Balance</p>
          <h2 className="text-3xl font-semibold text-blue-600">
            ₹ {Number(treasury.onchain_balance).toFixed(2)}
          </h2>
        </div>

      </div>

      {/* Sync Info */}
      <div className="bg-white shadow rounded-xl p-6 space-y-2">
        <p className="text-gray-500">Last Transaction Hash</p>
        <p className="text-sm break-all text-purple-600">
          {treasury.last_tx_hash || "No transaction yet"}
        </p>

        <p className="text-gray-500 mt-4">Last Synced</p>
        <p>
          {treasury.last_synced_at
            ? new Date(treasury.last_synced_at).toLocaleString()
            : "Not synced yet"}
        </p>
      </div>

      {/* Manage Treasury */}
      <div className="bg-white shadow rounded-xl p-6 space-y-4">

        <h3 className="font-semibold text-lg">Manage Treasury</h3>

        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border px-4 py-2 rounded w-full"
        />

        <div className="flex gap-4">
          <button
            onClick={handleDeposit}
            disabled={loading}
            className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 disabled:opacity-50"
          >
            Deposit
          </button>

          <button
            onClick={handleWithdraw}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            Withdraw
          </button>
        </div>

      </div>

    </div>
  );
}
