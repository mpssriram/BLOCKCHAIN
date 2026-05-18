# Phase 4 System Structure

Phase 4 adds the operational reporting layer on top of the earlier auth, tx lifecycle, and blockchain sync phases.

## Scope

- treasury summary
- employee reports
- notifications
- admin logs
- stream history

## Features

### Treasury Summary

- combines treasury balances
- includes treasury health/runway status
- includes payout, tax, and active-stream metrics

### Employee Reports

- employee profile snapshot
- total payout
- total tax
- transaction count
- bonus count
- recent transactions
- stream-history entries

### Notifications

- email sending remains available
- sent notifications are now persisted in `notification_logs`
- notification history can be queried from the backend

### Admin Logs

- admin action logging remains available
- filtering by admin, action type, employee, and date range is supported

### Stream History

- stream-related `PayrollEvent` records are exposed through a dedicated API
- supports system-wide history or per-employee filtering
