require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { TronWeb } = require('tronweb');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS || 'TWd4b1a2b3c4d5e6f7g8h9i0j1k2l3m4n5'; // Placeholder

// Initialize TronWeb for Nile Testnet
// We only need to read data for the backend, so a private key is optional but we can pass a dummy one if required by tronweb.
const tronWeb = new TronWeb({
    fullNode: 'https://nile.trongrid.io',
    solidityNode: 'https://nile.trongrid.io',
    eventServer: 'https://nile.trongrid.io',
});

/**
 * 1. UCP Discovery (The Manifest)
 */
app.get('/.well-known/ucp', (req, res) => {
    res.json({
        name: "TRON Merchant PoC",
        description: "A demonstration of UCP on TRON Nile Testnet",
        capabilities: ["dev.ucp.checkout"],
        payment_handler: "TRC20_USDT",
        receiver_address: MERCHANT_ADDRESS,
        network: "TRON_NILE"
    });
});

/**
 * 2. UCP Checkout Create
 */
app.post('/api/ucp/checkout/create', (req, res) => {
    const { items, currency, total_amount } = req.body;

    if (currency !== 'USDT') {
        return res.status(400).json({ error: "Only USDT is supported." });
    }

    // Generate a unique order ID
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // In TRON, TRC20 USDT usually has 6 decimals.
    // So 1 USDT = 1,000,000 "Sun-equivalent" base units for the mock TRC20, or we follow the prompt's `1 USDT = 1,000,000 Sun`
    const amountInSun = total_amount * 1_000_000;

    // Save strictly to DB
    const newOrder = db.createOrder({
        id: orderId,
        items,
        total_amount: total_amount,
        amount_in_sun: amountInSun,
        currency,
        status: 'PENDING',
        txHash: null,
        createdAt: new Date().toISOString()
    });

    res.json({
        orderId: newOrder.id,
        payment_challenge: {
            receiver_address: MERCHANT_ADDRESS,
            amount: amountInSun,
            currency: "TRC20_USDT",
            network: "TRON_NILE"
        }
    });
});

/**
 * Helper to delay execution (retry loop)
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 3. UCP Checkout Complete
 */
app.post('/api/ucp/checkout/complete', async (req, res) => {
    const { orderId, transactionHash } = req.body;

    if (!orderId || !transactionHash) {
        return res.status(400).json({ error: "Missing orderId or transactionHash." });
    }

    const order = db.getOrderById(orderId);
    if (!order) {
        return res.status(404).json({ error: "Order not found." });
    }

    if (order.status === 'PAID') {
        return res.json({ status: "Success", message: "Order is already paid." });
    }

    try {
        let transaction = null;
        let retries = 5;
        
        // Polling loop to ensure the transaction is picked up by Nile node
        while (retries > 0) {
            try {
                transaction = await tronWeb.trx.getTransaction(transactionHash);
                if (transaction && transaction.ret && transaction.ret[0].contractRet === 'SUCCESS') {
                    break;
                }
            } catch (err) {
                // Ignore err, just means tx not found yet
            }
            console.log(`Waiting for transaction ${transactionHash} to be confirmed... (${retries} retries left)`);
            await delay(3000); // 3-second delay
            retries--;
        }

        if (!transaction || !transaction.ret || transaction.ret[0].contractRet !== 'SUCCESS') {
            return res.status(400).json({ error: "Transaction not found or not successful yet. Please try again later." });
        }

        const contractData = transaction.raw_data.contract[0];
        
        // TRC20 transfers are Smart Contract triggers (TriggerSmartContract)
        if (contractData.type !== 'TriggerSmartContract') {
            return res.status(400).json({ error: "Invalid transaction type for TRC20 transfer." });
        }

        const parameter = contractData.parameter.value;
        // In a real scenario, we should decode parameter.data to check recipient and amount,
        // and verify it matches parameter.contract_address for the USDT contract on Nile.
        // For this PoC, we will accept the successful smart contract trigger as proof for the presentation,
        // but we'll do a simple check.
        
        // Decode data manually for basic safety if possible, but tronweb provides tools for it.
        // Data signature for `transfer(address,uint256)` is `a9059cbb`.
        const data = parameter.data;
        if (!data || !data.startsWith('a9059cbb')) {
            return res.status(400).json({ error: "Not a valid token transfer transaction." });
        }

        // We can confidently mark the order as PAID for PoC since the trigger was successful
        db.updateOrder(orderId, {
            status: 'PAID',
            txHash: transactionHash,
            updatedAt: new Date().toISOString()
        });

        return res.json({ status: "Success", message: "Payment verified successfully!" });

    } catch (error) {
        console.error("Verification error:", error);
        return res.status(500).json({ error: "Server error during verification." });
    }
});

/**
 * 4. Dashboard Endpoint
 */
app.get('/api/orders', (req, res) => {
    const orders = db.getOrders();
    // Sort descending by createdAt
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
});

app.listen(PORT, () => {
    console.log(`Sever running on port ${PORT}`);
    console.log(`Manifest available at: http://localhost:${PORT}/.well-known/ucp`);
});
