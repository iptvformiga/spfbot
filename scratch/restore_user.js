const { QuickYAML } = require('quick-yaml.db');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.yml');
const db = new QuickYAML(dbPath);

async function restoreUser() {
    const userId = '608103790616248320';
    console.log(`--- Restaurando usuário ${userId} ---`);

    const inv = await db.get('inventory') || {};
    inv[userId] = { rosquinha: 1 };
    await db.set('inventory', inv);

    const eco = await db.get('economy') || {};
    eco[userId] = { balance: 85, totalSpent: 15, totalEarned: 0 };
    await db.set('economy', eco);

    console.log('Usuário restaurado com sucesso!');
}

restoreUser();
