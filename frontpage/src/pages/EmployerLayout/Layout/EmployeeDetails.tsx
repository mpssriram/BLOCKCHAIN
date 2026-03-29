import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ExternalLink, PauseCircle, Play, SquareX } from "lucide-react";
import { cancelStream, getBlockchainConfig, getEmployee, pauseStream, startStream, updateEmployeeWallet } from "../../../app/api";
import { loginAndConnectContract } from "../../../blockchain/web3Auth";
import { CORE_PAYROLL_ABI, HELA_CHAIN_CONFIG } from "../../../blockchain/config";
import { ethers } from "ethers";

type StreamDetails = {
  ratePerSecond?: string;
  lastWithdrawTime?: number;
  accruedBalance?: string;
  isActive?: boolean;
};

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [onChainLoading, setOnChainLoading] = useState(false);
  const [ratePerSecond, setRatePerSecond] = useState("");
  const [streamDetails, setStreamDetails] = useState<StreamDetails | null>(null);
  const [claimableWei, setClaimableWei] = useState<string | null>(null);

  const HELA_EXPLORER_ADDRESS = (import.meta as any).env?.VITE_HELA_EXPLORER_ADDRESS || "";

  useEffect(() => {
    if (!id) return;
    loadEmployee(Number(id));
    getBlockchainConfig().then((cfg: any) => {
      const addr = (cfg?.contract_address || "").trim();
      if (addr) setContractAddress(addr);
    });
  }, [id]);

  async function loadEmployee(employeeId: number) {
    try {
      const data = await getEmployee(employeeId);
      setEmployee(data);
    } catch {
      setEmployee(null);
    }
  }

  useEffect(() => {
    async function loadStreamDetails() {
      if (!contractAddress || !employee?.wallet_address) {
        setStreamDetails(null);
        setClaimableWei(null);
        return;
      }

      try {
        const provider = new ethers.JsonRpcProvider(HELA_CHAIN_CONFIG.rpcTarget);
        const roContract = new ethers.Contract(contractAddress, CORE_PAYROLL_ABI, provider);
        const [stream, claimable] = await Promise.all([
          roContract.streams(employee.wallet_address),
          roContract.claimableAmount(employee.wallet_address),
        ]);

        setStreamDetails({
          ratePerSecond:
            (stream.ratePerSecond && stream.ratePerSecond.toString?.()) || (stream[0] && stream[0].toString?.()),
          lastWithdrawTime:
            (typeof stream.lastWithdrawTime === "bigint" ? Number(stream.lastWithdrawTime) : stream[1] ? Number(stream[1]) : undefined),
          accruedBalance:
            (stream.accruedBalance && stream.accruedBalance.toString?.()) || (stream[2] && stream[2].toString?.()),
          isActive:
            typeof stream.isActive === "boolean" ? stream.isActive : typeof stream[3] === "boolean" ? stream[3] : undefined,
        });
        setClaimableWei(claimable.toString());
      } catch {
        setStreamDetails(null);
        setClaimableWei(null);
      }
    }

    loadStreamDetails();
  }, [contractAddress, employee?.wallet_address, employee?.is_streaming]);

  const streamStatus = useMemo(() => {
    if (!streamDetails) return employee?.is_streaming ? "Active" : "Not started";
    const active = !!streamDetails.isActive;
    const rate = streamDetails.ratePerSecond || "0";
    const hasRate = rate !== "0";
    const hasClaimable = !!claimableWei && claimableWei !== "0";

    if (active) return "Active";
    if (hasRate) return "Paused";
    if (hasClaimable) return "Cancelled";
    return "Not started";
  }, [claimableWei, employee?.is_streaming, streamDetails]);

  async function handleLinkWallet() {
    if (!id || !contractAddress) return;
    setOnChainLoading(true);
    try {
      const { address } = await loginAndConnectContract(contractAddress);
      await updateEmployeeWallet(Number(id), address);
      await loadEmployee(Number(id));
    } catch (err: any) {
      alert(err?.message || "Failed to link wallet");
    } finally {
      setOnChainLoading(false);
    }
  }

  async function handleStartOnChainStream() {
    if (!id || !contractAddress || !employee?.wallet_address) {
      alert("Employee must have a linked HeLa wallet first");
      return;
    }

    const rate = ratePerSecond ? ethers.parseEther(ratePerSecond) : null;
    if (!rate || rate <= 0n) {
      alert("Enter a valid HLUSD per-second rate");
      return;
    }

    setOnChainLoading(true);
    try {
      const { contract } = await loginAndConnectContract(contractAddress);
      const tx = await contract.startStream(employee.wallet_address, rate);
      await tx.wait();
      await startStream(Number(id));
      await loadEmployee(Number(id));
      setRatePerSecond("");
    } catch (err: any) {
      alert(err?.message || "Failed to start stream");
    } finally {
      setOnChainLoading(false);
    }
  }

  async function handlePauseOnChainStream() {
    if (!id || !contractAddress || !employee?.wallet_address) return;
    setOnChainLoading(true);
    try {
      const { contract } = await loginAndConnectContract(contractAddress);
      const tx = await contract.stopStream(employee.wallet_address);
      await tx.wait();
      await pauseStream(Number(id));
      await loadEmployee(Number(id));
    } catch (err: any) {
      alert(err?.message || "Failed to pause stream");
    } finally {
      setOnChainLoading(false);
    }
  }

  async function handleCancelOnChainStream() {
    if (!id || !contractAddress || !employee?.wallet_address) return;
    if (!confirm("Cancel this stream? Accrued HLUSD stays claimable, but future streaming stops until HR starts a new stream.")) {
      return;
    }

    setOnChainLoading(true);
    try {
      const { contract } = await loginAndConnectContract(contractAddress);
      const tx = await contract.cancelStream(employee.wallet_address);
      await tx.wait();
      await cancelStream(Number(id));
      await loadEmployee(Number(id));
    } catch (err: any) {
      alert(err?.message || "Failed to cancel stream");
    } finally {
      setOnChainLoading(false);
    }
  }

  if (!employee) return <div className="p-10">Loading employee details...</div>;

  return (
    <div className="space-y-8 p-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-blue-600 hover:underline"
      >
        Back to employees
      </button>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{employee.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{employee.email}</p>
            <p className="text-sm text-slate-600">Role: {employee.role}</p>
          </div>
          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              streamStatus === "Active"
                ? "bg-emerald-100 text-emerald-700"
                : streamStatus === "Paused"
                  ? "bg-amber-100 text-amber-700"
                  : streamStatus === "Cancelled"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-slate-100 text-slate-700"
            }`}
          >
            {streamStatus}
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">HeLa Wallet</p>
            {employee.wallet_address ? (
              <>
                <p className="mt-2 break-all text-sm font-medium text-slate-900">{employee.wallet_address}</p>
                {HELA_EXPLORER_ADDRESS && (
                  <a
                    href={`${HELA_EXPLORER_ADDRESS}${employee.wallet_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm text-cyan-700 hover:underline"
                  >
                    View wallet on explorer
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </>
            ) : (
              <button
                onClick={handleLinkWallet}
                disabled={onChainLoading}
                className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {onChainLoading ? "Linking..." : "Link Wallet"}
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Claimable</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {claimableWei ? `${Number(ethers.formatEther(claimableWei)).toFixed(6)} HLUSD` : "0 HLUSD"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Accrued funds remain withdrawable even after a stream is cancelled.
            </p>
          </div>
        </div>
      </div>

      {contractAddress && employee.wallet_address && (
        <div className="rounded-[28px] border border-cyan-200 bg-cyan-50 p-6">
          <h3 className="text-lg font-semibold text-slate-900">On-Chain Stream Controls</h3>
          <p className="mt-2 text-sm text-slate-600">
            Start a new stream or manage an existing one directly on HeLa.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-cyan-100 bg-white p-4">
              <label className="block text-xs uppercase tracking-[0.2em] text-slate-500">
                Rate (HLUSD / second)
              </label>
              <input
                type="text"
                placeholder="0.0001"
                value={ratePerSecond}
                onChange={(e) => setRatePerSecond(e.target.value)}
                className="mt-2 w-full rounded-xl border px-4 py-3 text-sm"
              />
              <p className="mt-2 text-xs text-slate-500">
                Use this for first start or to resume with a new rate.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-100 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current stream snapshot</p>
              <p className="mt-2 text-sm text-slate-900">
                Rate: {streamDetails?.ratePerSecond ? `${Number(ethers.formatEther(streamDetails.ratePerSecond)).toFixed(6)} HLUSD/sec` : "Not set"}
              </p>
              <p className="mt-1 text-sm text-slate-900">
                Accrued: {streamDetails?.accruedBalance ? `${Number(ethers.formatEther(streamDetails.accruedBalance)).toFixed(6)} HLUSD` : "0 HLUSD"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Last withdraw: {streamDetails?.lastWithdrawTime ? new Date(streamDetails.lastWithdrawTime * 1000).toLocaleString() : "Never"}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleStartOnChainStream}
              disabled={onChainLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              Start / Resume
            </button>
            <button
              onClick={handlePauseOnChainStream}
              disabled={onChainLoading || streamStatus !== "Active"}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-white hover:bg-amber-600 disabled:opacity-50"
            >
              <PauseCircle className="h-4 w-4" />
              Pause
            </button>
            <button
              onClick={handleCancelOnChainStream}
              disabled={onChainLoading || streamStatus === "Not started"}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-white hover:bg-rose-700 disabled:opacity-50"
            >
              <SquareX className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
