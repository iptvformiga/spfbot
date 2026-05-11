const { QuickYAML } = require('quick-yaml.db');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.yml');
const db = new QuickYAML(dbPath);

async function testRead() {
    console.log('--- Testando Leitura ---');
    const inv = await db.get('inventory.homer');
    console.log('Inventário do Homer:', JSON.stringify(inv, null, 2));
    
    const balance = await db.get('economy.homer.balance');
    console.log('Saldo do Homer:', balance);
}

testRead();
