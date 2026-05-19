from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from fastapi import HTTPException
from decimal import Decimal
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path
import smtplib
from email.mime.text import MIMEText
from web3 import Web3

from models import (
    AdminActionLog,
    BlockchainSyncState,
    Employee,
    Transaction,
    Treasury,
    BlockchainTransaction,
    Bonus,
    CompanySettings,
    NotificationLog,
    PayrollEvent,
    PayrollIntent,
    TaxSlab,
)
from config import settings

DEFAULT_STREAM_RATE_PER_SEC = Decimal("1.00")
CHAIN_EVENT_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "address", "name": "employee", "type": "address"},
            {"indexed": False, "internalType": "uint256", "name": "rate", "type": "uint256"},
        ],
        "name": "StreamStarted",
        "type": "event",
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "address", "name": "employee", "type": "address"},
            {"indexed": False, "internalType": "uint256", "name": "netAmount", "type": "uint256"},
            {"indexed": False, "internalType": "uint256", "name": "taxAmount", "type": "uint256"},
        ],
        "name": "Withdrawal",
        "type": "event",
    },
]


def _to_decimal(value) -> Decimal:
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def _quantize_currency(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"))


def _month_filter(db: Session, year: int, month: int):
    dialect = (db.bind.dialect.name if db.bind else "sqlite").lower()
    if dialect in ("postgresql", "postgres"):
        return (
            func.extract("year", Transaction.timestamp) == year,
            func.extract("month", Transaction.timestamp) == month,
        )
    if dialect in ("mysql", "mariadb"):
        return (
            func.year(Transaction.timestamp) == year,
            func.month(Transaction.timestamp) == month,
        )
    return (
        func.strftime("%Y", Transaction.timestamp) == f"{year:04d}",
        func.strftime("%m", Transaction.timestamp) == f"{month:02d}",
    )


def read_onchain_balance() -> Decimal:
    """
    Placeholder for chain RPC integration.
    Replace this with an actual on-chain balance reader when the treasury wallet is wired.
    """
    raise NotImplementedError("Treasury on-chain sync is not implemented yet.")

# =====================================================
# EMPLOYEE SERVICE
# =====================================================
class EmployeeService:

    @staticmethod
    def create_employee(db: Session, name: str, email: str, role: str):
        existing = db.query(Employee).filter(Employee.email == email).first()
        if existing:
            raise ValueError("Email already exists")

        employee = Employee(name=name, email=email, role=role)

        try:
            db.add(employee)
            db.commit()
            db.refresh(employee)
            return employee
        except IntegrityError:
            db.rollback()
            raise


    @staticmethod
    def get_employee(db: Session, employee_id: int):
        return db.query(Employee).filter(Employee.id == employee_id).first()


    @staticmethod
    def delete_employee(db: Session, employee_id: int):
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise ValueError("Employee not found")

        db.delete(employee)
        db.commit()


# =====================================================
# TAX SERVICE (CUSTOM → COMPANY DEFAULT ONLY)
# =====================================================
class TaxService:

    @staticmethod
    def calculate_tax(db: Session, employee: Employee, gross_amount: float):

        # 1️⃣ Employee custom override
        if employee.use_custom_tax and employee.custom_tax_rate:
            rate = float(employee.custom_tax_rate)
            return (gross_amount * rate) / 100.0

        # 2️⃣ Company default tax
        company_settings = db.query(CompanySettings).first()
        rate = float(company_settings.default_tax_rate) if company_settings else float(settings.TAX_RATE)

        return (gross_amount * rate) / 100.0


# =====================================================
# TREASURY SERVICE
# =====================================================
class TreasuryService:

    @staticmethod
    def get_or_create(db: Session):
        treasury = db.query(Treasury).first()
        if not treasury:
            treasury = Treasury(total_balance=Decimal("0.00"), onchain_balance=Decimal("0.00"))
            db.add(treasury)
            db.commit()
            db.refresh(treasury)
        return treasury


    @staticmethod
    def deposit_web2(db: Session, amount: float):
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than 0")

        treasury = TreasuryService.get_or_create(db)
        amt = _to_decimal(amount)
        treasury.total_balance = _to_decimal(treasury.total_balance) + amt

        db.commit()
        db.refresh(treasury)
        return treasury


    @staticmethod
    def withdraw_web2(db: Session, amount: float):
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than 0")

        treasury = TreasuryService.get_or_create(db)

        amt = _to_decimal(amount)
        current = _to_decimal(treasury.total_balance)

        if current < amt:
            raise HTTPException(status_code=400, detail="Insufficient balance")

        treasury.total_balance = current - amt

        db.commit()
        db.refresh(treasury)
        return treasury

    @staticmethod
    def serialize_treasury(treasury: Treasury) -> Dict[str, Optional[float]]:
        return {
            "id": treasury.id,
            "total_balance": float(treasury.total_balance or 0),
            "onchain_balance": float(treasury.onchain_balance or 0),
            "last_tx_hash": treasury.last_tx_hash,
            "last_synced_at": treasury.last_synced_at.isoformat() if treasury.last_synced_at else None,
        }

    @staticmethod
    def health_summary(db: Session) -> Dict[str, float | bool | str]:
        treasury = TreasuryService.get_or_create(db)
        active_streams = (
            db.query(func.count(Employee.id))
            .filter(Employee.is_streaming == True)
            .scalar()
            or 0
        )
        total_rate = float(DEFAULT_STREAM_RATE_PER_SEC * Decimal(active_streams))
        balance = float(treasury.total_balance or 0)
        runway_sec = balance / total_rate if total_rate > 0 else float("inf")

        if runway_sec > 7 * 24 * 3600:
            status = "safe"
        elif runway_sec > 3 * 24 * 3600:
            status = "warning"
        else:
            status = "critical"

        return {
            "balance": balance,
            "total_rate": total_rate,
            "runway_sec": runway_sec,
            "status": status,
            "is_low_treasury": runway_sec < 7 * 24 * 3600,
        }

    @staticmethod
    def summary(db: Session) -> Dict[str, object]:
        treasury = TreasuryService.get_or_create(db)
        health = TreasuryService.health_summary(db)
        total_recorded_payout = float(db.query(func.sum(Transaction.amount)).scalar() or 0)
        total_tax_collected = float(db.query(func.sum(Transaction.tax_amount)).scalar() or 0)
        active_streams = int(
            db.query(func.count(Employee.id)).filter(Employee.is_streaming == True).scalar() or 0
        )
        recent_transactions = int(db.query(func.count(Transaction.id)).scalar() or 0)
        return {
            "treasury": TreasuryService.serialize_treasury(treasury),
            "health": health,
            "total_recorded_payout": total_recorded_payout,
            "total_tax_collected": total_tax_collected,
            "active_streams": active_streams,
            "recent_transactions": recent_transactions,
        }


class TreasurySyncService:

    @staticmethod
    def sync_onchain_balance(session: Session) -> Treasury:
        try:
            onchain_balance = read_onchain_balance()
        except NotImplementedError as exc:
            raise HTTPException(
                status_code=501,
                detail="Treasury on-chain sync is not implemented yet.",
            ) from exc

        treasury = TreasuryService.get_or_create(session)
        treasury.onchain_balance = onchain_balance
        treasury.last_synced_at = datetime.utcnow()
        session.commit()
        session.refresh(treasury)
        return treasury


# =====================================================
# TRANSACTION SERVICE (SALARY)
# =====================================================
class TransactionService:

    @staticmethod
    def create_transaction(db: Session, employee_id: int, gross_amount: float, description: str):

        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        if not employee.is_streaming:
            raise HTTPException(status_code=400, detail="Stream is not active")

        if gross_amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")

        treasury = TreasuryService.get_or_create(db)

        tax_amount = TaxService.calculate_tax(db, employee, gross_amount)
        net_amount = gross_amount - tax_amount

        net_amt_dec = _to_decimal(net_amount)
        tax_amt_dec = _to_decimal(tax_amount)
        treasury_balance = _to_decimal(treasury.total_balance)

        if treasury_balance < net_amt_dec:
            raise HTTPException(status_code=400, detail="Insufficient treasury funds")

        treasury.total_balance = treasury_balance - net_amt_dec

        transaction = Transaction(
            employee_id=employee_id,
            amount=net_amt_dec,
            tax_amount=tax_amt_dec,
            description=description
        )
        payroll_event = PayrollEvent(
            employee_id=employee_id,
            event_type="salary",
            amount=_to_decimal(gross_amount),
        )

        db.add(transaction)
        db.add(payroll_event)
        db.commit()
        db.refresh(transaction)

        return transaction


# =====================================================
# BONUS SERVICE
# =====================================================
class BonusService:

    @staticmethod
    def give_bonus(db: Session, employee_id: int, gross_amount: float, reason: str):

        if gross_amount <= 0:
            raise HTTPException(status_code=400, detail="Bonus must be positive")

        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        treasury = TreasuryService.get_or_create(db)

        tax_amount = TaxService.calculate_tax(db, employee, gross_amount)
        net_amount = gross_amount - tax_amount

        net_amt_dec = _to_decimal(net_amount)
        tax_amt_dec = _to_decimal(tax_amount)
        treasury_balance = _to_decimal(treasury.total_balance)

        if treasury_balance < net_amt_dec:
            raise HTTPException(status_code=400, detail="Insufficient treasury funds")

        treasury.total_balance = treasury_balance - net_amt_dec

        bonus = Bonus(
            employee_id=employee_id,
            amount=_to_decimal(gross_amount),
            reason=reason
        )

        transaction = Transaction(
            employee_id=employee_id,
            amount=net_amt_dec,
            tax_amount=tax_amt_dec,
            description=f"Bonus: {reason}"
        )
        payroll_event = PayrollEvent(
            employee_id=employee_id,
            event_type="bonus",
            amount=_to_decimal(gross_amount),
        )

        db.add(bonus)
        db.add(transaction)
        db.add(payroll_event)

        db.commit()
        db.refresh(bonus)

        return bonus


# =====================================================
# DASHBOARD SERVICE
# =====================================================
class DashboardService:

    @staticmethod
    def total_payout(db: Session):
        total_net = db.query(func.sum(Transaction.amount)).scalar() or 0
        return {"total_paid_net": float(total_net)}

    @staticmethod
    def total_tax_collected(db: Session):
        total_tax = db.query(func.sum(Transaction.tax_amount)).scalar() or 0
        return {"total_tax_collected": float(total_tax)}

    @staticmethod
    def active_streams(db: Session):
        count = db.query(func.count(Employee.id)) \
                  .filter(Employee.is_streaming == True) \
                  .scalar() or 0
        return {"active_streams": int(count)}

    @staticmethod
    def top_earners(db: Session):
        results = (
            db.query(Employee.name, func.sum(Transaction.amount))
            .join(Transaction)
            .group_by(Employee.id)
            .order_by(func.sum(Transaction.amount).desc())
            .all()
        )

        return [{"name": r[0], "total_net": float(r[1] or 0)} for r in results]

    @staticmethod
    def monthly_summary(db: Session):
        dialect = (db.bind.dialect.name if db.bind else "sqlite").lower()
        if dialect in ("sqlite"):
            month_expr = func.strftime("%Y-%m", Transaction.timestamp)
        elif dialect in ("mysql", "mariadb"):
            month_expr = func.date_format(Transaction.timestamp, "%Y-%m")
        elif dialect in ("postgresql", "postgres"):
            month_expr = func.to_char(Transaction.timestamp, "YYYY-MM")
        else:
            month_expr = func.strftime("%Y-%m", Transaction.timestamp)
        results = (
            db.query(
                month_expr.label("month"),
                func.sum(Transaction.amount).label("income"),
                func.sum(Transaction.tax_amount).label("tax"),
            )
            .group_by(month_expr)
            .order_by("month")
            .all()
        )
        out = []
        for r in results:
            month_val = r[0] if r[0] else "0000-00"
            net = float(r[1] or 0)
            tax = float(r[2] or 0)
            gross = net + tax
            out.append({
                "month": month_val,
                "income": gross,
                "tax": tax,
                "net": net,
            })
        return out

    @staticmethod
    def monthly_report(db: Session, year: int, month: int) -> Dict[str, object]:
        filters = _month_filter(db, year, month)
        rows = (
            db.query(
                Employee.id.label("employee_id"),
                Employee.name.label("employee_name"),
                func.sum(Transaction.amount).label("total_payout"),
                func.sum(Transaction.tax_amount).label("total_tax"),
            )
            .join(Transaction, Transaction.employee_id == Employee.id)
            .filter(*filters)
            .group_by(Employee.id, Employee.name)
            .order_by(Employee.name.asc())
            .all()
        )

        breakdown = []
        total_payout = Decimal("0.00")
        total_tax = Decimal("0.00")
        for row in rows:
            payout = _to_decimal(row.total_payout or 0)
            tax = _to_decimal(row.total_tax or 0)
            total_payout += payout
            total_tax += tax
            breakdown.append({
                "employee_id": row.employee_id,
                "employee_name": row.employee_name,
                "total_payout": float(payout),
                "total_tax": float(tax),
                "gross_amount": float(payout + tax),
            })

        return {
            "year": year,
            "month": month,
            "total_payout": float(total_payout),
            "total_tax": float(total_tax),
            "breakdown": breakdown,
        }

    @staticmethod
    def tax_report(db: Session, year: int, month: int) -> Dict[str, object]:
        filters = _month_filter(db, year, month)
        total_tax = _to_decimal(
            db.query(func.sum(Transaction.tax_amount)).filter(*filters).scalar() or 0
        )
        slabs = db.query(TaxSlab).order_by(TaxSlab.min_income.asc()).all()
        slab_rows = [
            {
                "id": slab.id,
                "min_income": float(slab.min_income),
                "max_income": float(slab.max_income) if slab.max_income is not None else None,
                "tax_rate": float(slab.tax_rate),
            }
            for slab in slabs
        ]

        return {
            "year": year,
            "month": month,
            "total_tax_collected": float(total_tax),
            "tax_slabs": slab_rows,
        }


class AdminActionLogService:

    @staticmethod
    def create_log(
        db: Session,
        admin_id: int,
        action_type: str,
        target_employee_id: Optional[int] = None,
        tx_hash: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> AdminActionLog:
        log = AdminActionLog(
            admin_id=admin_id,
            action_type=action_type,
            target_employee_id=target_employee_id,
            tx_hash=tx_hash,
            action_metadata=metadata,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def list_logs(
        db: Session,
        admin_id: Optional[int] = None,
        action_type: Optional[str] = None,
        employee_id: Optional[int] = None,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
    ) -> List[AdminActionLog]:
        query = db.query(AdminActionLog)
        if admin_id is not None:
            query = query.filter(AdminActionLog.admin_id == admin_id)
        if action_type:
            query = query.filter(AdminActionLog.action_type == action_type)
        if employee_id is not None:
            query = query.filter(AdminActionLog.target_employee_id == employee_id)
        if start is not None:
            query = query.filter(AdminActionLog.created_at >= start)
        if end is not None:
            query = query.filter(AdminActionLog.created_at <= end)
        return query.order_by(AdminActionLog.created_at.desc()).all()


class NotificationLogService:

    @staticmethod
    def create_log(
        db: Session,
        *,
        channel: str,
        recipient: str,
        subject: Optional[str] = None,
        template_name: Optional[str] = None,
        status: str = "sent",
        metadata: Optional[dict] = None,
    ) -> NotificationLog:
        log = NotificationLog(
            channel=channel,
            recipient=recipient,
            subject=subject,
            template_name=template_name,
            status=status,
            notification_metadata=metadata,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def list_logs(
        db: Session,
        *,
        channel: Optional[str] = None,
        recipient: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[NotificationLog]:
        query = db.query(NotificationLog)
        if channel:
            query = query.filter(NotificationLog.channel == channel)
        if recipient:
            query = query.filter(NotificationLog.recipient == recipient)
        if status:
            query = query.filter(NotificationLog.status == status)
        return query.order_by(NotificationLog.created_at.desc()).all()


class EmailNotifier:
    def __init__(self, smtp_server: str, smtp_port: int, username: str, password: str):
        self.server = smtp_server
        self.port = smtp_port
        self.username = username
        self.password = password

    def send(self, to: str, subject: str, html_body: str):
        message = MIMEText(html_body, "html")
        message["Subject"] = subject
        message["From"] = self.username
        message["To"] = to

        try:
            with smtplib.SMTP(self.server, self.port) as smtp:
                smtp.starttls()
                if self.username:
                    smtp.login(self.username, self.password)
                smtp.sendmail(self.username, [to], message.as_string())
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to send email: {exc}")


class NotificationService:

    @staticmethod
    def render_template(template_name: str, context: dict) -> str:
        template_path = Path(__file__).resolve().parent / "templates" / template_name
        if not template_path.exists():
            raise HTTPException(status_code=404, detail="Template not found")
        html = template_path.read_text(encoding="utf-8")
        # Placeholder render step. Replace with MJML/Jinja rendering if templates become dynamic.
        for key, value in context.items():
            html = html.replace(f"{{{{ {key} }}}}", str(value))
        return html


class ReportingService:

    STREAM_EVENT_TYPES = {"stream_started", "stream_paused", "stream_cancelled", "stream_start", "stream_pause", "stream_cancel"}

    @staticmethod
    def employee_report(db: Session, employee_id: int) -> Dict[str, object]:
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        total_payout = float(
            db.query(func.sum(Transaction.amount)).filter(Transaction.employee_id == employee_id).scalar() or 0
        )
        total_tax = float(
            db.query(func.sum(Transaction.tax_amount)).filter(Transaction.employee_id == employee_id).scalar() or 0
        )
        total_transactions = int(
            db.query(func.count(Transaction.id)).filter(Transaction.employee_id == employee_id).scalar() or 0
        )
        total_bonuses = int(
            db.query(func.count(Bonus.id)).filter(Bonus.employee_id == employee_id).scalar() or 0
        )
        stream_history = (
            db.query(PayrollEvent)
            .filter(
                PayrollEvent.employee_id == employee_id,
                PayrollEvent.event_type.in_(tuple(ReportingService.STREAM_EVENT_TYPES)),
            )
            .order_by(PayrollEvent.created_at.desc())
            .limit(20)
            .all()
        )
        recent_transactions = (
            db.query(Transaction)
            .filter(Transaction.employee_id == employee_id)
            .order_by(Transaction.timestamp.desc())
            .limit(10)
            .all()
        )

        return {
            "employee": employee,
            "total_payout": total_payout,
            "total_tax": total_tax,
            "total_transactions": total_transactions,
            "total_bonuses": total_bonuses,
            "stream_events": len(stream_history),
            "recent_transactions": recent_transactions,
            "stream_history": stream_history,
        }

    @staticmethod
    def stream_history(
        db: Session,
        employee_id: Optional[int] = None,
    ) -> List[PayrollEvent]:
        query = db.query(PayrollEvent).filter(
            PayrollEvent.event_type.in_(tuple(ReportingService.STREAM_EVENT_TYPES))
        )
        if employee_id is not None:
            query = query.filter(PayrollEvent.employee_id == employee_id)
        return query.order_by(PayrollEvent.created_at.desc()).all()


class BlockchainEventSyncService:

    SYNC_KEY = "corepayroll_events"

    @staticmethod
    def _get_web3() -> Web3:
        rpc_url = settings.HELA_RPC_URL or "https://testnet-rpc.helachain.com"
        web3 = Web3(Web3.HTTPProvider(rpc_url))
        if not web3.is_connected():
            raise HTTPException(status_code=503, detail="Unable to connect to HeLa RPC")
        return web3

    @staticmethod
    def _get_contract(web3: Web3):
        contract_address = (settings.CONTRACT_ADDRESS or "").strip()
        if not contract_address:
            raise HTTPException(status_code=503, detail="CONTRACT_ADDRESS is not configured")
        return web3.eth.contract(address=Web3.to_checksum_address(contract_address), abi=CHAIN_EVENT_ABI)

    @staticmethod
    def _get_sync_state(db: Session) -> BlockchainSyncState:
        state = db.query(BlockchainSyncState).filter(BlockchainSyncState.sync_key == BlockchainEventSyncService.SYNC_KEY).first()
        if not state:
            state = BlockchainSyncState(sync_key=BlockchainEventSyncService.SYNC_KEY, last_synced_block=0)
            db.add(state)
            db.commit()
            db.refresh(state)
        return state

    @staticmethod
    def _get_employee_by_wallet(db: Session, wallet_address: str) -> Optional[Employee]:
        return (
            db.query(Employee)
            .filter(func.lower(Employee.wallet_address) == wallet_address.lower())
            .first()
        )

    @staticmethod
    def _get_or_create_payroll_event(
        db: Session,
        *,
        employee_id: int,
        tx_hash: str,
        block_number: int,
        log_index: int,
        event_type: str,
        amount: Optional[Decimal],
        metadata: Optional[dict],
    ) -> PayrollEvent:
        existing = (
            db.query(PayrollEvent)
            .filter(PayrollEvent.tx_hash == tx_hash, PayrollEvent.log_index == log_index)
            .first()
        )
        if existing:
            return existing

        payroll_event = PayrollEvent(
            employee_id=employee_id,
            event_type=event_type,
            amount=amount,
            tx_hash=tx_hash,
            block_number=block_number,
            log_index=log_index,
            event_metadata=metadata,
        )
        db.add(payroll_event)
        return payroll_event

    @staticmethod
    def sync_events(db: Session, from_block: Optional[int] = None, to_block: Optional[int] = None) -> Dict[str, int]:
        web3 = BlockchainEventSyncService._get_web3()
        contract = BlockchainEventSyncService._get_contract(web3)
        state = BlockchainEventSyncService._get_sync_state(db)

        latest_block = int(web3.eth.block_number)
        start_block = int(from_block if from_block is not None else state.last_synced_block + 1)
        end_block = int(to_block if to_block is not None else latest_block)

        if end_block < start_block:
            return {
                "from_block": start_block,
                "to_block": end_block,
                "processed_events": 0,
                "stream_started": 0,
                "withdrawals": 0,
                "updated_transactions": 0,
                "updated_payroll_events": 0,
            }

        processed_events = 0
        stream_started = 0
        withdrawals = 0
        updated_transactions = 0
        updated_payroll_events = 0

        stream_logs = contract.events.StreamStarted.get_logs(from_block=start_block, to_block=end_block)
        withdrawal_logs = contract.events.Withdrawal.get_logs(from_block=start_block, to_block=end_block)
        all_logs = sorted([*stream_logs, *withdrawal_logs], key=lambda log: (log["blockNumber"], log["logIndex"]))

        for log in all_logs:
            event_name = log["event"]
            tx_hash = log["transactionHash"].hex()
            block_number = int(log["blockNumber"])
            log_index = int(log["logIndex"])
            args = log["args"]
            employee_wallet = str(args["employee"])
            employee = BlockchainEventSyncService._get_employee_by_wallet(db, employee_wallet)
            if not employee:
                continue

            if event_name == "StreamStarted":
                employee.is_streaming = True
                BlockchainTxService.upsert_tx(db, tx_hash=tx_hash, tx_type="start_stream", status="confirmed")
                PayrollIntentService.sync_intent_status_from_tx(db, tx_hash=tx_hash, status="confirmed")
                BlockchainEventSyncService._get_or_create_payroll_event(
                    db,
                    employee_id=employee.id,
                    tx_hash=tx_hash,
                    block_number=block_number,
                    log_index=log_index,
                    event_type="stream_started",
                    amount=None,
                    metadata={
                        "wallet_address": employee_wallet,
                        "rate_per_second_wei": str(args["rate"]),
                    },
                )
                stream_started += 1
                updated_payroll_events += 1

            elif event_name == "Withdrawal":
                net_amount = _quantize_currency(_to_decimal(Web3.from_wei(args["netAmount"], "ether")))
                tax_amount = _quantize_currency(_to_decimal(Web3.from_wei(args["taxAmount"], "ether")))
                total_amount = _quantize_currency(net_amount + tax_amount)

                BlockchainTxService.upsert_tx(db, tx_hash=tx_hash, tx_type="withdraw", status="confirmed")
                PayrollIntentService.sync_intent_status_from_tx(db, tx_hash=tx_hash, status="confirmed")

                existing_transaction = db.query(Transaction).filter(Transaction.tx_hash == tx_hash).first()
                if existing_transaction:
                    existing_transaction.amount = net_amount
                    existing_transaction.tax_amount = tax_amount
                    existing_transaction.description = existing_transaction.description or "On-chain withdrawal"
                else:
                    db.add(
                        Transaction(
                            employee_id=employee.id,
                            amount=net_amount,
                            tax_amount=tax_amount,
                            description="On-chain withdrawal",
                            tx_hash=tx_hash,
                        )
                    )
                BlockchainEventSyncService._get_or_create_payroll_event(
                    db,
                    employee_id=employee.id,
                    tx_hash=tx_hash,
                    block_number=block_number,
                    log_index=log_index,
                    event_type="withdrawn",
                    amount=total_amount,
                    metadata={
                        "wallet_address": employee_wallet,
                        "net_amount": float(net_amount),
                        "tax_amount": float(tax_amount),
                    },
                )
                withdrawals += 1
                updated_transactions += 1
                updated_payroll_events += 1

            processed_events += 1

        state.last_synced_block = end_block
        db.commit()

        return {
            "from_block": start_block,
            "to_block": end_block,
            "processed_events": processed_events,
            "stream_started": stream_started,
            "withdrawals": withdrawals,
            "updated_transactions": updated_transactions,
            "updated_payroll_events": updated_payroll_events,
        }


class PayrollIntentService:

    @staticmethod
    def create_intent(
        db: Session,
        *,
        idempotency_key: str,
        intent_type: str,
        employee_id: Optional[int] = None,
        created_by_user_id: Optional[int] = None,
        amount: Optional[Decimal] = None,
        rate_per_second_wei: Optional[str] = None,
    ) -> PayrollIntent:
        key = (idempotency_key or "").strip()
        if not key:
            raise HTTPException(status_code=400, detail="idempotency_key is required")

        existing = db.query(PayrollIntent).filter(PayrollIntent.idempotency_key == key).first()
        if existing:
            return existing

        if employee_id is not None:
            employee = db.query(Employee).filter(Employee.id == employee_id).first()
            if not employee:
                raise HTTPException(status_code=404, detail="Employee not found")

        intent = PayrollIntent(
            idempotency_key=key,
            intent_type=intent_type,
            employee_id=employee_id,
            created_by_user_id=created_by_user_id,
            amount=_to_decimal(amount) if amount is not None else None,
            rate_per_second_wei=rate_per_second_wei,
            status="created",
        )
        db.add(intent)
        db.commit()
        db.refresh(intent)
        return intent

    @staticmethod
    def get_intent(db: Session, intent_id: int) -> PayrollIntent:
        intent = db.query(PayrollIntent).filter(PayrollIntent.id == intent_id).first()
        if not intent:
            raise HTTPException(status_code=404, detail="Payroll intent not found")
        return intent

    @staticmethod
    def list_intents(
        db: Session,
        *,
        employee_id: Optional[int] = None,
        status: Optional[str] = None,
        intent_type: Optional[str] = None,
    ) -> List[PayrollIntent]:
        query = db.query(PayrollIntent)
        if employee_id is not None:
            query = query.filter(PayrollIntent.employee_id == employee_id)
        if status:
            query = query.filter(PayrollIntent.status == status)
        if intent_type:
            query = query.filter(PayrollIntent.intent_type == intent_type)
        return query.order_by(PayrollIntent.created_at.desc()).all()

    @staticmethod
    def submit_tx_hash(
        db: Session,
        *,
        intent_id: int,
        tx_hash: str,
    ) -> PayrollIntent:
        intent = PayrollIntentService.get_intent(db, intent_id)
        clean_hash = (tx_hash or "").strip()
        if not clean_hash.startswith("0x"):
            raise HTTPException(status_code=400, detail="Invalid tx_hash")

        if intent.tx_hash:
            if intent.tx_hash == clean_hash:
                return intent
            raise HTTPException(status_code=409, detail="tx_hash already submitted for this intent")

        existing_tx = db.query(BlockchainTransaction).filter(BlockchainTransaction.tx_hash == clean_hash).first()
        if existing_tx and existing_tx.tx_type != intent.intent_type:
            raise HTTPException(status_code=409, detail="tx_hash is already associated with another transaction type")

        BlockchainTxService.upsert_tx(
            db,
            tx_hash=clean_hash,
            tx_type=intent.intent_type,
            status="submitted",
        )
        intent.tx_hash = clean_hash
        intent.status = "submitted"
        db.commit()
        db.refresh(intent)
        return intent

    @staticmethod
    def sync_intent_status_from_tx(db: Session, tx_hash: str, status: str) -> None:
        intent = db.query(PayrollIntent).filter(PayrollIntent.tx_hash == tx_hash).first()
        if not intent:
            return
        intent.status = status
        db.commit()


class PhaseOneService:

    @staticmethod
    def record_stream_action(
        db: Session,
        employee_id: int,
        tx_hash: str,
        action: str,
        rate_per_second_wei: Optional[str] = None,
    ) -> BlockchainTransaction:
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        clean_hash = (tx_hash or "").strip()
        if not clean_hash.startswith("0x"):
            raise HTTPException(status_code=400, detail="Invalid tx_hash")

        action_name = (action or "").strip().lower()
        if action_name not in {"start", "pause", "cancel"}:
            raise HTTPException(status_code=400, detail="Invalid stream action")

        tx = BlockchainTxService.upsert_tx(
            db,
            tx_hash=clean_hash,
            tx_type=f"stream_{action_name}",
            status="confirmed",
        )
        db.add(
            PayrollEvent(
                employee_id=employee_id,
                event_type=f"stream_{action_name}",
                amount=None,
            )
        )
        db.commit()
        return tx

    @staticmethod
    def record_withdrawal(
        db: Session,
        employee_email: str,
        tx_hash: str,
        amount: Optional[Decimal] = None,
    ) -> BlockchainTransaction:
        employee = db.query(Employee).filter(Employee.email == employee_email).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        clean_hash = (tx_hash or "").strip()
        if not clean_hash.startswith("0x"):
            raise HTTPException(status_code=400, detail="Invalid tx_hash")

        tx = BlockchainTxService.upsert_tx(
            db,
            tx_hash=clean_hash,
            tx_type="withdraw",
            status="confirmed",
        )
        db.add(
            PayrollEvent(
                employee_id=employee.id,
                event_type="withdrawal",
                amount=_to_decimal(amount or 0),
            )
        )
        db.commit()
        return tx

# =====================================================
# STREAMING SERVICE
# =====================================================
class StreamingService:

    @staticmethod
    def start_stream(db: Session, employee_id: int):
        employee = db.query(Employee).filter(Employee.id == employee_id).first()

        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        employee.is_streaming = True

        db.commit()
        db.refresh(employee)

        return {
            "success": True,
            "employee_id": employee.id,
            "is_streaming": employee.is_streaming,
            "stream_action": "active",
        }


    @staticmethod
    def pause_stream(db: Session, employee_id: int):
        employee = db.query(Employee).filter(Employee.id == employee_id).first()

        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        employee.is_streaming = False

        db.commit()
        db.refresh(employee)

        return {
            "success": True,
            "employee_id": employee.id,
            "is_streaming": employee.is_streaming,
            "stream_action": "paused",
        }

    @staticmethod
    def cancel_stream(db: Session, employee_id: int):
        employee = db.query(Employee).filter(Employee.id == employee_id).first()

        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        employee.is_streaming = False

        db.commit()
        db.refresh(employee)

        return {
            "success": True,
            "employee_id": employee.id,
            "is_streaming": employee.is_streaming,
            "stream_action": "cancelled",
        }


# =====================================================
# BLOCKCHAIN TX SERVICE (On-chain status tracking)
# =====================================================
class BlockchainTxService:

    @staticmethod
    def upsert_tx(db: Session, tx_hash: str, tx_type: str, status: str = "pending") -> BlockchainTransaction:
        existing = db.query(BlockchainTransaction).filter(BlockchainTransaction.tx_hash == tx_hash).first()
        if existing:
            existing.tx_type = tx_type
            existing.status = status
            db.commit()
            db.refresh(existing)
            return existing

        tx = BlockchainTransaction(tx_hash=tx_hash, tx_type=tx_type, status=status)
        db.add(tx)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def get_tx(db: Session, tx_hash: str) -> Optional[BlockchainTransaction]:
        return db.query(BlockchainTransaction).filter(BlockchainTransaction.tx_hash == tx_hash).first()

    @staticmethod
    def update_status(db: Session, tx_hash: str, status: str) -> BlockchainTransaction:
        tx = db.query(BlockchainTransaction).filter(BlockchainTransaction.tx_hash == tx_hash).first()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")
        tx.status = status
        db.commit()
        db.refresh(tx)
        PayrollIntentService.sync_intent_status_from_tx(db, tx_hash=tx_hash, status=status)
        return tx


