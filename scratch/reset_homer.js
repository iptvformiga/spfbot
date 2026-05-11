const memorySystem = require('../src/systems/memory');

async function resetHomer() {
    const npcId = 'homer';
    const userId = '608103790616248320';
    
    console.log(`--- Limpando memória do ${npcId} ---`);
    await memorySystem.clearMemory(npcId, userId);
    
    console.log('Homer agora está com a mente limpa (vazia como um donut)!');
}

resetHomer();
