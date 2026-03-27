require('dotenv').config();
const axios = require('axios');
const { TronWeb } = require('tronweb');

const BASE_URL = 'http://localhost:3000';
const PRIVATE_KEY = process.env.TRON_PRIVATE_KEY;

if (!PRIVATE_KEY || PRIVATE_KEY === 'your_private_key_here') {
    console.error("❌ Please set a valid TRON_PRIVATE_KEY in your .env file.");
    process.exit(1);
}

// Initialize TronWeb (Nile Testnet)
const tronWeb = new TronWeb({
    fullNode: 'https://nile.trongrid.io',
    solidityNode: 'https://nile.trongrid.io',
    eventServer: 'https://nile.trongrid.io',
    privateKey: PRIVATE_KEY
});

// Nile Testnet USDT Contract Address
const USDT_CONTRACT_ADDRESS = 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf'; 

async function runMockAgent() {
    console.log("🤖 --- UCP Mock Agent Started ---");
    
    const walletAddress = tronWeb.address.fromPrivateKey(PRIVATE_KEY);
    console.log(`🤖 Agent Wallet Address: ${walletAddress}`);

    try {
        // Step 1: Discovery
        console.log("\n🔍 Step 1: Fetching UCP Manifest...");
        const manifestRes = await axios.get(`${BASE_URL}/.well-known/ucp`);
        const manifest = manifestRes.data;
        console.log("✅ Manifest received:");
        console.log(manifest);

        if (!manifest.capabilities.includes("dev.ucp.checkout") || manifest.payment_handler !== "TRC20_USDT") {
            console.error("❌ Merchant does not support required UCP capabilities.");
            return;
        }

        // Step 2: Checkout Create
        console.log("\n🛒 Step 2: Creating Checkout Session...");
        const checkoutPayload = {
            items: [{ id: "ai-api-call", qty: 1000 }],
            currency: "USDT",
            total_amount: 15 // 15 USDT
        };
        const checkoutRes = await axios.post(`${BASE_URL}/api/ucp/checkout/create`, checkoutPayload);
        const { orderId, payment_challenge } = checkoutRes.data;
        
        console.log(`✅ Checkout successful. Order ID: ${orderId}`);
        console.log("   Payment Challenge:", payment_challenge);

        // Step 3: Agent signs and broadcasts the transaction
        console.log("\n✍️ Step 3: Agent signing and sending TRC20 transfer on Nile Testnet...");
        
        // Execute the transfer without fetching ABI
        let transactionHash;
        try {
            console.log(`   Transferring ${payment_challenge.amount} Sun to ${payment_challenge.receiver_address}...`);
            const functionSelector = 'transfer(address,uint256)';
            const parameter = [
                { type: 'address', value: payment_challenge.receiver_address },
                { type: 'uint256', value: payment_challenge.amount }
            ];
            
            const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
                USDT_CONTRACT_ADDRESS,
                functionSelector,
                { feeLimit: 100_000_000 },
                parameter,
                walletAddress
            );
            
            if (!transaction.result || !transaction.result.result) {
                console.error("❌ Failed to build transaction:", transaction);
                return;
            }

            const signedTransaction = await tronWeb.trx.sign(transaction.transaction, PRIVATE_KEY);
            const broadcast = await tronWeb.trx.sendRawTransaction(signedTransaction);
            
            if (!broadcast.result) {
                console.error("❌ Broadcast failed:", broadcast);
                return;
            }
            
            transactionHash = broadcast.transaction.txID;
            console.log(`   Transaction broadcasted! Hash: ${transactionHash}`);
        } catch (txError) {
            console.error("❌ Failed to broadcast transaction. Make sure the agent has enough Nile TRX and Nile USDT.");
            // If the user hasn't funded the wallet, we still want to show them the code flow.
            console.error(txError);
            return;
        }

        // Step 4: Verification / Completion
        console.log("\n📡 Step 4: Notifying merchant of completion...");
        console.log("   Waiting 5 seconds for network propagation before verifying...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const completeRes = await axios.post(`${BASE_URL}/api/ucp/checkout/complete`, {
            orderId: orderId,
            transactionHash: transactionHash
        });

        console.log("✅ Payment Verified by Merchant Response:");
        console.log(completeRes.data);
        console.log("\n🎉 Flow Complete!");

    } catch (error) {
        console.error("❌ Agent Flow Error:");
        if (error.response) {
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

runMockAgent();
