const { Rcon } = require('rcon-client');

let rcon = null;

/**
 * Conecta ao servidor Minecraft via RCON
 */
async function connectRcon() {
    if (rcon) return rcon;

    const host = process.env.MC_HOST;
    const port = parseInt(process.env.MC_RCON_PORT) || 25575;
    const password = process.env.MC_RCON_PASSWORD;

    if (!host || !password) {
        console.warn('[Minecraft] Configurações de RCON ausentes no .env (MC_HOST, MC_RCON_PASSWORD)');
        return null;
    }

    try {
        rcon = await Rcon.connect({ host, port, password });
        console.log('[Minecraft] Conectado ao RCON com sucesso!');
        
        rcon.on('error', (err) => {
            console.error('[Minecraft] Erro no RCON:', err);
            rcon = null;
        });

        return rcon;
    } catch (err) {
        console.error('[Minecraft] Falha ao conectar no RCON:', err.message);
        rcon = null;
        return null;
    }
}

/**
 * Executa um comando no console do Minecraft
 */
async function sendCommand(command) {
    const conn = await connectRcon();
    if (!conn) return null;

    try {
        const response = await conn.send(command);
        return response;
    } catch (err) {
        console.error('[Minecraft] Erro ao enviar comando:', err.message);
        return null;
    }
}

/**
 * Exemplo: Dá um item para o jogador no Minecraft
 */
async function giveItem(mcUsername, item, amount = 1) {
    // Mapeamento simples de IDs do bot para IDs do Minecraft (exemplo)
    const mcItems = {
        'rosquinha': 'cookie',
        'cerveja_duff': 'potion{Potion:"minecraft:awkward"}',
        'saxofone': 'golden_hoe',
        'skate': 'minecart'
    };

    const mcItemId = mcItems[item] || item;
    return await sendCommand(`give ${mcUsername} ${mcItemId} ${amount}`);
}

/**
 * Exemplo: Manda mensagem no chat do Minecraft
 */
async function broadcast(message) {
    return await sendCommand(`say ${message}`);
}

module.exports = {
    connectRcon,
    sendCommand,
    giveItem,
    broadcast
};
