from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from database import db
from models import Employee, Treasury
from service import (
    EmployeeService,
    TransactionService,
    StreamingService,
    DashboardService
)
from schemas import (
    EmployeeCreate,
    EmployeeResponse,
    TransactionCreate,
    TransactionResponse
)

app = FastAPI(title="Payroll Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db.create_tables()


@app.post("/employees/", response_model=EmployeeResponse)
def create_employee(employee: EmployeeCreate, database: Session = Depends(db.get_db)):
    try:
        return EmployeeService.create_employee(
            database,
            employee.name,
            employee.email,
            employee.role
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/employees/", response_model=List[EmployeeResponse])
def list_employees(database: Session = Depends(db.get_db)):
    return database.query(Employee).all()


@app.get("/employees/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int, database: Session = Depends(db.get_db)):
    employee = EmployeeService.get_employee(database, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@app.delete("/employees/{employee_id}")
def delete_employee(employee_id: int, database: Session = Depends(db.get_db)):
    try:
        EmployeeService.delete_employee(database, employee_id)
        return {"success": True, "message": "Employee deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/stream/start/{employee_id}")
def start_stream(employee_id: int, database: Session = Depends(db.get_db)):
    try:
        return StreamingService.start_stream(database, employee_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/stream/pause/{employee_id}")
def pause_stream(employee_id: int, database: Session = Depends(db.get_db)):
    try:
        return StreamingService.pause_stream(database, employee_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/transactions/", response_model=TransactionResponse)
def create_transaction(transaction: TransactionCreate, database: Session = Depends(db.get_db)):
    try:
        return TransactionService.create_transaction(
            database,
            transaction.employee_id,
            transaction.amount,
            transaction.description
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get(
    "/employees/{employee_id}/transactions",
    response_model=List[TransactionResponse]
)
def get_transactions(employee_id: int, database: Session = Depends(db.get_db)):
    return TransactionService.get_employee_transactions(database, employee_id)


@app.get("/dashboard/treasury")
def get_treasury(database: Session = Depends(db.get_db)):
    treasury = database.query(Treasury).first()
    if not treasury:
        return {"total_balance": 0}
    return {"total_balance": treasury.total_balance}


@app.get("/dashboard/total-payout")
def total_payout(database: Session = Depends(db.get_db)):
    return DashboardService.total_payout(database)


@app.get("/dashboard/active-streams")
def active_streams(database: Session = Depends(db.get_db)):
    return DashboardService.active_streams(database)


@app.get("/dashboard/top-earners")
def top_earners(database: Session = Depends(db.get_db)):
    return DashboardService.top_earners(database)


@app.get("/dashboard/monthly-summary")
def monthly_summary(database: Session = Depends(db.get_db)):
    return DashboardService.monthly_summary(database)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", reload=True)

