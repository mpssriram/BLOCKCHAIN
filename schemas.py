from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List
from decimal import Decimal


class TransactionBase(BaseModel):
    amount: Decimal
    description: str


class TransactionCreate(TransactionBase):
    employee_id: int


class TransactionResponse(TransactionBase):
    id: int
    timestamp: datetime

    model_config = {"from_attributes": True}


class EmployeeCreate(BaseModel):
    name: str
    email: str
    role: str = "employee"


class EmployeeResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    transactions: List[TransactionResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

