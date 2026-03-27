const { TronWeb } = require('tronweb');
const axios = require('axios');

const tronWeb = new TronWeb({
    fullNode: 'https://nile.trongrid.io',
    solidityNode: 'https://nile.trongrid.io',
    eventServer: 'https://nile.trongrid.io'
});

const address = 'TLEFcvpWtFCu7jfpPkQuWi6emW6W5MR8HX';

async function verifyBalance() {
    console.log(`Checking balance for: ${address}`);
    const balance = await tronWeb.trx.getBalance(address);
    console.log(`TRX Balance: ${balance / 1000000} TRX`);

    try {
        const res = await axios.get(`https://nile.trongrid.io/v1/accounts/${address}`);
        if (res.data.data && res.data.data.length > 0) {
            console.log("TRC20 Balances:");
            console.log(JSON.stringify(res.data.data[0].trc20, null, 2));
        } else {
            console.log("No TRC20 tokens found.");
        }
    } catch (e) {
        console.log("Failed to fetch TRC20 list from API", e.message);
    }
}

verifyBalance();
