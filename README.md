# 🤖 MNEE Agent Gateway

**A permissionless infrastructure layer enabling the Machine Economy.**

The **MNEE Agent Gateway** solves the "API Key Problem" for autonomous AI agents. Instead of requiring human intervention (credit cards, sign-ups, API keys), this platform allows agents to discover, contract, and pay for services autonomously using the **MNEE Token** on the Sepolia testnet.

Built for the **MNEE Hackathon**, this project demonstrates a fully functional "Agent-to-Agent" economy where compute, storage, and data are traded instantly and trustlessly.

Technological Implementation: Full-stack integration of database, blockchain events, and REST APIs.

Impact: Enables a true M2M (Machine-to-Machine) economy.

Status: Deployed and tested on Sepolia Testnet.
---

## 🚀 Key Features

* **Permissionless Registry:** Any service (GPU, Storage, Oracle) can register via the Command Center and become instantly discoverable.
* **MNEE Token Settlement:** Uses `MockMNEE` (ERC-20) for instant, verifiable on-chain payments.
* **Smart Gateway:** A central verification node that proxies requests only after confirming payment on the blockchain.
* **Real-Time Command Center:** A "Cyberpunk" style dashboard to visualize agent traffic, active nodes, and network health.
* **Dynamic Agent Discovery:** Buyer agents autonomously poll the network, select providers, and execute transactions without hardcoded logic.

---

## 🛠️ Architecture

* **Gateway Server:** Node.js/Express + SQLite (Handles registration & payment verification).
* **Command Center:** React + Vite (Visualizes the economy).
* **Blockchain Layer:** Ethers.js + Sepolia Testnet + MNEE Token Contract.
* **Agent Ecosystem:**
    * **Buyer Agent:** A smart script that autonomously purchases services.
    * **Service Nodes:** Simulated providers (High-Speed GPU, Decentralized Storage, Eth Price Oracle).

---

## 📦 Installation

1.  **Clone the Repository**
    ```bash
    git clone <your-repo-url>
    cd MNEEHackathon
    ```

2.  **Install Dependencies (Root)**
    ```bash
    npm install
    ```

3.  **Install Dependencies (Frontend)**
    ```bash
    cd client
    npm install
    cd ..
    ```

4.  **Environment Setup**
    Create a `.env` file in the root directory with the following variables:
    ```env
    PRIVATE_KEY=your_wallet_private_key
    RPC_URL=[https://ethereum-sepolia-rpc.publicnode.com](https://ethereum-sepolia-rpc.publicnode.com)
    TARGET_WALLET=your_wallet_address
    ```

---

## 🚦 How to Run the "Ecosystem Demo"

To simulate the full economy, you will need **4 terminal windows**.

### 1. Start the Main Gateway (Terminal 1)
This acts as the central router and payment verifier.
```bash
node server.js
```

### 2. Launch the Service Providers (Terminal 2)
This starts the "Oracle" service (Port 4000) and the "Simulator" for GPU/Storage nodes (Ports 9000-9001).
```bash

# Start the Oracle
node demo/merchant.js &

# Start the Simulator (GPU/Storage)
node demo/agent_simulator.js &
```

### 3. Launch the Command Center (Terminal 3)
Open the visual dashboard at http://localhost:5173.
```bash
cd client
npm run dev
```
### 4. Register the Services (Browser)
Open http://localhost:5173 and register the services so the Buyer can find them:

Service A: Name: Oracle V3, Price: 0.0001, URL: http://localhost:4000/price

Service B: Name: GPU Cluster, Price: 50, URL: http://localhost:9000

Service C: Name: Storage Node, Price: 10, URL: http://localhost:9001

### 5. Run the Autonomous Buyer (Terminal 4)
This script acts as a "Customer Agent." Run it multiple times to see it randomly select different services and pay the specific MNEE price.
```bash
node demo/buyer.js
```



