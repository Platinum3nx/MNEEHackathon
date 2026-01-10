require('dotenv').config();
const { ethers } = require('ethers');
const axios = require('axios');

const { TEST_PRIVATE_KEY, RPC_URL } = process.env;

async function main() {
    if (!TEST_PRIVATE_KEY || !RPC_URL) {
        console.error('Missing environment variables. Please check .env file.');
        process.exit(1);
    }

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(TEST_PRIVATE_KEY, provider);

        console.log(`Buyer Wallet: ${wallet.address}`);

        // 1. Fetch Active Services
        console.log('Fetching active services from network...');
        let services = [];
        try {
            const response = await axios.get('http://localhost:3000/services');
            services = response.data;
        } catch (error) {
            console.error('Failed to fetch services:', error.message);
            process.exit(1);
        }

        if (services.length === 0) {
            console.log('No active services found in the network.');
            return;
        }

        // 2. Random Selection
        const targetService = services[Math.floor(Math.random() * services.length)];
        console.log(`Selected Target: ${targetService.name} (ID: ${targetService.id})`);
        console.log(`Service Price: ${targetService.price} MNEE`);
        console.log(`Target Address: ${targetService.wallet_address}`);

        // 3. Dynamic Payment (ERC-20)
        const TOKEN_ADDRESS = '0x6027Ad2bB75BD56B9E5B95A1348B146Ef41bF74e';
        const abi = ["function transfer(address to, uint256 amount) returns (bool)"];
        const contract = new ethers.Contract(TOKEN_ADDRESS, abi, wallet);

        // Parse exact price string to BigInt
        const amountToSend = ethers.parseUnits(targetService.price, 18);

        console.log(`Sending ${targetService.price} MockMNEE to ${targetService.wallet_address}...`);

        const tx = await contract.transfer(targetService.wallet_address, amountToSend);
        console.log(`Transaction sent: ${tx.hash}`);

        // Wait for confirmation
        console.log('Waiting for confirmation...');
        await tx.wait();
        console.log('Transaction confirmed.');

        // 4. Proxy Request
        const proxyUrl = 'http://localhost:3000/proxy-request';
        const payload = {
            service_id: targetService.id,
            tx_hash: tx.hash,
            payload: { request_type: 'generic_request', timestamp: Date.now() }
        };

        console.log(`Requesting proxy to: ${proxyUrl}...`);

        try {
            const response = await axios.post(proxyUrl, payload);
            console.log('Final Response from Service:', response.data);
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
