const Groq = require('groq-sdk');

const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;

if (!groq) {
    console.warn('[Groq] AVISO: GROQ_API_KEY não encontrada no .env. Diálogos com NPCs não funcionarão.');
}

// Histórico de conversas por chave "npcId:userId"
const conversationHistory = new Map();

const MAX_HISTORY = 20; // máximo de mensagens no contexto

/**
 * Envia mensagem para o NPC via Groq e retorna a resposta
 */
async function chatWithNPC(npcData, userMessage, userId, npcState = null) {
    const key = `${npcData.id}:${userId}`;

    if (!conversationHistory.has(key)) {
        conversationHistory.set(key, []);
    }

    const history = conversationHistory.get(key);

    // Adiciona mensagem do usuário
    history.push({ role: 'user', content: userMessage });

    // Limita histórico
    if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY);
    }

    // Constrói prompt do sistema com estado atual (dinheiro/itens)
    let dynamicSystemPrompt = npcData.systemPrompt;
    
    if (npcState) {
        const inventoryStr = Object.entries(npcState.inventory)
            .map(([id, qty]) => `- ${id}: ${qty}`)
            .join('\n') || 'Vazio';
        
        dynamicSystemPrompt += `\n\n[ESTADO ATUAL DO PERSONAGEM]
Dinheiro: 🍩 ${npcState.balance} Donuts
Inventário:
${inventoryStr}

[INSTRUÇÕES DE NEGOCIAÇÃO]
- Você pode negociar seus itens com os moradores (usuários).
- Você pode comprar itens se tiver dinheiro.
- Seja fiel ao seu personagem durante a negociação (ex: Homer quer comida, Burns quer lucro, Ned é justo).
- Se você chegar a um acordo, confirme claramente o item e o valor.
- Importante: Se o usuário pedir para ver seu inventário, diga o que você tem de forma natural.`;
    }

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: dynamicSystemPrompt
                },
                ...history
            ],
            max_tokens: 250,
            temperature: 0.85,
        });

        const response = completion.choices[0]?.message?.content || '...';

        // Adiciona resposta ao histórico
        history.push({ role: 'assistant', content: response });

        return { success: true, response };
    } catch (err) {
        console.error('[Groq Error]', err.message);
        return { success: false, response: '*(sem sinal de Springfield)* 📡' };
    }
}

/**
 * Limpa o histórico de conversa de um NPC com um usuário
 */
function clearHistory(npcId, userId) {
    const key = `${npcId}:${userId}`;
    conversationHistory.delete(key);
}

/**
 * Retorna o tamanho do histórico
 */
function getHistorySize(npcId, userId) {
    const key = `${npcId}:${userId}`;
    return (conversationHistory.get(key) || []).length;
}

module.exports = {
    chatWithNPC,
    clearHistory,
    getHistorySize
};
