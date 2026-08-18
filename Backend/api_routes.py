"""
API routes for employer dashboard: employees, transactions, bonuses, treasury, dashboard, settings.
All dashboard routes require JWT authentication (admin or employer role).
"""
from datetime import datetime
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal

from database import db
from export import export_csv
from models import (
    AdminActionLog,
    Employee,
    NotificationLog,
    Transaction,
    Bonus,
    PayrollEvent,
    PayrollIntent,
    Treasury,
    CompanySettings,
    TaxSlab,
    User,
)
from schemas import (
    EmployeeCreate,
    EmployeeResponse,
    EmployeeTaxUpdate,
    EmployeeWalletUpdate,
    TransactionCreate,
    TransactionResponse,
    BonusCreate,
    BonusResponse,
    TreasuryAction,
    CompanySettingsResponse,
    CompanySettingsUpdate,
    TaxSlabCreate,
    TaxSlabResponse,
    BlockchainTxCreate,
    BlockchainTxUpdate,
    BlockchainTxResponse,
    BlockchainEventSyncResponse,
    AdminLogCreate,
    AdminLogResponse,
    EmailRequest,
    EmployeeReportResponse,
    NotificationLogResponse,
    PayrollIntentCreate,
    PayrollIntentResponse,
    PayrollIntentSubmitTxHash,
    StreamDetailsResponse,
    StreamActionRecordCreate,
    StreamHistoryItemResponse,
    TreasuryHealthResponse,
    TreasurySummaryResponse,
    TreasuryResponse,
    WithdrawalRecordCreate,
)
from security import SecurityService
from service import (
    AdminActionLogService,
    EmailNotifier,
    EmployeeService,
    TransactionService,
    BonusService,
    BlockchainEventSyncService,
    NotificationService,
    NotificationLogService,
    PayrollIntentService,
    ReportingService,
    TreasuryService,
    TreasurySyncService,
    DashboardService,
    PhaseOneService,
    StreamingService,
    BlockchainTxService,
)

router = APIRouter()


def _serialize_admin_log(log: AdminActionLog) -> AdminLogResponse:
    return AdminLogResponse(
        id=log.id,
        admin_id=log.admin_id,
        action_type=log.action_type,
        target_employee_id=log.target_employee_id,
        tx_hash=log.tx_hash,
        metadata=log.action_metadata,
        created_at=log.created_at,
    )


def _serialize_payroll_intent(intent: PayrollIntent) -> PayrollIntentResponse:
    return PayrollIntentResponse(
        id=intent.id,
        idempotency_key=intent.idempotency_key,
        intent_type=intent.intent_type,
        employee_id=intent.employee_id,
        created_by_user_id=intent.created_by_user_id,
        amount=intent.amount,
        rate_per_second_wei=intent.rate_per_second_wei,
        tx_hash=intent.tx_hash,
        status=intent.status,
        created_at=intent.created_at,
        updated_at=intent.updated_at,
    )


def _serialize_notification_log(log: NotificationLog) -> NotificationLogResponse:
    return NotificationLogResponse(
        id=log.id,
        channel=log.channel,
        recipient=log.recipient,
        subject=log.subject,
        template_name=log.template_name,
        status=log.status,
        metadata=log.notification_metadata,
        created_at=log.created_at,
    )


def _serialize_stream_history_item(event: PayrollEvent) -> StreamHistoryItemResponse:
    return StreamHistoryItemResponse(
        id=event.id,
        employee_id=event.employee_id,
        event_type=event.event_type,
        amount=event.amount,
        tx_hash=event.tx_hash,
        block_number=event.block_number,
        log_index=event.log_index,
        metadata=event.event_metadata,
        created_at=event.created_at,
    )


def _format_report_output(
    payload: dict,
    rows: List[dict],
    output_format: Literal["json", "csv", "pdf"],
) -> dict | Response:
    if output_format == "json":
        return payload
    if output_format == "csv":
        return Response(content=export_csv(rows), media_type="text/csv")

    html_rows = "".join(
        "<tr>" + "".join(f"<td>{value}</td>" for value in row.values()) + "</tr>"
        for row in rows
    )
    html = (
        "<html><body>"
        f"<h1>Report</h1><pre>{payload}</pre>"
        f"<table border='1'><tbody>{html_rows}</tbody></table>"
        "</body></html>"
    )
    return Response(content=html, media_type="text/html")


# =========================
# PAYROLL INTENTS
# =========================

@router.post("/payroll/intents", response_model=PayrollIntentResponse, status_code=201)
def create_payroll_intent(
    data: PayrollIntentCreate,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """Create or replay an idempotent payroll intent before tx submission."""
    intent = PayrollIntentService.create_intent(
        session,
        idempotency_key=data.idempotency_key,
        intent_type=data.intent_type,
        employee_id=data.employee_id,
        created_by_user_id=current_user.id,
        amount=data.amount,
        rate_per_second_wei=data.rate_per_second_wei,
    )
    return _serialize_payroll_intent(intent)


@router.get("/payroll/intents", response_model=List[PayrollIntentResponse])
def list_payroll_intents(
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    intent_type: Optional[str] = None,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """List payroll intents for Phase 2 transaction lifecycle tracking."""
    intents = PayrollIntentService.list_intents(
        session,
        employee_id=employee_id,
        status=status,
        intent_type=intent_type,
    )
    return [_serialize_payroll_intent(intent) for intent in intents]


@router.get("/payroll/intents/{intent_id}", response_model=PayrollIntentResponse)
def get_payroll_intent(
    intent_id: int,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """Get a single payroll intent by id."""
    intent = PayrollIntentService.get_intent(session, intent_id)
    return _serialize_payroll_intent(intent)


@router.post("/payroll/intents/{intent_id}/submit-hash", response_model=PayrollIntentResponse)
def submit_payroll_intent_hash(
    intent_id: int,
    data: PayrollIntentSubmitTxHash,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """Attach a tx hash to an intent and begin backend status tracking."""
    intent = PayrollIntentService.submit_tx_hash(
        session,
        intent_id=intent_id,
        tx_hash=data.tx_hash,
    )
    return _serialize_payroll_intent(intent)


@router.post("/blockchain/sync-events", response_model=BlockchainEventSyncResponse)
def sync_blockchain_events(
    from_block: Optional[int] = None,
    to_block: Optional[int] = None,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_admin),
):
    """Sync StreamStarted and Withdrawal events from chain into backend records."""
    result = BlockchainEventSyncService.sync_events(
        session,
        from_block=from_block,
        to_block=to_block,
    )
    return BlockchainEventSyncResponse(**result)


# =========================
# EMPLOYEES
# =========================

@router.get("/employees/", response_model=List[EmployeeResponse])
def list_employees(
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    employees = session.query(Employee).all()
    return [
        EmployeeResponse(
            id=e.id,
            name=e.name,
            email=e.email,
            role=e.role,
            is_active=e.is_active if e.is_active is not None else True,
            is_streaming=e.is_streaming or False,
            wallet_address=e.wallet_address,
            use_custom_tax=e.use_custom_tax or False,
            custom_tax_rate=e.custom_tax_rate,
            transactions=[],
        )
        for e in employees
    ]


@router.post("/employees/", response_model=EmployeeResponse)
def create_employee(
    data: EmployeeCreate,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    try:
        emp = EmployeeService.create_employee(
            session, data.name, data.email, data.role
        )
        return EmployeeResponse(
            id=emp.id,
            name=emp.name,
            email=emp.email,
            role=emp.role,
            is_active=emp.is_active if emp.is_active is not None else True,
            is_streaming=emp.is_streaming or False,
            wallet_address=emp.wallet_address,
            use_custom_tax=emp.use_custom_tax or False,
            custom_tax_rate=emp.custom_tax_rate,
            transactions=[],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    emp = EmployeeService.get_employee(session, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    transactions = [
        TransactionResponse(
            id=t.id,
            employee_id=t.employee_id,
            amount=t.amount,
            tax_amount=t.tax_amount,
            description=t.description or "",
            timestamp=t.timestamp,
        )
        for t in emp.transactions
    ]
    return EmployeeResponse(
        id=emp.id,
        name=emp.name,
        email=emp.email,
        role=emp.role,
        is_active=emp.is_active if emp.is_active is not None else True,
        is_streaming=emp.is_streaming or False,
        wallet_address=emp.wallet_address,
        use_custom_tax=emp.use_custom_tax or False,
        custom_tax_rate=emp.custom_tax_rate,
        transactions=transactions,
    )


@router.get("/employees/{employee_id}/transactions", response_model=List[TransactionResponse])
def get_employee_transactions(
    employee_id: int,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    emp = EmployeeService.get_employee(session, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return [
        TransactionResponse(
            id=t.id,
            employee_id=t.employee_id,
            amount=t.amount,
            tax_amount=t.tax_amount,
            description=t.description or "",
            timestamp=t.timestamp,
        )
        for t in emp.transactions
    ]


@router.put("/employees/{employee_id}/wallet")
def update_employee_wallet(
    employee_id: int,
    data: EmployeeWalletUpdate,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """Set employee's on-chain wallet address (for CorePayroll)."""
    emp = EmployeeService.get_employee(session, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp.wallet_address = data.wallet_address
    session.commit()
    session.refresh(emp)
    return {"message": "Wallet updated", "wallet_address": emp.wallet_address}


@router.put("/employees/{employee_id}/tax")
def update_employee_tax(
    employee_id: int,
    data: EmployeeTaxUpdate,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    emp = EmployeeService.get_employee(session, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp.use_custom_tax = data.use_custom_tax
    emp.custom_tax_rate = float(data.custom_tax_rate) if data.custom_tax_rate is not None else None
    session.commit()
    session.refresh(emp)
    return {"message": "Tax updated"}


@router.patch("/employees/{employee_id}/deactivate")
def deactivate_employee(
    employee_id: int,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """Deactivate an employee without removing their records."""
    emp = EmployeeService.get_employee(session, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp.is_active = False
    user = session.query(User).filter(User.email == emp.email).first()
    if user:
        user.session_version += 1
    session.commit()
    return {"message": "Employee deactivated"}


@router.delete("/employees/{employee_id}")
def delete_employee(
    employee_id: int,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """Delete an employee only when no payroll events are attached."""
    emp = EmployeeService.get_employee(session, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    has_events = (
        session.query(func.count())
        .select_from(PayrollEvent)
        .filter(PayrollEvent.employee_id == employee_id)
        .scalar()
    )
    if has_events:
        raise HTTPException(status_code=400, detail="Cannot delete employee with payroll events")
    session.delete(emp)
    session.commit()
    return {"message": "Employee deleted"}


# =========================
# STREAM
# =========================

@router.post("/stream/start/{employee_id}")
def start_stream(
    employee_id: int,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    return StreamingService.start_stream(session, employee_id)


@router.post("/stream/pause/{employee_id}")
def pause_stream(
    employee_id: int,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    return StreamingService.pause_stream(session, employee_id)


@router.post("/stream/cancel/{employee_id}")
def cancel_stream(
    employee_id: int,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    return StreamingService.cancel_stream(session, employee_id)


@router.post("/stream/status", response_model=BlockchainTxResponse)
def upsert_stream_tx_status(
    data: BlockchainTxCreate,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    tx_hash = (data.tx_hash or "").strip()
    if not tx_hash.startswith("0x"):
        raise HTTPException(status_code=400, detail="Invalid tx_hash")
    tx_type = (data.tx_type or "").strip()
    if not tx_type:
        raise HTTPException(status_code=400, detail="tx_type is required")
    status_val = (data.status or "pending").strip()
    tx = BlockchainTxService.upsert_tx(session, tx_hash=tx_hash, tx_type=tx_type, status=status_val)
    return BlockchainTxResponse(
        tx_hash=tx.tx_hash,
        tx_type=tx.tx_type,
        status=tx.status,
        created_at=tx.created_at,
    )


@router.post("/stream/record", response_model=BlockchainTxResponse, status_code=201)
def record_stream_action(
    data: StreamActionRecordCreate,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """Persist a basic backend record after a confirmed on-chain stream action."""
    tx = PhaseOneService.record_stream_action(
        session,
        employee_id=data.employee_id,
        tx_hash=data.tx_hash,
        action=data.action,
        rate_per_second_wei=data.rate_per_second_wei,
    )
    return BlockchainTxResponse(
        tx_hash=tx.tx_hash,
        tx_type=tx.tx_type,
        status=tx.status,
        created_at=tx.created_at,
    )


@router.get("/stream/status/{tx_hash}", response_model=BlockchainTxResponse)
def get_stream_tx_status(
    tx_hash: str,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    tx_hash = (tx_hash or "").strip()
    tx = BlockchainTxService.get_tx(session, tx_hash=tx_hash)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return BlockchainTxResponse(
        tx_hash=tx.tx_hash,
        tx_type=tx.tx_type,
        status=tx.status,
        created_at=tx.created_at,
    )


@router.patch("/stream/status/{tx_hash}", response_model=BlockchainTxResponse)
def update_stream_tx_status(
    tx_hash: str,
    data: BlockchainTxUpdate,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    tx_hash = (tx_hash or "").strip()
    status_val = (data.status or "").strip()
    if not status_val:
        raise HTTPException(status_code=400, detail="status is required")
    tx = BlockchainTxService.update_status(session, tx_hash=tx_hash, status=status_val)
    return BlockchainTxResponse(
        tx_hash=tx.tx_hash,
        tx_type=tx.tx_type,
        status=tx.status,
        created_at=tx.created_at,
    )


# =========================
# TRANSACTIONS (Salary)
# =========================

@router.post("/transactions/", response_model=TransactionResponse)
def create_transaction(
    data: TransactionCreate,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    try:
        tx = TransactionService.create_transaction(
            session,
            data.employee_id,
            float(data.amount),
            data.description,
        )
        return TransactionResponse(
            id=tx.id,
            employee_id=tx.employee_id,
            amount=tx.amount,
            tax_amount=tx.tax_amount,
            description=tx.description or "",
            timestamp=tx.timestamp,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =========================
# BONUSES
# =========================

@router.post("/bonuses/{employee_id}", response_model=BonusResponse)
def give_bonus(
    employee_id: int,
    data: BonusCreate,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    try:
        bonus = BonusService.give_bonus(
            session,
            employee_id,
            float(data.amount),
            data.reason,
        )
        return BonusResponse(
            id=bonus.id,
            employee_id=bonus.employee_id,
            amount=bonus.amount,
            reason=bonus.reason or "",
            created_at=bonus.created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =========================
# TREASURY
# =========================

@router.get("/treasury", response_model=TreasuryResponse)
def get_treasury(
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """Return the current treasury state."""
    treasury = TreasuryService.get_or_create(session)
    return TreasuryService.serialize_treasury(treasury)


@router.get("/treasury/health", response_model=TreasuryHealthResponse)
def get_treasury_health(
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """Return treasury runway health based on active stream load."""
    return TreasuryService.health_summary(session)


@router.get("/treasury/summary", response_model=TreasurySummaryResponse)
def get_treasury_summary(
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """Return a high-level treasury summary for dashboard reporting."""
    return TreasuryService.summary(session)


@router.post("/treasury/sync", response_model=TreasuryResponse)
def sync_treasury(
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """Sync the treasury's on-chain balance into the local record."""
    treasury = TreasurySyncService.sync_onchain_balance(session)
    return TreasuryService.serialize_treasury(treasury)


@router.post("/treasury/deposit")
def deposit_treasury(
    data: TreasuryAction,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    try:
        treasury = TreasuryService.deposit_web2(session, float(data.amount))
        return TreasuryService.serialize_treasury(treasury)
    except HTTPException:
        raise


@router.post("/treasury/withdraw")
def withdraw_treasury(
    data: TreasuryAction,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    try:
        treasury = TreasuryService.withdraw_web2(session, float(data.amount))
        return TreasuryService.serialize_treasury(treasury)
    except HTTPException:
        raise


@router.post("/admin/logs", response_model=AdminLogResponse, status_code=201)
def create_admin_log(
    data: AdminLogCreate,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """Create an admin action log entry for dashboard operations."""
    log = AdminActionLogService.create_log(
        session,
        admin_id=current_user.id,
        action_type=data.action_type,
        target_employee_id=data.target_employee_id,
        tx_hash=data.tx_hash,
        metadata=data.metadata,
    )
    return _serialize_admin_log(log)


@router.get("/admin/logs", response_model=List[AdminLogResponse])
def list_admin_logs(
    admin_id: Optional[int] = None,
    action_type: Optional[str] = None,
    employee_id: Optional[int] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """List admin logs with optional filters for actor, action, employee, and date range."""
    logs = AdminActionLogService.list_logs(
        session,
        admin_id=admin_id,
        action_type=action_type,
        employee_id=employee_id,
        start=start,
        end=end,
    )
    return [_serialize_admin_log(log) for log in logs]


# =========================
# DASHBOARD
# =========================

@router.get("/dashboard/total-payout")
def total_payout(
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    return DashboardService.total_payout(session)


@router.get("/dashboard/total-tax")
def total_tax(
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    return DashboardService.total_tax_collected(session)


@router.get("/dashboard/active-streams")
def active_streams(
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    return DashboardService.active_streams(session)


@router.get("/dashboard/top-earners")
def top_earners(
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    return DashboardService.top_earners(session)


@router.get("/dashboard/monthly-summary")
def monthly_summary(
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    return DashboardService.monthly_summary(session)


@router.get("/reports/monthly")
def monthly_report(
    year: int,
    month: int,
    format: Literal["json", "csv", "pdf"] = Query(default="json"),
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """Return monthly payout and tax totals with per-employee breakdown."""
    payload = DashboardService.monthly_report(session, year, month)
    rows = payload["breakdown"]
    return _format_report_output(payload, rows, format)


@router.get("/reports/employees/{employee_id}", response_model=EmployeeReportResponse)
def employee_report(
    employee_id: int,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """Return an employee payout and stream activity report."""
    payload = ReportingService.employee_report(session, employee_id)
    employee = payload["employee"]
    employee_response = EmployeeResponse(
        id=employee.id,
        name=employee.name,
        email=employee.email,
        role=employee.role,
        is_active=employee.is_active if employee.is_active is not None else True,
        is_streaming=employee.is_streaming or False,
        wallet_address=employee.wallet_address,
        use_custom_tax=employee.use_custom_tax or False,
        custom_tax_rate=employee.custom_tax_rate,
        transactions=[],
    )
    return EmployeeReportResponse(
        employee=employee_response,
        total_payout=payload["total_payout"],
        total_tax=payload["total_tax"],
        total_transactions=payload["total_transactions"],
        total_bonuses=payload["total_bonuses"],
        stream_events=payload["stream_events"],
        recent_transactions=[
            TransactionResponse(
                id=t.id,
                employee_id=t.employee_id,
                amount=t.amount,
                tax_amount=t.tax_amount,
                description=t.description or "",
                timestamp=t.timestamp,
            )
            for t in payload["recent_transactions"]
        ],
        stream_history=[_serialize_stream_history_item(event) for event in payload["stream_history"]],
    )


@router.get("/reports/tax")
def tax_report(
    year: int,
    month: int,
    format: Literal["json", "csv", "pdf"] = Query(default="json"),
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """Return monthly tax collection totals and configured slab information."""
    payload = DashboardService.tax_report(session, year, month)
    rows = payload["tax_slabs"]
    return _format_report_output(payload, rows, format)


@router.post("/notifications/email")
def send_email_notification(
    data: EmailRequest,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """Send a templated HTML email notification through SMTP."""
    from os import environ

    smtp_server = environ.get("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(environ.get("SMTP_PORT", "587"))
    username = environ.get("SMTP_USERNAME", "")
    password = environ.get("SMTP_PASSWORD", "")
    if not username:
        raise HTTPException(status_code=500, detail="SMTP credentials are not configured")

    html_body = NotificationService.render_template(data.template, data.context)
    notifier = EmailNotifier(smtp_server, smtp_port, username, password)
    notifier.send(str(data.to), data.subject, html_body)
    NotificationLogService.create_log(
        session,
        channel="email",
        recipient=str(data.to),
        subject=data.subject,
        template_name=data.template,
        status="sent",
        metadata=data.context,
    )
    return {"message": "Email sent successfully"}


@router.get("/notifications", response_model=List[NotificationLogResponse])
def list_notifications(
    channel: Optional[str] = None,
    recipient: Optional[str] = None,
    status: Optional[str] = None,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """List sent notifications with basic filtering."""
    logs = NotificationLogService.list_logs(
        session,
        channel=channel,
        recipient=recipient,
        status=status,
    )
    return [_serialize_notification_log(log) for log in logs]


@router.get("/streams/history", response_model=List[StreamHistoryItemResponse])
def get_stream_history(
    employee_id: Optional[int] = None,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    """Return stream-related payroll history across the system or for one employee."""
    events = ReportingService.stream_history(session, employee_id=employee_id)
    return [_serialize_stream_history_item(event) for event in events]


# =========================
# SETTINGS
# =========================

@router.get("/settings/company-tax", response_model=CompanySettingsResponse)
def get_company_tax(
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    settings = session.query(CompanySettings).first()
    if not settings:
        settings = CompanySettings(default_tax_rate=Decimal("10.00"))
        session.add(settings)
        session.commit()
        session.refresh(settings)
    return CompanySettingsResponse(default_tax_rate=settings.default_tax_rate)


@router.post("/settings/company-tax", response_model=CompanySettingsResponse)
def update_company_tax(
    data: CompanySettingsUpdate,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    settings = session.query(CompanySettings).first()
    if not settings:
        settings = CompanySettings(default_tax_rate=data.default_tax_rate)
        session.add(settings)
    else:
        settings.default_tax_rate = data.default_tax_rate
    session.commit()
    session.refresh(settings)
    return CompanySettingsResponse(default_tax_rate=settings.default_tax_rate)


@router.get("/settings/tax-slabs", response_model=List[TaxSlabResponse])
def get_tax_slabs(
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    slabs = session.query(TaxSlab).all()
    return [
        TaxSlabResponse(
            id=s.id,
            min_income=s.min_income,
            max_income=s.max_income,
            tax_rate=s.tax_rate,
        )
        for s in slabs
    ]


@router.post("/settings/tax-slabs", response_model=TaxSlabResponse)
def create_tax_slab(
    data: TaxSlabCreate,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    slab = TaxSlab(
        min_income=data.min_income,
        max_income=data.max_income,
        tax_rate=data.tax_rate,
    )
    session.add(slab)
    session.commit()
    session.refresh(slab)
    return TaxSlabResponse(
        id=slab.id,
        min_income=slab.min_income,
        max_income=slab.max_income,
        tax_rate=slab.tax_rate,
    )


@router.delete("/settings/tax-slabs/{slab_id}")
def delete_tax_slab(
    slab_id: int,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    slab = session.query(TaxSlab).filter(TaxSlab.id == slab_id).first()
    if not slab:
        raise HTTPException(status_code=404, detail="Tax slab not found")
    session.delete(slab)
    session.commit()
    return {"message": "Deleted"}


# =========================
# EMPLOYEE SELF-SERVICE (for Frontendemployee)
# =========================

@router.get("/me/transactions", response_model=List[TransactionResponse])
def get_my_transactions(
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.get_current_user),
):
    """Returns transactions for the employee matching current user's email."""
    emp = session.query(Employee).filter(Employee.email == current_user.email).first()
    if not emp:
        return []
    return [
        TransactionResponse(
            id=t.id,
            employee_id=t.employee_id,
            amount=t.amount,
            tax_amount=t.tax_amount,
            description=t.description or "",
            timestamp=t.timestamp,
        )
        for t in emp.transactions
    ]


@router.get("/me/profile")
def get_my_profile(
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.get_current_user),
):
    """Returns the employee profile for the current user."""
    emp = session.query(Employee).filter(Employee.email == current_user.email).first()
    if not emp:
        return {
            "email": current_user.email,
            "role": current_user.role,
            "employee": None,
            "total_earned": 0,
        }
    total_earned = (
        session.query(func.sum(Transaction.amount))
        .filter(Transaction.employee_id == emp.id)
        .scalar()
        or 0
    )
    return {
        "email": current_user.email,
        "role": current_user.role,
        "employee": {
            "id": emp.id,
            "name": emp.name,
            "email": emp.email,
            "role": emp.role,
            "is_streaming": emp.is_streaming,
            "wallet_address": emp.wallet_address,
        },
        "total_earned": float(total_earned),
    }


@router.get("/me/stream", response_model=StreamDetailsResponse)
def get_my_stream(
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.get_current_user),
):
    """On-chain stream details for the logged-in employee (cached ≤30s)."""
    emp = session.query(Employee).filter(Employee.email == current_user.email).first()
    if not emp:
        from stream_chain import _empty_stream

        empty = _empty_stream(wallet_address=None)
        return StreamDetailsResponse(employee_id=None, **empty)

    from stream_chain import get_stream_details

    details = get_stream_details(emp.wallet_address or "")
    return StreamDetailsResponse(employee_id=emp.id, **details)


@router.get("/streams/{employee_id}", response_model=StreamDetailsResponse)
def get_employee_stream(
    employee_id: int,
    session: Session = Depends(db.get_db),
    _: User = Depends(SecurityService.require_dashboard_user),
):
    """On-chain stream details for HR dashboard (cached ≤30s)."""
    emp = session.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    from stream_chain import get_stream_details

    details = get_stream_details(emp.wallet_address or "")
    return StreamDetailsResponse(employee_id=emp.id, **details)


@router.put("/me/wallet")
def update_my_wallet(
    data: EmployeeWalletUpdate,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.get_current_user),
):
    emp = session.query(Employee).filter(Employee.email == current_user.email).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    wallet = (data.wallet_address or "").strip()
    if wallet and not wallet.startswith("0x"):
        raise HTTPException(status_code=400, detail="Invalid wallet address")
    emp.wallet_address = wallet or None
    session.commit()
    session.refresh(emp)
    return {"message": "Wallet updated", "wallet_address": emp.wallet_address}


@router.post("/me/withdrawals/record", response_model=BlockchainTxResponse, status_code=201)
def record_my_withdrawal(
    data: WithdrawalRecordCreate,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.get_current_user),
):
    """Persist a basic backend record after an employee confirms an on-chain withdrawal."""
    tx = PhaseOneService.record_withdrawal(
        session,
        employee_email=current_user.email,
        tx_hash=data.tx_hash,
        amount=data.amount,
    )
    return BlockchainTxResponse(
        tx_hash=tx.tx_hash,
        tx_type=tx.tx_type,
        status=tx.status,
        created_at=tx.created_at,
    )
