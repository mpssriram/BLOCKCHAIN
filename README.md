# 🚀 Blockchain Payroll System

A Web3-based payroll system that allows organizations to pay employees securely using blockchain technology.
This project includes an admin dashboard, employee dashboard, and blockchain-based salary transfer.

---

## 🧠 Features

* Admin payroll dashboard
* Employee salary dashboard
* Blockchain-based salary transfer
* Wallet integration
* Secure & transparent payments
* Full-stack Web3 payroll system

---

## 🛠️ Tech Stack

**Frontend:** React.js
**Backend:** Python (Flask)
**Blockchain:** Solidity + Web3/Ethers
**Other:** Node.js, Web3Auth

---

## 📂 Project Structure

```
BLOCKCHAIN-1/
│
├── Backend/                → Python backend
├── frontpage/              → Admin frontend
├── Frontendemployee/       → Employee frontend
├── blockchain.sol          → Smart contract
├── run.py                  → Main file to run full system
├── requirements.txt
└── README.md
```

---

# ⚙️ How to Run the Project

## 1️⃣ Open terminal in project folder

Navigate to project directory:

```
cd BLOCKCHAIN-1
```

---

## 2️⃣ Activate virtual environment

### Windows:

```
venv\Scripts\activate
```

You should see:

```
(venv)
```

---

## 3️⃣ Install backend requirements

```
pip install -r requirements.txt
```

If requirements.txt not present:

```
pip install flask web3 python-dotenv
```

---

## 4️⃣ Install frontend dependencies

### Install admin frontend

```
cd frontpage
npm install
cd ..
```

### Install employee frontend

```
cd Frontendemployee
npm install
cd ..
```

---

## 5️⃣ Run the full project 🚀

Start everything using one command:

```
python run.py
```

This will:

* Start backend server
* Start frontend servers
* Connect blockchain
* Run full payroll system

---

# 💻 Demo Credentials (if needed)

Add your demo login details here.

Example:

```
Admin Login:
Email: employee@test.com
Password: 123456
```

---

# 🌐 Use Case

This system helps companies pay employees using blockchain for:

* Transparency
* Security
* Instant payments
* No manual payroll errors

---

# 👨‍💻 Developed For

Hackathon Project / Academic Project

---

# ⭐ Future Improvements

* Multi-chain support
* Mobile app integration
* AI payroll analytics
* Real-time salary tracking
