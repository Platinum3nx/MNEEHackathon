require('dotenv').config();
const { ethers } = require('ethers');
const solc = require('solc');

// Load environment variables
const PRIVATE_KEY = process.env.TEST_PRIVATE_KEY || process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;
const WALLET_ADDRESS = process.env.TARGET_WALLET; // Using TARGET_WALLET as the recipient for minting

if (!PRIVATE_KEY || !RPC_URL) {
    console.error('Missing environment variables: TEST_PRIVATE_KEY (or PRIVATE_KEY) and RPC_URL are required.');
    process.exit(1);
}

// 1. Define Solidity Source (Simple ERC20 based on OpenZeppelin)
const source = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockMNEE {
    string public name = "Mock MNEE";
    string public symbol = "mMNEE";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 initialSupply) {
        mint(msg.sender, initialSupply);
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) public {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
`;

async function main() {
    console.log('Compiling MockMNEE contract...');

    // 2. Compile Contract
    const input = {
        language: 'Solidity',
        sources: {
            'MockMNEE.sol': {
                content: source,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*'],
                },
            },
        },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        const errors = output.errors.filter(error => error.severity === 'error');
        if (errors.length > 0) {
            console.error('Compilation errors:', output.errors);
            process.exit(1);
        }
    }

    const contractFile = output.contracts['MockMNEE.sol']['MockMNEE'];
    const bytecode = contractFile.evm.bytecode.object;
    const abi = contractFile.abi;

    console.log('Compilation successful.');

    // 3. Deploy Contract
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`Deploying from wallet: ${wallet.address}`);

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);

    // Mint 1,000,000 tokens (with 18 decimals)
    const initialSupply = ethers.parseUnits('1000000', 18);

    const contract = await factory.deploy(initialSupply);

    console.log('Waiting for deployment transaction to be mined...');
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log(`MockMNEE Token Deployed at: ${contractAddress}`);

    // Minting acts happened in constructor to deployer (which is likely the same as wallet address)
    // If TARGET_WALLET is different and we want to send there:
    if (WALLET_ADDRESS && WALLET_ADDRESS.toLowerCase() !== wallet.address.toLowerCase()) {
        console.log(`Transferring tokens to TARGET_WALLET: ${WALLET_ADDRESS}...`);
        const transferTx = await contract.transfer(WALLET_ADDRESS, initialSupply);
        await transferTx.wait();
        console.log('Transfer complete.');
    } else {
        console.log(`Tokens minted to deployer: ${wallet.address}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
