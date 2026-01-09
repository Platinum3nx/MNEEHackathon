require('dotenv').config();
const { ethers } = require('ethers');
const axios = require('axios');

const { TEST_PRIVATE_KEY, RPC_URL, TARGET_WALLET } = process.env;

async function main() {
    if (!TEST_PRIVATE_KEY || !RPC_URL || !TARGET_WALLET) {
        console.error('Missing environment variables. Please check .env file.');
        process.exit(1);
    }

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(TEST_PRIVATE_KEY, provider);

        console.log(`Wallet address: ${wallet.address}`);

        // Step A: Send 0.0001 ETH
        const amountToSend = ethers.parseEther("0.0001");
        console.log(`Sending 0.0001 ETH to ${TARGET_WALLET}...`);

        const tx = await wallet.sendTransaction({
            to: TARGET_WALLET,
            value: amountToSend
        });

        console.log(`Transaction sent: ${tx.hash}`);

        // Step B: Wait for confirmation
        console.log('Waiting for confirmation...');
        await tx.wait();
        console.log('Transaction confirmed.');

        // Step C: Log transaction hash
        // already logged above, but used in payload below

        // Step D: Call main platform proxy
        const proxyUrl = 'http://localhost:3000/proxy-request';
        // ID 1 is likely the target service, assuming it's registered. 
        // In a real flow, we'd probably register the service first or know the ID.
        // For this demo, we assume service_id 1 is the merchant.
        const payload = {
            service_id: 1,
            tx_hash: tx.hash,
            payload: { request_type: 'get_price' }
        };

        console.log(`Requesting proxy to: ${proxyUrl} with payload:`, payload);

        try {
            const response = await axios.post(proxyUrl, payload);

            // Step E: Log final data
            console.log('Final Response from Merchant:', response.data);
        } catch (error) {
            if (error.response) {
                console.error('Proxy Error Response:', error.response.status, error.response.data);
            } else {
                console.error('Proxy Error:', error.message);
            }
        }

    } catch (error) {
        console.error('Error in buyer agent:', error);
    }
}

main();
