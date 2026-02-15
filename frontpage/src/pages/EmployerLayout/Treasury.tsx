import React, { useEffect, useState } from "react";
import { getTreasury, depositTreasury, withdrawTreasury, getBlockchainConfig } from "../../app/api";
import { loginAndConnectContract, logoutWeb3Auth, isConnected, getConnectedAddress } from "../../blockchain/web3Auth";
import { ethers } from "ethers";

export default function Treasury() {
  const [treasury, setTreasury] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [onChainAmount, setOnChainAmount] = useState("");
  const [onChainLoading, setOnChainLoading] = useState(false);
  const [contractAddress, setContractAddress] = useState<string | null>(null);

  useEffect(() => {
    loadTreasury();
    loadBlockchainConfig();
    if (isConnected()) {
      getConnectedAddress().then((addr) => setWalletAddress(addr));
    }
  }, []);

  async function loadBlockchainConfig() {
    try {
      const cfg = await getBlockchainConfig();
      if (cfg?.contract_address) setContractAddress(cfg.contract_address);
    } catch {
      // Not critical - on-chain features disabled
    }
  }

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

  async function handleConnectWallet() {
    if (!contractAddress) {
      alert("Contract not configured. Set CONTRACT_ADDRESS in backend .env");
      return;
    }
    try {
      const { address } = await loginAndConnectContract(contractAddress);
      setWalletAddress(address);
    } catch (err: any) {
      alert(err?.message || "Failed to connect wallet");
    }
  }

  async function handleDisconnectWallet() {
    await logoutWeb3Auth();
    setWalletAddress(null);
  }

  async function handleOnChainDeposit() {
    if (!onChainAmount || !contractAddress) return;
    try {
      setOnChainLoading(true);
      const { contract, signer } = await loginAndConnectContract(contractAddress);
      const valueWei = ethers.parseEther(onChainAmount);
      const tx = await signer.sendTransaction({
        to: contractAddress,
        value: valueWei,
      });
      await tx.wait();
      setOnChainAmount("");
      setWalletAddress(await signer.getAddress());
      await loadTreasury();
    } catch (err: any) {
      alert(err?.message || "On-chain deposit failed");
    } finally {
      setOnChainLoading(false);
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

      {/* Web3Auth Connect Wallet + On-Chain Deposit */}
      {contractAddress && (
        <div className="bg-white shadow rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">On-Chain Treasury (HeLa Testnet)</h3>
          <p className="text-sm text-gray-500">
            Connect via Web3Auth (Email, Google) to deposit HLUSD to the CorePayroll contract.
          </p>
          {!walletAddress ? (
            <button
              onClick={handleConnectWallet}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Connect Wallet (Web3Auth)
            </button>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
              <button
                onClick={handleDisconnectWallet}
                className="text-sm text-gray-500 hover:underline"
              >
                Disconnect
              </button>
              <div className="flex gap-2 items-end mt-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Amount (HLUSD)</label>
                  <input
                    type="text"
                    placeholder="0.1"
                    value={onChainAmount}
                    onChange={(e) => setOnChainAmount(e.target.value)}
                    className="border px-4 py-2 rounded w-40"
                  />
                </div>
                <button
                  onClick={handleOnChainDeposit}
                  disabled={!onChainAmount || onChainLoading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {onChainLoading ? "Depositing..." : "Deposit to Contract"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

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
