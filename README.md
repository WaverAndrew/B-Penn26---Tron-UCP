# UCP-to-TRON Gateway

A Universal Commerce Protocol (UCP) Proof-of-Concept for the TRON blockchain. It allows an AI agent to dynamically discover a merchant, negotiate a checkout session, and pay using TRC-20 USDT on the TRON Nile Testnet.

## Project Structure
- `server.js` - Express backend with `/api/ucp` endpoints.
- `db.js` - Simple JSON-based database to store orders.
- `frontend/` - A Vite + React + Tailwind merchant dashboard.
- `test-agent.js` - A mock UCP Agent script that simulates the entire flow.

## 🛠️ Setup Instructions

### 1. Backend Setup
1. Clone this directory and install dependencies:
   ```bash
   cd tron-ucp
   npm install
   ```
2. Configure `.env`:
   - Copy `.env.example` to `.env`.
   - Ensure `MERCHANT_ADDRESS` is a valid TRON address.
   - Set a valid `TRON_PRIVATE_KEY` for the `test-agent.js` script to use. Needs to have Nile TRX and Nile USDT.
3. Start the server:
   ```bash
   node server.js
   ```

### 2. Frontend Dashboard Setup
1. Move to the frontend folder and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open the browser to see the Merchant UI. (Defaults to `http://localhost:5173`)

### 3. Run the AI Agent Flow
With both the backend and frontend running, open a new terminal tab and execute the agent script:
```bash
node test-agent.js
```
The agent will discover the manifest, initiate a checkout, sign a transaction on the Nile network, and notify the backend to verify the transaction. The merchant dashboard will auto-update!
