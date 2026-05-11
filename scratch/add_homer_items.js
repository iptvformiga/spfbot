const { QuickYAML } = require('quick-yaml.db');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.yml');
const db = new QuickYAML(dbPath);

async function giveHomerStuff() {
    console.log('--- Dando mimos pro Homer ---');

    const npcId = 'homer';
    
    // Adicionando mais itens
    await db.set(`inventory.${npcId}.rosquinha`, 10);
    await db.set(`inventory.${npcId}.cerveja_duff`, 6);
    await db.set(`inventory.${npcId}.reator_nuclear`, 1);
    await db.set(`inventory.${npcId}.estilingue`, 1); // Ele pegou do Bart

    console.log('Homer agora está feliz e radioativo!');
}

giveHomerStuff();
