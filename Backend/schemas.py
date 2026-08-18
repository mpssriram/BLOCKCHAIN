from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from decimal import Decimal


# =====================================================
# TRANSACTIONS
# =====================================================

class TransactionBase(BaseModel):
    amount: Decimal
    description: str


class TransactionCreate(TransactionBase):
    employee_id: int


class TransactionResponse(BaseModel):
    id: int
    employee_id: int
    amount: Decimal
    tax_amount: Decimal
    description: str
    timestamp: datetime

    model_config = {"from_attributes": True}


# =====================================================
# BONUS
# =====================================================

class BonusCreate(BaseModel):
    amount: Decimal
    reason: str


class BonusResponse(BaseModel):
    id: int
    employee_id: int
    amount: Decimal
    reason: str
    created_at: datetime

    model_config = {"from_attributes": True}


# =====================================================
# TREASURY ACTION
# =====================================================

class TreasuryAction(BaseModel):
    amount: Decimal


class TreasuryResponse(BaseModel):
    id: int
    total_balance: float
    onchain_balance: float
    last_tx_hash: Optional[str] = None
    last_synced_at: Optional[str] = None


class TreasuryHealthResponse(BaseModel):
    balance: float
    total_rate: float
    runway_sec: float
    status: Literal["safe", "warning", "critical"]
    is_low_treasury: bool


class TreasurySummaryResponse(BaseModel):
    treasury: TreasuryResponse
    health: TreasuryHealthResponse
    total_recorded_payout: float
    total_tax_collected: float
    active_streams: int
    recent_transactions: int


# =====================================================
# EMPLOYEES
# =====================================================

class EmployeeCreate(BaseModel):
    name: str
    email: str
    role: str = "employee"


class EmployeeResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    is_active: bool = True
    is_streaming: bool = False
    wallet_address: Optional[str] = None
    use_custom_tax: bool = False
    custom_tax_rate: Optional[Decimal] = None

    transactions: List[TransactionResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


# =====================================================
# EMPLOYEE TAX UPDATE
# =====================================================

class EmployeeTaxUpdate(BaseModel):
    use_custom_tax: bool
    custom_tax_rate: Optional[Decimal] = None


class EmployeeWalletUpdate(BaseModel):
    wallet_address: Optional[str] = None


# =====================================================
# COMPANY SETTINGS
# =====================================================

class CompanySettingsResponse(BaseModel):
    default_tax_rate: Decimal

    model_config = {"from_attributes": True}


class CompanySettingsUpdate(BaseModel):
    default_tax_rate: Decimal


# =====================================================
# TAX SLAB
# =====================================================

class TaxSlabCreate(BaseModel):
    min_income: Decimal
    max_income: Optional[Decimal] = None
    tax_rate: Decimal


class TaxSlabResponse(BaseModel):
    id: int
    min_income: Decimal
    max_income: Optional[Decimal]
    tax_rate: Decimal

    model_config = {"from_attributes": True}


# =====================================================
# USERS
# =====================================================

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["employer", "employee"]


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PortalHandoffExchange(BaseModel):
    code: str = Field(min_length=32, max_length=256)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    reset_token: str
    password: str = Field(min_length=8, max_length=128)


class PasswordResetOtpVerify(BaseModel):
    email: EmailStr
    otp: str = Field(pattern=r"^\d{6}$")


class FirebaseTokenExchange(BaseModel):
    id_token: str
    role_hint: str = "employee"


class Token(BaseModel):
    access_token: str
    token_type: str


class BlockchainTxCreate(BaseModel):
    tx_hash: str
    tx_type: str
    status: Optional[str] = "pending"


class BlockchainTxUpdate(BaseModel):
    status: str


class BlockchainTxResponse(BaseModel):
    tx_hash: str
    tx_type: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class StreamActionRecordCreate(BaseModel):
    employee_id: int
    tx_hash: str
    action: Literal["start", "pause", "cancel"]
    rate_per_second_wei: Optional[str] = None


class WithdrawalRecordCreate(BaseModel):
    tx_hash: str
    amount: Optional[Decimal] = None


class PayrollIntentCreate(BaseModel):
    idempotency_key: str
    intent_type: Literal["start_stream", "pause_stream", "cancel_stream", "withdraw"]
    employee_id: Optional[int] = None
    amount: Optional[Decimal] = None
    rate_per_second_wei: Optional[str] = None


class PayrollIntentSubmitTxHash(BaseModel):
    tx_hash: str


class PayrollIntentResponse(BaseModel):
    id: int
    idempotency_key: str
    intent_type: str
    employee_id: Optional[int] = None
    created_by_user_id: Optional[int] = None
    amount: Optional[Decimal] = None
    rate_per_second_wei: Optional[str] = None
    tx_hash: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BlockchainEventSyncResponse(BaseModel):
    from_block: int
    to_block: int
    processed_events: int
    stream_started: int
    withdrawals: int
    updated_transactions: int
    updated_payroll_events: int


class AdminLogCreate(BaseModel):
    action_type: str
    target_employee_id: Optional[int] = None
    tx_hash: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AdminLogResponse(BaseModel):
    id: int
    admin_id: int
    action_type: str
    target_employee_id: Optional[int] = None
    tx_hash: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime


class EmailRequest(BaseModel):
    to: EmailStr
    subject: str
    template: str
    context: Dict[str, Any] = Field(default_factory=dict)


class NotificationLogResponse(BaseModel):
    id: int
    channel: str
    recipient: str
    subject: Optional[str] = None
    template_name: Optional[str] = None
    status: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime


class StreamHistoryItemResponse(BaseModel):
    id: int
    employee_id: int
    event_type: str
    amount: Optional[Decimal] = None
    tx_hash: Optional[str] = None
    block_number: Optional[int] = None
    log_index: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime


class EmployeeReportResponse(BaseModel):
    employee: EmployeeResponse
    total_payout: float
    total_tax: float
    total_transactions: int
    total_bonuses: int
    stream_events: int
    recent_transactions: List[TransactionResponse] = Field(default_factory=list)
    stream_history: List[StreamHistoryItemResponse] = Field(default_factory=list)


# =====================================================
# ON-CHAIN STREAM (live salary)
# =====================================================

class StreamDetailsResponse(BaseModel):
    employee_id: Optional[int] = None
    wallet_address: Optional[str] = None
    contract_address: str = ""
    claimable_wei: str = "0"
    rate_per_second_wei: str = "0"
    accrued_balance_wei: str = "0"
    last_withdraw_time: int = 0
    last_update: int = 0
    is_active: bool = False
    status: str = "not_started"
    fetched_at: int = 0
    cached: bool = False
    reason: Optional[str] = None
