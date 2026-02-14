from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import db

Base = db.Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    role = Column(String(50), default="employee")

    is_streaming = Column(Boolean, default=False)
    tax_rate = Column(Float, default=10.0)

    transactions = relationship("Transaction", back_populates="employee")

    def __repr__(self):
        return f"<Employee {self.name}>"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String(255))
    timestamp = Column(DateTime, default=datetime.utcnow)

    employee_id = Column(Integer, ForeignKey("employees.id"))
    employee = relationship("Employee", back_populates="transactions")

    def __repr__(self):
        return f"<Transaction {self.amount} for Employee {self.employee_id}>"


class Treasury(Base):
    __tablename__ = "treasury"

    id = Column(Integer, primary_key=True)
    total_balance = Column(Float, default=0.0)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="employee")
