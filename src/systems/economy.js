const { QuickYAML } = require('quick-yaml.db');
const config = require('../config');

const db = new QuickYAML(config.database.path);

const DEFAULT_BALANCE = 100; // Dólares iniciais

/**
 * Retorna o saldo em Dólares do usuário
 */
async function getBalance(userId) {
    const all = await db.get('economy') || {};
    if (!all[userId]) {
        all[userId] = { balance: DEFAULT_BALANCE, totalEarned: 0, totalSpent: 0 };
        await db.set('economy', all);
        return DEFAULT_BALANCE;
    }
    return all[userId].balance || 0;
}

/**
 * Define o saldo do usuário
 */
async function setBalance(userId, amount) {
    const all = await db.get('economy') || {};
    if (!all[userId]) all[userId] = { balance: 0, totalEarned: 0, totalSpent: 0 };
    
    all[userId].balance = Math.max(0, amount);
    await db.set('economy', all);
}

/**
 * Adiciona Donuts ao usuário
 */
async function addBalance(userId, amount) {
    const current = await getBalance(userId);
    const newBalance = current + amount;
    await setBalance(userId, newBalance);
    return newBalance;
}

/**
 * Remove Donuts do usuário. Retorna false se saldo insuficiente.
 */
async function removeBalance(userId, amount) {
    const current = await getBalance(userId);
    if (current < amount) return false;
    await setBalance(userId, current - amount);
    return true;
}

/**
 * Transfere Donuts entre usuários
 */
async function transfer(fromId, toId, amount) {
    const success = await removeBalance(fromId, amount);
    if (!success) return { success: false, reason: 'Saldo insuficiente!' };
    await addBalance(toId, amount);
    return { success: true };
}

/**
 * Retorna o perfil econômico completo do usuário
 */
async function getProfile(userId) {
    const all = await db.get('economy') || {};
    const user = all[userId] || { balance: DEFAULT_BALANCE, totalEarned: 0, totalSpent: 0 };
    return { 
        balance: user.balance || 0, 
        totalEarned: user.totalEarned || 0, 
        totalSpent: user.totalSpent || 0 
    };
}

/**
 * Registra ganhos para estatísticas
 */
async function recordEarning(userId, amount) {
    const all = await db.get('economy') || {};
    if (!all[userId]) all[userId] = { balance: DEFAULT_BALANCE, totalEarned: 0, totalSpent: 0 };
    
    all[userId].totalEarned = (all[userId].totalEarned || 0) + amount;
    await db.set('economy', all);
}

/**
 * Registra gastos para estatísticas
 */
async function recordSpending(userId, amount) {
    const all = await db.get('economy') || {};
    if (!all[userId]) all[userId] = { balance: DEFAULT_BALANCE, totalEarned: 0, totalSpent: 0 };
    
    all[userId].totalSpent = (all[userId].totalSpent || 0) + amount;
    await db.set('economy', all);
}

module.exports = {
    getBalance,
    setBalance,
    addBalance,
    removeBalance,
    transfer,
    getProfile,
    recordEarning,
    recordSpending,
    DEFAULT_BALANCE
};
