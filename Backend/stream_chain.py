"""
Read CorePayroll stream state from HeLa RPC with a short in-memory cache.
"""
from __future__ import annotations

import time
from typing import Any, Literal

from fastapi import HTTPException

from config import settings

try:
    from web3 import Web3
except ImportError:  # pragma: no cover
    Web3 = None  # type: ignore

StreamStatus = Literal["active", "paused", "cancelled", "not_started"]

MINI_ABI = [
    {
        "inputs": [{"internalType": "address", "name": "_employee", "type": "address"}],
        "name": "claimableAmount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "streams",
        "outputs": [
            {"internalType": "uint256", "name": "ratePerSecond", "type": "uint256"},
            {"internalType": "uint256", "name": "lastWithdrawTime", "type": "uint256"},
            {"internalType": "uint256", "name": "accruedBalance", "type": "uint256"},
            {"internalType": "bool", "name": "isActive", "type": "bool"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
]

_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
CACHE_TTL_SECONDS = 30


def _derive_status(rate: int, is_active: bool, accrued: int, claimable: int) -> StreamStatus:
    if is_active and rate > 0:
        return "active"
    if rate > 0 and not is_active:
        return "paused"
    if claimable > 0 or accrued > 0:
        return "cancelled" if rate == 0 else "paused"
    return "not_started"


def _get_web3() -> Any:
    if Web3 is None:
        raise HTTPException(
            status_code=503,
            detail="web3 package is not installed. Run: pip install web3",
        )
    rpc = settings.HELA_RPC_URL or "https://testnet-rpc.helachain.com"
    return Web3(Web3.HTTPProvider(rpc, request_kwargs={"timeout": 20}))


def get_stream_details(wallet_address: str, *, bypass_cache: bool = False) -> dict[str, Any]:
    contract_addr = (settings.CONTRACT_ADDRESS or "").strip()
    wallet = (wallet_address or "").strip()

    if not wallet or not wallet.startswith("0x"):
        return _empty_stream(wallet_address=None, reason="no_wallet")

    if not contract_addr:
        return _empty_stream(wallet_address=wallet, reason="no_contract")

    cache_key = f"{contract_addr.lower()}:{wallet.lower()}"
    now = time.time()
    if not bypass_cache and cache_key in _CACHE:
        cached_at, payload = _CACHE[cache_key]
        if now - cached_at < CACHE_TTL_SECONDS:
            return {**payload, "cached": True}

    w3 = _get_web3()
    if not w3.is_connected():
        raise HTTPException(status_code=503, detail="Could not connect to HeLa RPC")

    try:
        checksum_wallet = Web3.to_checksum_address(wallet)
        checksum_contract = Web3.to_checksum_address(contract_addr)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid wallet or contract address") from exc

    contract = w3.eth.contract(address=checksum_contract, abi=MINI_ABI)
    try:
        claimable = int(contract.functions.claimableAmount(checksum_wallet).call())
        stream = contract.functions.streams(checksum_wallet).call()
        rate = int(stream[0])
        last_withdraw = int(stream[1])
        accrued = int(stream[2])
        is_active = bool(stream[3])
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to read stream from chain: {exc}") from exc

    fetched_at = int(time.time())
    status = _derive_status(rate, is_active, accrued, claimable)

    payload: dict[str, Any] = {
        "wallet_address": checksum_wallet,
        "contract_address": checksum_contract,
        "claimable_wei": str(claimable),
        "rate_per_second_wei": str(rate),
        "accrued_balance_wei": str(accrued),
        "last_withdraw_time": last_withdraw,
        "last_update": last_withdraw if status == "active" else fetched_at,
        "is_active": is_active,
        "status": status,
        "fetched_at": fetched_at,
        "cached": False,
    }
    _CACHE[cache_key] = (now, {k: v for k, v in payload.items() if k != "cached"})
    return payload


def _empty_stream(*, wallet_address: str | None, reason: str = "not_started") -> dict[str, Any]:
    fetched_at = int(time.time())
    return {
        "wallet_address": wallet_address,
        "contract_address": settings.CONTRACT_ADDRESS or "",
        "claimable_wei": "0",
        "rate_per_second_wei": "0",
        "accrued_balance_wei": "0",
        "last_withdraw_time": 0,
        "last_update": fetched_at,
        "is_active": False,
        "status": "not_started",
        "fetched_at": fetched_at,
        "cached": False,
        "reason": reason,
    }
