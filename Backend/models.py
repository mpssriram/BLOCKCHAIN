from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    ForeignKey,
    DateTime,
    Boolean,
    JSON,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database import db

Base = db.Base


# ===============================
# EMPLOYEE
# ===============================
class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    role = Column(String(50), default="employee")

    is_active = Column(Boolean, default=True)
    is_streaming = Column(Boolean, default=False)

    # On-chain wallet address (for CorePayroll contract)
    wallet_address = Column(String(42), nullable=True)

    # 🔥 Simple Tax System
    use_custom_tax = Column(Boolean, default=False)
    custom_tax_rate = Column(Numeric(5, 2), nullable=True)

    transactions = relationship(
        "Transaction",
        back_populates="employee",
        cascade="all, delete-orphan"
    )

    bonuses = relationship(
        "Bonus",
        back_populates="employee",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Employee {self.name}>"


# ===============================
# TRANSACTIONS (Net + Tax Stored)
# ===============================
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)

    amount = Column(Numeric(12, 2), nullable=False)     # Net amount paid
    tax_amount = Column(Numeric(12, 2), default=0)     # Tax withheld

    description = Column(String(255))
    tx_hash = Column(String(255), nullable=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    employee_id = Column(Integer, ForeignKey("employees.id"))
    employee = relationship("Employee", back_populates="transactions")

    def __repr__(self):
        return f"<Transaction net={self.amount} tax={self.tax_amount} emp={self.employee_id}>"


# ===============================
# BONUS (Stores Gross Amount)
# ===============================
class Bonus(Base):
    __tablename__ = "bonuses"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(Integer, ForeignKey("employees.id"))
    amount = Column(Numeric(12, 2), nullable=False)  # Gross bonus

    reason = Column(String(255))
    tx_hash = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="bonuses")

    def __repr__(self):
        return f"<Bonus gross={self.amount} emp={self.employee_id}>"


# ===============================
# COMPANY SETTINGS
# ===============================
class CompanySettings(Base):
    __tablename__ = "company_settings"

    id = Column(Integer, primary_key=True)
    default_tax_rate = Column(Numeric(5, 2), default=10.00)


# ===============================
# TAX SLAB (Progressive Tax)
# ===============================
class TaxSlab(Base):
    __tablename__ = "tax_slabs"

    id = Column(Integer, primary_key=True, index=True)
    min_income = Column(Numeric(14, 2), nullable=False)
    max_income = Column(Numeric(14, 2), nullable=True)
    tax_rate = Column(Numeric(5, 2), nullable=False)


# ===============================
# TREASURY
# ===============================
class Treasury(Base):
    __tablename__ = "treasury"

    id = Column(Integer, primary_key=True)

    total_balance = Column(Numeric(14, 2), default=0.00)
    onchain_balance = Column(Numeric(14, 2), default=0.00)

    last_tx_hash = Column(String(255), nullable=True)
    last_synced_at = Column(DateTime, nullable=True)

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


# ===============================
# PAYROLL EVENT
# ===============================
class PayrollEvent(Base):
    __tablename__ = "payroll_events"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    event_type = Column(String(50), default="salary")
    amount = Column(Numeric(12, 2), nullable=True)
    tx_hash = Column(String(255), nullable=True, index=True)
    block_number = Column(Integer, nullable=True, index=True)
    log_index = Column(Integer, nullable=True)
    event_metadata = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ===============================
# PAYROLL INTENT
# ===============================
class PayrollIntent(Base):
    __tablename__ = "payroll_intents"

    id = Column(Integer, primary_key=True, index=True)
    idempotency_key = Column(String(120), unique=True, index=True, nullable=False)
    intent_type = Column(String(50), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True, index=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    amount = Column(Numeric(12, 2), nullable=True)
    rate_per_second_wei = Column(String(120), nullable=True)
    tx_hash = Column(String(255), nullable=True, index=True)
    status = Column(String(30), default="created", nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


# ===============================
# ADMIN ACTION LOG
# ===============================
class AdminActionLog(Base):
    __tablename__ = "admin_action_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action_type = Column(String(50), nullable=False, index=True)
    target_employee_id = Column(Integer, nullable=True, index=True)
    tx_hash = Column(String(255), nullable=True)
    action_metadata = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# ===============================
# NOTIFICATION LOG
# ===============================
class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    channel = Column(String(30), nullable=False, index=True)
    recipient = Column(String(255), nullable=False, index=True)
    subject = Column(String(255), nullable=True)
    template_name = Column(String(255), nullable=True)
    status = Column(String(30), default="sent", nullable=False, index=True)
    notification_metadata = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# ===============================
# BLOCKCHAIN TRANSACTION LOG
# ===============================
class BlockchainTransaction(Base):
    __tablename__ = "blockchain_transactions"

    id = Column(Integer, primary_key=True, index=True)

    tx_hash = Column(String(255), unique=True, index=True, nullable=False)
    tx_type = Column(String(50), nullable=False)
    status = Column(String(30), default="pending")

    created_at = Column(DateTime, default=datetime.utcnow)


# ===============================
# BLOCKCHAIN SYNC STATE
# ===============================
class BlockchainSyncState(Base):
    __tablename__ = "blockchain_sync_state"

    id = Column(Integer, primary_key=True)
    sync_key = Column(String(80), unique=True, nullable=False, index=True)
    last_synced_block = Column(Integer, default=0, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


# ===============================
# USER (Authentication)
# ===============================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="employee")
    session_version = Column(Integer, default=0, nullable=False)

    def __repr__(self):
        return f"<User {self.email}>"


class PasswordResetChallenge(Base):
    __tablename__ = "password_reset_challenges"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), nullable=False, index=True)
    otp_hash = Column(String(64), nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    verified_at = Column(DateTime, nullable=True)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AccessRequest(Base):
    __tablename__ = "access_requests"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    requested_role = Column(String(50), default="employee", nullable=False)
    status = Column(String(20), default="pending", nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)


class PortalHandoff(Base):
    __tablename__ = "portal_handoffs"

    id = Column(Integer, primary_key=True, index=True)
    code_hash = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
