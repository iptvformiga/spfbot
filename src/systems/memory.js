const { QuickYAML } = require('quick-yaml.db');
const path = require('path');

const dbPath = path.join(process.cwd(), 'memory.yml');
const db = new QuickYAML(dbPath);

/**
 * Salva uma mensagem no histórico persistente
 */
async function saveMessage(npcId, userId, role, content) {
    const all = await db.get('memory') || {};
    if (!all[npcId]) all[npcId] = {};
    if (!all[npcId][userId]) all[npcId][userId] = { history: [], facts: [] };
    
    const history = all[npcId][userId].history || [];
    history.push({ role, content, timestamp: Date.now() });
    
    // Mantém as últimas 30 mensagens
    if (history.length > 30) history.shift();
    
    all[npcId][userId].history = history;
    await db.set('memory', all);
}

/**
 * Recupera o histórico de mensagens
 */
async function getHistory(npcId, userId) {
    const all = await db.get('memory') || {};
    return all[npcId]?.[userId]?.history || [];
}

/**
 * Adiciona um fato memorável
 */
async function addFact(npcId, userId, fact) {
    const all = await db.get('memory') || {};
    if (!all[npcId]) all[npcId] = {};
    if (!all[npcId][userId]) all[npcId][userId] = { history: [], facts: [] };
    
    const facts = all[npcId][userId].facts || [];
    facts.push({ text: fact, timestamp: Date.now() });
    
    if (facts.length > 15) facts.shift();
    
    all[npcId][userId].facts = facts;
    await db.set('memory', all);
}

/**
 * Recupera fatos memoráveis
 */
async function getFacts(npcId, userId) {
    const all = await db.get('memory') || {};
    return all[npcId]?.[userId]?.facts || [];
}

/**
 * Limpa toda a memória de um NPC com um usuário
 */
async function clearMemory(npcId, userId) {
    const all = await db.get('memory') || {};
    if (all[npcId] && all[npcId][userId]) {
        delete all[npcId][userId];
        await db.set('memory', all);
    }
}

module.exports = {
    saveMessage,
    getHistory,
    addFact,
    getFacts,
    clearMemory
};
