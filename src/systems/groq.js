const Groq = require('groq-sdk');

const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;

if (!groq) {
    console.warn('[Groq] AVISO: GROQ_API_KEY não encontrada no .env. Diálogos com NPCs não funcionarão.');
}

const memorySystem = require('./memory');

// Limite de histórico no contexto da IA
const CONTEXT_LIMIT = 40;

/**
 * Envia mensagem para o NPC via Groq e retorna a resposta
 */
async function chatWithNPC(npcData, userMessage, userId, npcState = null) {
    const npcId = npcData.id;

    // Recupera histórico e fatos da memória persistente
    const history = await memorySystem.getHistory(npcId, userId);
    const facts = await memorySystem.getFacts(npcId, userId);

    // Adiciona mensagem atual do usuário na memória
    await memorySystem.saveMessage(npcId, userId, 'user', userMessage);

    // Prepara o histórico para o contexto (apenas role e content)
    const contextHistory = history.map(h => ({ role: h.role, content: h.content }));
    
    // Adiciona a mensagem atual ao contexto se não estiver no histórico ainda
    contextHistory.push({ role: 'user', content: userMessage });

    // Limita o contexto enviado para a Groq
    const limitedContext = contextHistory.slice(-CONTEXT_LIMIT);

    // Constrói prompt do sistema com estado e fatos
    let dynamicSystemPrompt = npcData.systemPrompt;
    
    if (npcState) {
        const inventoryStr = Object.entries(npcState.inventory)
            .map(([id, qty]) => `- ${id}: ${qty}`)
            .join('\n') || 'Vazio';
        
        dynamicSystemPrompt += `\n\n[ESTADO ATUAL DO PERSONAGEM]
Dinheiro: 🍩 ${npcState.balance} Donuts
Inventário:
${inventoryStr}`;
    }

    // Adiciona Fatos Memoráveis ao prompt
    if (facts.length > 0) {
        const factsStr = facts.map(f => `- ${f.text}`).join('\n');
        dynamicSystemPrompt += `\n\n[MEMÓRIA DE LONGO PRAZO COM ESTE USUÁRIO]
Você se lembra destes acontecimentos passados:
${factsStr}`;
    }

    dynamicSystemPrompt += `\n\n[INSTRUÇÕES DE NEGOCIAÇÃO E MEMÓRIA]
- Você deve lembrar o que já conversou e negociou com este usuário.
- Se você deu um item ou vendeu algo no passado, aja como se soubesse disso.
- Você pode negociar seus itens ou comprar do usuário.
- Seja fiel ao seu personagem. Se chegar a um acordo, confirme claramente.
- Se o usuário pedir para ver seu inventário, diga o que você tem de forma natural.`;

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: dynamicSystemPrompt
                },
                ...limitedContext
            ],
            max_tokens: 250,
            temperature: 0.85,
        });

        const response = completion.choices[0]?.message?.content || '...';

        // Salva resposta do NPC na memória persistente
        await memorySystem.saveMessage(npcId, userId, 'assistant', response);

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
    memorySystem.clearMemory(npcId, userId);
}

module.exports = {
    chatWithNPC,
    clearHistory
};
