const { QuickYAML } = require('quick-yaml.db');
const path = require('path');
const npcs = require('../src/data/npcs.json');

const dbPath = path.join(__dirname, '..', 'database.yml');
const db = new QuickYAML(dbPath);

async function initNPCs() {
    console.log('--- Inicializando NPCs ---');

    const initialData = {
        homer: { balance: 50, items: { rosquinha: 5, cerveja_duff: 3 } },
        marge: { balance: 150, items: { bolo_marge: 2 } },
        bart: { balance: 20, items: { skate: 1, estilingue: 1 } },
        lisa: { balance: 100, items: { saxofone: 1 } },
        ned: { balance: 300, items: { biblia: 2 } },
        moe: { balance: 500, items: { cerveja_duff: 50 } },
        burns: { balance: 10000, items: { charuto_burns: 10, reator_nuclear: 1 } },
        krusty: { balance: 1000, items: { rosquinha: 20 } }
    };

    for (const [npcId, data] of Object.entries(initialData)) {
        console.log(`Configurando ${npcId}...`);
        
        // Dinheiro
        await db.set(`economy.${npcId}.balance`, data.balance);
        
        // Inventário
        for (const [itemId, qty] of Object.entries(data.items)) {
            await db.set(`inventory.${npcId}.${itemId}`, qty);
        }
    }

    console.log('--- NPCs Inicializados com sucesso! ---');
}

initNPCs();
