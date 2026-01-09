const express = require('express');
const { ethers } = require('ethers');
const Database = require('better-sqlite3');

const app = express();
const port = 3000;
const db = new Database('database.db');
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(express.json());

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    endpoint_url TEXT NOT NULL,
    price TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    tx_hash TEXT NOT NULL,
    status TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(service_id) REFERENCES services(id)
  );
`);

/**
 * Helper function to verify Ethereum payment
 * @param {string} txHash - The transaction hash to verify
 * @param {string} recipient - The expected recipient address
 * @param {string} amount - The expected amount in ETH (string)
 * @returns {Promise<boolean>} - True if valid and confirmed, false otherwise
 */
async function verifyPayment(txHash, recipient, amount) {
  try {
    // using a public Sepolia RPC
    const provider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');

    // Get transaction receipt to ensure it is mined/confirmed
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt || receipt.confirmations === 0) {
      console.log('Transaction not confirmed or found');
      return false;
    }

    const tx = await provider.getTransaction(txHash);

    if (!tx) {
      return false;
    }

    // Check recipient (case insensitive)
    if (tx.to.toLowerCase() !== recipient.toLowerCase()) {
      console.log(`Recipient mismatch: ${tx.to} !== ${recipient}`);
      return false;
    }

    // Check amount
    // ethers v6 uses BigInt for values
    const expectedValue = ethers.parseEther(amount);

    if (tx.value !== expectedValue) {
      console.log(`Value mismatch: ${tx.value.toString()} !== ${expectedValue.toString()}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
}

// Endpoint: Register Service
app.post('/register', async (req, res) => {
  const { name, wallet_address, endpoint_url, price } = req.body;

  if (!name || !wallet_address || !endpoint_url || !price) {
    return res.status(400).json({ error: 'Missing required fields: name, wallet_address, endpoint_url, price' });
  }

  try {
    const stmt = db.prepare('INSERT INTO services (name, wallet_address, endpoint_url, price) VALUES (?, ?, ?, ?)');
    const info = stmt.run(name, wallet_address, endpoint_url, price);
    res.status(201).json({
      id: info.lastInsertRowid,
      message: 'Service registered successfully',
      data: { name, wallet_address, endpoint_url, price }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to register service' });
  }
});

// Endpoint: Get All Services
app.get('/services', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM services');
    const services = stmt.all();
    res.json(services);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Endpoint: Get Recent Transactions
app.get('/transactions', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT t.*, s.name as service_name
      FROM transactions t
      JOIN services s ON t.service_id = s.id
      ORDER BY t.timestamp DESC
      LIMIT 10
    `);
    const transactions = stmt.all();
    res.json(transactions);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// For testing verifyPayment manually via an endpoint (Optional, mostly for debug)
app.post('/verify-payment', async (req, res) => {
  const { txHash, recipient, amount } = req.body;
  const isValid = await verifyPayment(txHash, recipient, amount);
  if (isValid) {
    res.json({ success: true, message: 'Payment verified' });
  } else {
    res.status(400).json({ success: false, message: 'Payment invalid' });
  }
});

// Endpoint: Proxy Request
const axios = require('axios');

app.post('/proxy-request', async (req, res) => {
  const { service_id, tx_hash, payload } = req.body;

  if (!service_id || !tx_hash || !payload) {
    return res.status(400).json({ error: 'Missing required fields: service_id, tx_hash, payload' });
  }

  try {
    // 1. Look up service
    const stmt = db.prepare('SELECT * FROM services WHERE id = ?');
    const service = stmt.get(service_id);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // 2. Verify Payment
    const isPaymentValid = await verifyPayment(tx_hash, service.wallet_address, service.price);

    if (!isPaymentValid) {
      // Log failed transaction
      db.prepare('INSERT INTO transactions (service_id, tx_hash, status) VALUES (?, ?, ?)')
        .run(service_id, tx_hash, 'failed');
      return res.status(402).json({ error: 'Payment Required: Verification failed' });
    }

    // 3. Proxy request to external service
    try {
      const response = await axios.post(service.endpoint_url, payload);

      // Log success transaction
      db.prepare('INSERT INTO transactions (service_id, tx_hash, status) VALUES (?, ?, ?)')
        .run(service_id, tx_hash, 'success');

      res.json(response.data);
    } catch (axiosError) {
      console.error('Error forwarding request:', axiosError.message);

      // Log failed transaction (proxy error)
      db.prepare('INSERT INTO transactions (service_id, tx_hash, status) VALUES (?, ?, ?)')
        .run(service_id, tx_hash, 'failed_proxy');

      // Determine if we should send back the error from the service or a generic 502
      if (axiosError.response) {
        res.status(axiosError.response.status).json(axiosError.response.data);
      } else {
        res.status(502).json({ error: 'Bad Gateway: Failed to reach external service' });
      }
    }

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Connected to Sepolia via publicnode');
});
