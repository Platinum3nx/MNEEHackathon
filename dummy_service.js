const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

app.post('/request', (req, res) => {
    console.log('Dummy service received:', req.body);
    res.json({ message: 'Hello from dummy service', data: req.body });
});

app.listen(port, () => {
    console.log(`Dummy service listening on port ${port}`);
});
