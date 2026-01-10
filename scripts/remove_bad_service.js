const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.db');
const db = new Database(dbPath);

console.log('Connected to database at:', dbPath);

try {
    // 1. Delete specific bad wallet
    const stmt1 = db.prepare("DELETE FROM services WHERE wallet_address = '0x123'");
    const info1 = stmt1.run();
    console.log(`Deleted rows with wallet '0x123': ${info1.changes}`);

    // 2. Delete test wallets
    const stmt2 = db.prepare("DELETE FROM services WHERE wallet_address LIKE '%test%'");
    const info2 = stmt2.run();
    console.log(`Deleted rows with wallet containing 'test': ${info2.changes}`);

} catch (error) {
    console.error('Error cleaning database:', error);
} finally {
    db.close();
}
