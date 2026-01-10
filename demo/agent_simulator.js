const express = require('express');

// Mock GPU Cluster
const appGpu = express();
const portGpu = 9000;

appGpu.use(express.json());
appGpu.use((req, res, next) => {
    console.log(`[GPU Cluster :9000] Received ${req.method} request to ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) console.log('Payload:', req.body);
    next();
});

appGpu.post('/', (req, res) => {
    // Simulate processing time
    setTimeout(() => {
        res.json({
            status: 'success',
            job_id: 'gpu-123',
            result: 'Model Trained'
        });
    }, 1000);
});

appGpu.listen(portGpu, () => {
    console.log(`High-Speed GPU Cluster is running on port ${portGpu}`);
});

// Mock Storage Node
const appStorage = express();
const portStorage = 9001;

appStorage.use(express.json());
appStorage.use((req, res, next) => {
    console.log(`[Storage Node :9001] Received ${req.method} request to ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) console.log('Payload:', req.body);
    next();
});

appStorage.post('/', (req, res) => {
    // Simulate storage latency
    setTimeout(() => {
        res.json({
            status: 'success',
            file_hash: 'ipfs-QmX7y...',
            size: '10MB'
        });
    }, 500);
});

appStorage.listen(portStorage, () => {
    console.log(`Decentralized Storage Node is running on port ${portStorage}`);
});
