const memorySystem = require('../src/systems/memory');

async function testMemory() {
    const npcId = 'homer';
    const userId = '608103790616248320';
    
    console.log('--- Gravando fato na memória do Homer ---');
    await memorySystem.addFact(npcId, userId, 'O usuário me deu uma Rosquinha de Chocolate Gigante ontem e eu fiquei muito feliz!');
    await memorySystem.addFact(npcId, userId, 'O usuário prometeu que ia me levar no Bar do Moe se eu contasse um segredo da usina.');
    
    console.log('Fatos gravados! Agora o Homer vai saber disso quando você falar com ele.');
}

testMemory();
