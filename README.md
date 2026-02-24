# 💼 CorePayroll – Full-Stack Decentralized Payroll System on HeLa Network

CorePayroll is a full-stack blockchain-based payroll management system built on the **HeLa Network**.  
It enables real-time salary streaming, automated tax deduction, transparent employee tracking, and employer-level treasury control.

This system integrates:

- ⚛ React Frontend
- 🐍 Python Backend
- ☁ Cloud Database
- ⛓ Smart Contracts on HeLa
- 🦊 MetaMask Integration

---

# 🌟 Vision

To build a transparent, programmable, and decentralized payroll infrastructure for Web3 startups, DAOs, and distributed teams.

---

# 🏗 System Architecture

Frontend (React)  
↓  
Backend (Python API Layer)  
↓  
Cloud Database  
↓  
HeLa Smart Contract (Blockchain Layer)

---

# 👨‍💼 User Roles

## 🔹 Employee

### Features

- 🔐 Secure Login
- 👤 Personal Profile Setup
- 📊 View Salary Details
- 💰 View Total Available Balance
- 📈 View Monthly Transactions
- 📜 Transaction History Access
- 🧾 Generate Monthly Salary Report
- 📉 Real-Time Salary Accrual
- 💸 Withdraw Earned Salary
- 🌾 Optional Yield Integration (Future Scope)

---

## 🔹 Employer (HR / Admin)

### Features

- 🔐 Secure Login
- 👥 View List of Employees
- 🔍 Employee Search
- 📊 Salary Dashboard
- 📈 View Employee Earnings
- 💰 Control Salary Flow
- 🏦 Fund Treasury
- 🚨 Emergency Treasury Withdrawal
- 📋 Monthly Reports Overview
- 🧾 Export Salary Data

---

# ⛓ Smart Contract Layer

## Core Functionalities

- Real-time salary streaming
- Per-second salary calculation
- Automatic tax deduction (10%)
- Tax routed to taxVault
- Emergency withdrawal by employer
- On-chain event logging

---

## Salary Calculation Logic

1. Calculate elapsed time  
2. Multiply by `ratePerSecond`  
3. Deduct 10% tax  
4. Transfer net salary  
5. Emit event  

All calculations are executed on-chain.

---

# ☁ Backend (Python)

Responsible for:

- Authentication
- Role management (Employer / Employee)
- Report generation
- Database interaction
- Aggregated analytics
- API endpoints

---

# 📊 Cloud Database

Stores:

- User profiles
- Stream configurations
- Monthly summaries
- Cached transaction data
- Dashboard statistics

The blockchain remains the source of truth for financial transactions.

---

# 🔐 Security Model

- Employer-only modifiers
- Solidity ^0.8.x overflow protection
- Require checks on fund transfers
- Treasury balance validation
- Role-based backend access

---

# 🌐 Network

- Blockchain: HeLa Network
- Environment: HeLa Testnet
- Wallet: MetaMask
- Development Tools: Remix, React, Python

---

# 🛠 Deployment Guide

### Smart Contract
- Compile in Remix
- Deploy using Injected Provider (MetaMask)
- Fund treasury with native HLT

### Backend
- Run Python server
- Connect to HeLa RPC

### Frontend
- React app connected via Web3 provider

---

# 🎯 Use Cases

- Web3 startup payroll
- DAO contributor payments
- Remote team salary streaming
- Transparent HR systems
- On-chain compensation automation

---

# 🔮 Future Enhancements

- DAO governance integration
- Multi-token salary support
- Adjustable tax logic
- Yield-bearing treasury
- Mobile dashboard
- Automated compliance tools

---

# 📜 License

MIT License
