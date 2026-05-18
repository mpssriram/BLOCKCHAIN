# Phase 2 System Structure

Phase 2 extends the project from "working blockchain actions" into "trackable transaction workflows."

## Scope

- `payroll_intents`
- `blockchain_transactions`
- `tx_hash` submission
- status tracking
- idempotency

## Why Phase 2 Exists

Phase 1 allows users to authenticate, manage employees, read claimable balances, and execute on-chain actions.
Phase 2 adds the transaction lifecycle layer needed to safely coordinate retries, confirmations, and backend tracking.

## Core Concepts

### Payroll Intent

A payroll intent is created before or around a blockchain action and represents what the system is trying to do:

- start stream
- pause stream
- cancel stream
- withdraw

Each intent has:

- `idempotency_key`
- `intent_type`
- optional `employee_id`
- optional amount / rate metadata
- optional `tx_hash`
- `status`

### Blockchain Transaction

`blockchain_transactions` stores chain-facing tx records keyed by `tx_hash`.
Phase 2 links submitted hashes back to payroll intents so the app can track submission and confirmation states.

## Pipeline

1. Frontend creates a payroll intent with an `idempotency_key`.
2. Backend returns the existing intent if the same key is replayed.
3. Frontend performs the blockchain action in the wallet.
4. Frontend submits the resulting `tx_hash` to the backend.
5. Backend creates or updates a `blockchain_transaction`.
6. Backend marks the payroll intent as `submitted`.
7. Later status updates move both the transaction record and linked intent forward.

## Current Backend Endpoints

- `POST /api/payroll/intents`
- `GET /api/payroll/intents`
- `GET /api/payroll/intents/{intent_id}`
- `POST /api/payroll/intents/{intent_id}/submit-hash`
- existing blockchain tx status endpoints remain available for status updates

## Idempotency Rule

The same `idempotency_key` must return the same payroll intent instead of creating duplicates.
This keeps retries safe when the frontend resubmits after a network error or refresh.
