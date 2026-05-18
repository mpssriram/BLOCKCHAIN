# Phase 3 System Structure

Phase 3 adds blockchain event ingestion so the backend can sync confirmed chain activity into database records.

## Scope

- event listener / sync service
- `StreamStarted` event sync
- `Withdrawal` event sync
- `PayrollEvent` table updates
- `Transaction` table updates

## Flow

1. Backend connects to HeLa RPC using `HELA_RPC_URL`.
2. Backend loads the deployed `CorePayroll` contract using `CONTRACT_ADDRESS`.
3. Backend reads contract logs between a block range.
4. Backend maps wallet addresses from events to employees in the database.
5. Backend writes normalized records into:
   - `PayrollEvent`
   - `Transaction`
   - `BlockchainTransaction`
   - linked `PayrollIntent` status where applicable

## Event Mapping

### StreamStarted

- employee resolved from wallet address
- employee `is_streaming` set to `True`
- `BlockchainTransaction` marked `confirmed`
- `PayrollEvent` written as `stream_started`

### Withdrawal

- employee resolved from wallet address
- `BlockchainTransaction` marked `confirmed`
- `PayrollEvent` written as `withdrawn`
- `Transaction` inserted or updated using:
  - `netAmount`
  - `taxAmount`
  - `tx_hash`

## Trigger

Current Phase 3 sync is exposed through:

- `POST /api/blockchain/sync-events`

This is designed for manual sync first and can later be scheduled as a background job or worker.
