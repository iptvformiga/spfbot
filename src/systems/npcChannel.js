const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { QuickYAML } = require('quick-yaml.db');
const config = require('../config');
const npcs = require('../data/npcs.json');
const groqSystem = require('./groq');
const economy = require('./economy');
const inventory = require('./inventory');

const db = new QuickYAML(config.database.path);

// Threads ativas: "npcId:userId" -> threadId
const activeThreads = new Map();

// Timeout de inatividade: 10 minutos
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
const inactivityTimers = new Map();

/**
 * Cria ou recupera a thread de chat com um NPC para um usuário
 */
async function getOrCreateNPCThread(guild, npcId, user) {
    const npcData = npcs[npcId];
    if (!npcData) return null;

    const key = `${npcId}:${user.id}`;
    
    // Verifica se tem thread ativa já
    const existingThreadId = activeThreads.get(key);
    if (existingThreadId) {
        try {
            const existingThread = await guild.channels.fetch(existingThreadId);
            if (existingThread && !existingThread.archived) {
                resetInactivityTimer(key, existingThread, npcId, user.id);
                return existingThread;
            }
        } catch {
            activeThreads.delete(key);
        }
    }

    // Recupera ou cria canal pai para NPCs
    const npcCategoryId = process.env.NPC_CATEGORY_ID;
    let parentChannel;

    if (npcCategoryId) {
        // Tenta achar canal existente do NPC dentro da categoria
        const category = await guild.channels.fetch(npcCategoryId).catch(() => null);
        if (category) {
            parentChannel = guild.channels.cache.find(
                c => c.parentId === npcCategoryId && c.name === `npc-${npcId}`
            );
            if (!parentChannel) {
                parentChannel = await guild.channels.create({
                    name: `npc-${npcId}`,
                    type: ChannelType.GuildText,
                    parent: npcCategoryId,
                    topic: `💬 Canal de diálogos com ${npcData.name} ${npcData.emoji}`,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone,
                            deny: [PermissionFlagsBits.SendMessages],
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
                        }
                    ]
                });
            }
        }
    }

    // Fallback: usa o primeiro canal de texto disponível
    if (!parentChannel) {
        parentChannel = guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.name === 'springfield-chat');
        if (!parentChannel) {
            parentChannel = guild.channels.cache.find(c => c.type === ChannelType.GuildText);
        }
    }

    if (!parentChannel) return null;

    // Cria a thread privada
    const thread = await parentChannel.threads.create({
        name: `${npcData.emoji} ${npcData.name} — ${user.displayName || user.username}`,
        type: ChannelType.PrivateThread,
        autoArchiveDuration: 60,
        reason: `Diálogo do usuário ${user.username} com ${npcData.name}`
    });

    // Adiciona o usuário à thread
    await thread.members.add(user.id);

    // Mensagem de boas-vindas do NPC
    const greeting = npcData.greetings[Math.floor(Math.random() * npcData.greetings.length)];
    await thread.send({
        embeds: [{
            color: npcData.color,
            author: {
                name: `${npcData.name} ${npcData.emoji}`,
                icon_url: `https://cdn.discordapp.com/emojis/1148000000000000000.png`
            },
            description: `> *${greeting}*`,
            footer: {
                text: `📍 ${npcData.location} • Springfield, MC • Digite /encerrar para fechar`
            },
            thumbnail: {}
        }]
    });

    activeThreads.set(key, thread.id);
    await db.set(`npcThreads.${key}`, thread.id);
    resetInactivityTimer(key, thread, npcId, user.id);

    return thread;
}

/**
 * Reseta o timer de inatividade da thread
 */
function resetInactivityTimer(key, thread, npcId, userId) {
    if (inactivityTimers.has(key)) {
        clearTimeout(inactivityTimers.get(key));
    }

    const timer = setTimeout(async () => {
        try {
            await thread.send({
                embeds: [{
                    color: 0x95a5a6,
                    description: '⏰ *Parece que a conversa chegou ao fim. O NPC voltou para a rotina de Springfield...*',
                    footer: { text: 'Thread arquivada por inatividade • Use /npc para retomar' }
                }]
            });
            await thread.setArchived(true);
            activeThreads.delete(key);
            groqSystem.clearHistory(npcId, userId);
        } catch { /* thread já fechada */ }
    }, INACTIVITY_TIMEOUT_MS);

    inactivityTimers.set(key, timer);
}

/**
 * Envia e processa mensagem do usuário na thread do NPC
 */
async function processNPCMessage(thread, npcId, userId, userMessage) {
    const npcData = npcs[npcId];
    if (!npcData) return;

    const key = `${npcId}:${userId}`;
    resetInactivityTimer(key, thread, npcId, userId);

    // Mostra "digitando..."
    await thread.sendTypingIndicator?.() || await thread.sendTyping().catch(() => {});

    // Busca estado do NPC (dinheiro e inventário)
    const [balance, inv] = await Promise.all([
        economy.getBalance(npcId),
        inventory.getInventory(npcId)
    ]);

    const result = await groqSystem.chatWithNPC(npcData, userMessage, userId, {
        balance,
        inventory: inv
    });

    await thread.send({
        embeds: [{
            color: npcData.color,
            author: { name: `${npcData.name} ${npcData.emoji}` },
            description: `> ${result.response}`
        }]
    });
}

/**
 * Verifica se uma thread pertence a um NPC e retorna os dados
 */
async function getNPCFromThread(threadId) {
    // Percorre o mapa para achar qual NPC:userId tem essa thread
    for (const [key, tid] of activeThreads.entries()) {
        if (tid === threadId) {
            const [npcId, userId] = key.split(':');
            return { npcId, userId, npcData: npcs[npcId] };
        }
    }
    return null;
}

/**
 * Fecha o chat com o NPC manualmente
 */
async function closeNPCThread(thread, npcId, userId) {
    const key = `${npcId}:${userId}`;
    
    if (inactivityTimers.has(key)) {
        clearTimeout(inactivityTimers.get(key));
        inactivityTimers.delete(key);
    }

    groqSystem.clearHistory(npcId, userId);
    activeThreads.delete(key);

    try {
        await thread.send({
            embeds: [{
                color: 0x95a5a6,
                description: `*O NPC acenou e voltou para ${npcs[npcId]?.location || 'Springfield'}...*`,
                footer: { text: 'Conversa encerrada • Use /npc para conversar novamente' }
            }]
        });
        await thread.setArchived(true);
    } catch { /* já fechada */ }
}

/**
 * Retorna lista de NPCs disponíveis
 */
function getNPCList() {
    return Object.values(npcs);
}

/**
 * Retorna dados de um NPC
 */
function getNPC(npcId) {
    return npcs[npcId] || null;
}

module.exports = {
    getOrCreateNPCThread,
    processNPCMessage,
    getNPCFromThread,
    closeNPCThread,
    getNPCList,
    getNPC,
    activeThreads
};
