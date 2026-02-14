from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from decimal import Decimal
from models import Employee, Transaction
from models import Treasury
from sqlalchemy import func

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
        except Exception:
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

        try:
            db.delete(employee)
            db.commit()
        except Exception:
            db.rollback()
            raise

class TransactionService:

    @staticmethod
    def create_transaction(
        db: Session,
        employee_id: int,
        amount: float,
        description: str
    ):
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise ValueError("Employee not found")

        if not employee.is_streaming:
            raise ValueError("Stream is not active for this employee")

        try:
            # Calculate tax
            tax_amount = (amount * employee.tax_rate) / 100
            net_amount = amount - tax_amount

            transaction = Transaction(
                employee_id=employee_id,
                amount=net_amount,
                description=description
            )

            db.add(transaction)

            treasury = db.query(Treasury).first()
            if not treasury:
                treasury = Treasury(total_balance=0.0)
                db.add(treasury)

            treasury.total_balance += tax_amount

            db.commit()
            db.refresh(transaction)

            return transaction

        except Exception:
            db.rollback()
            raise



class StreamingService:

    @staticmethod
    def start_stream(db: Session, employee_id: int):
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise ValueError("Employee not found")

        employee.is_streaming = True
        db.commit()
        return employee

    @staticmethod
    def pause_stream(db: Session, employee_id: int):
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise ValueError("Employee not found")

        employee.is_streaming = False
        db.commit()
        return employee

class DashboardService:

    @staticmethod
    def total_payout(db: Session):
        total = db.query(func.sum(Transaction.amount)).scalar()
        return {"total_paid": total or 0}

    @staticmethod
    def active_streams(db: Session):
        count = db.query(func.count(Employee.id))\
                  .filter(Employee.is_streaming == True)\
                  .scalar()
        return {"active_streams": count}

    @staticmethod
    def top_earners(db: Session):
        results = db.query(
            Employee.name,
            func.sum(Transaction.amount).label("total")
        ).join(Transaction)\
         .group_by(Employee.id)\
         .order_by(func.sum(Transaction.amount).desc())\
         .all()

        return [
            {"name": r[0], "total": float(r[1])}
            for r in results
        ]

    @staticmethod
    def monthly_summary(db: Session):
        results = db.query(
            func.date_format(Transaction.timestamp, "%Y-%m").label("month"),
            func.sum(Transaction.amount)
        ).group_by("month")\
         .order_by("month")\
         .all()

        return [
            {"month": r[0], "total": float(r[1])}
            for r in results
        ]

