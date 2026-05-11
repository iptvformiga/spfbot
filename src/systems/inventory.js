const { QuickYAML } = require('quick-yaml.db');
const config = require('../config');
const items = require('../data/items.json');
const economy = require('./economy');

const db = new QuickYAML(config.database.path);

/**
 * Retorna o inventário do usuário
 */
async function getInventory(userId) {
    const allInventories = await db.get('inventory') || {};
    return allInventories[userId] || {};
}

/**
 * Adiciona um item ao inventário
 */
async function addItem(userId, itemId, quantity = 1) {
    const all = await db.get('inventory') || {};
    if (!all[userId]) all[userId] = {};
    
    all[userId][itemId] = (all[userId][itemId] || 0) + quantity;
    await db.set('inventory', all);
}

/**
 * Remove um item do inventário. Retorna false se não tem.
 */
async function removeItem(userId, itemId, quantity = 1) {
    const all = await db.get('inventory') || {};
    if (!all[userId] || !all[userId][itemId]) return false;
    
    const current = all[userId][itemId];
    if (current < quantity) return false;
    
    const newQty = current - quantity;
    if (newQty <= 0) {
        delete all[userId][itemId];
    } else {
        all[userId][itemId] = newQty;
    }
    
    await db.set('inventory', all);
    return true;
}

/**
 * Verifica se usuário tem um item
 */
async function hasItem(userId, itemId, quantity = 1) {
    const all = await db.get('inventory') || {};
    const current = all[userId]?.[itemId] || 0;
    return current >= quantity;
}

/**
 * Retorna lista de itens da loja
 */
function getShopItems() {
    return Object.values(items).filter(item => item.price > 0);
}

/**
 * Retorna dados de um item pelo ID
 */
function getItemData(itemId) {
    return items[itemId] || null;
}

/**
 * Compra um item da loja
 */
async function buyItem(userId, itemId, quantity = 1) {
    const item = getItemData(itemId);
    if (!item) return { success: false, reason: 'Item não encontrado.' };

    const totalCost = item.price * quantity;
    const paid = await economy.removeBalance(userId, totalCost);
    if (!paid) return { success: false, reason: `Saldo insuficiente! Precisa de 🍩 ${totalCost} Donuts.` };

    await economy.recordSpending(userId, totalCost);
    await addItem(userId, itemId, quantity);
    return { success: true, item, totalCost };
}

/**
 * Raridade em cor e emoji para embeds
 */
const RARITY_COLORS = {
    comum:     { color: 0x95a5a6, label: 'Comum',    emoji: '⬜' },
    incomum:   { color: 0x2ecc71, label: 'Incomum',  emoji: '🟩' },
    raro:      { color: 0x3498db, label: 'Raro',     emoji: '🟦' },
    epico:     { color: 0x9b59b6, label: 'Épico',    emoji: '🟪' },
    lendario:  { color: 0xf39c12, label: 'Lendário', emoji: '🟨' },
};

function getRarityInfo(rarity) {
    return RARITY_COLORS[rarity] || RARITY_COLORS.comum;
}

module.exports = {
    getInventory,
    addItem,
    removeItem,
    hasItem,
    getShopItems,
    getItemData,
    buyItem,
    getRarityInfo,
    RARITY_COLORS
};
