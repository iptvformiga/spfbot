const WebSocket = require('ws');
const crypto = require('crypto');
const npcChannel = require('./npcChannel');

let wss = null;
let mcConnection = null;

/**
 * Inicia o Servidor Websocket para Minecraft Bedrock
 * No jogo, use: /connect <ip-do-bot>:<porta>
 */
function startBedrockServer(client) {
    const port = process.env.MC_WS_PORT || 8000;
    wss = new WebSocket.Server({ port });

    console.log(`[Bedrock WS] Servidor aguardando conexão na porta ${port}`);
    console.log(`[Bedrock WS] No jogo digite: /connect <seu-ip>:${port}`);

    wss.on('connection', (socket) => {
        console.log('[Bedrock WS] Minecraft conectado!');
        mcConnection = socket;

        // Ativa escuta de eventos do jogo
        subscribeToEvent(socket, 'PlayerMessage'); // Chat
        
        socket.on('message', (packet) => {
            const data = JSON.parse(packet);
            handleIncomingPacket(client, data);
        });

        socket.on('close', () => {
            console.log('[Bedrock WS] Minecraft desconectado.');
            mcConnection = null;
        });
    });
}

/**
 * Inscreve o socket em eventos do Minecraft
 */
function subscribeToEvent(socket, eventName) {
    socket.send(JSON.stringify({
        header: {
            version: 1,
            requestId: crypto.randomUUID(),
            messagePurpose: 'subscribe',
            messageType: 'commandRequest'
        },
        body: { eventName }
    }));
}

/**
 * Envia um comando para o Minecraft Bedrock
 */
function sendMCCommand(command) {
    if (!mcConnection) return console.warn('[Bedrock WS] Sem conexão ativa com o jogo.');

    const requestId = crypto.randomUUID();
    mcConnection.send(JSON.stringify({
        header: {
            version: 1,
            requestId: requestId,
            messagePurpose: 'commandRequest',
            messageType: 'commandRequest'
        },
        body: {
            commandLine: command,
            version: 1
        }
    }));
}

/**
 * Processa pacotes que chegam do Minecraft
 */
async function handleIncomingPacket(client, data) {
    // Se for mensagem de chat ou saída de comando (PlayerMessage ou CommandOutput)
    if (data.header.eventName === 'PlayerMessage') {
        const { message, sender } = data.body;

        // Gatilho: NPC executa tellraw @p {"rawtext":[{"text":"[DIALOGO] npcId"}]}
        // No Bedrock, isso aparece como uma mensagem no chat
        if (message.includes('[DIALOGO]')) {
            const parts = message.split('[DIALOGO]');
            const npcId = parts[1]?.trim().toLowerCase();
            
            if (npcId && sender) {
                console.log(`[Bedrock WS] Jogador ${sender} ativou diálogo com ${npcId}`);
                
                // Envia aviso no chat do jogo
                sendMCCommand(`tellraw @a[name="${sender}"] {"rawtext":[{"text":"§e[SPF] §fAbrindo canal com §6${npcId}§f no seu Discord... Check lá! 📱"}]}`);
                
                // DISPARO NO DISCORD
                // Para isso funcionar 100%, precisamos que o Gamertag do player esteja vinculado ao ID do Discord.
                // Vou procurar na DB por esse vínculo.
                const { QuickYAML } = require('quick-yaml.db');
                const db = new QuickYAML('./database.yml');
                const discordUserId = await db.get(`vincular.${sender}`);

                if (discordUserId) {
                    const guildId = process.env.GUILD_ID;
                    try {
                        const guild = await client.guilds.fetch(guildId);
                        const user = await client.users.fetch(discordUserId);
                        await npcChannel.getOrCreateNPCThread(guild, npcId, user);
                    } catch (err) {
                        console.error('[Bedrock WS] Erro ao abrir thread:', err.message);
                    }
                } else {
                    sendMCCommand(`tellraw @a[name="${sender}"] {"rawtext":[{"text":"§c[SPF] §fErro: Seu Gamertag §e${sender}§f não está vinculado ao Discord! Use /vincular no Discord."}]}`);
                }
            }
        }
    }
}


module.exports = {
    startBedrockServer,
    sendMCCommand
};
