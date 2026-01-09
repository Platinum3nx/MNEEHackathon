const express = require('express');
const app = express();
const port = 4000;

app.use(express.json());

app.post('/price', (req, res) => {
    // Mock ETH price
    const mockPrice = {
        symbol: 'ETH',
        price: (Math.random() * (3000 - 2000) + 2000).toFixed(2), // Random price between 2000 and 3000
        timestamp: Date.now()
    };

    console.log('Merchant received request for price');
    res.json(mockPrice);
});

app.listen(port, () => {
    console.log(`Merchant service running at http://localhost:${port}`);
});
