const { QuickYAML } = require('quick-yaml.db');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'database.yml');

async function cleanAndFix() {
    console.log('--- Limpando e Arrumando o Banco ---');
    
    // Lê o arquivo bruto para remover as chaves zoadas
    let content = fs.readFileSync(dbPath, 'utf8');
    let lines = content.split('\n');
    
    // Filtra linhas que começam com inventory. ou economy. (as flats)
    // Mas vamos manter as do usuário que já estavam lá se quisermos, 
    // embora seja melhor resetar tudo pra nova estrutura.
    let newLines = lines.filter(line => !line.startsWith('inventory.') && !line.startsWith('economy.'));
    
    fs.writeFileSync(dbPath, newLines.join('\n'));
    
    // Agora usa a DB normalmente para setar os objetos
    const db = new QuickYAML(dbPath);
    
    const initialInventory = {
        homer: { rosquinha: 10, cerveja_duff: 6, reator_nuclear: 1, estilingue: 1 },
        marge: { bolo_marge: 2 },
        bart: { skate: 1, estilingue: 1 },
        lisa: { saxofone: 1 },
        ned: { biblia: 2 },
        moe: { cerveja_duff: 50 },
        burns: { charuto_burns: 10, reator_nuclear: 1 },
        krusty: { rosquinha: 20 }
    };
    
    const initialEconomy = {
        homer: { balance: 50 },
        marge: { balance: 150 },
        bart: { balance: 20 },
        lisa: { balance: 100 },
        ned: { balance: 300 },
        moe: { balance: 500 },
        burns: { balance: 10000 },
        krusty: { balance: 1000 }
    };
    
    await db.set('inventory', initialInventory);
    await db.set('economy', initialEconomy);
    
    console.log('Banco limpo e NPCs restaurados na estrutura correta!');
}

cleanAndFix();
