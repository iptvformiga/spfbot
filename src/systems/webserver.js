const express = require('express');
const npcChannel = require('./npcChannel');

const app = express();
app.use(express.json());

const PORT = process.env.API_PORT || 3000;

/**
 * Inicia o servidor para receber gatilhos do Minecraft
 */
function startServer(client) {
    // Endpoint para iniciar diálogo via Minecraft
    // POST /npc-trigger { npcId: "homer", discordUserId: "123..." }
    app.post('/npc-trigger', async (req, res) => {
        const { npcId, discordUserId } = req.body;

        if (!npcId || !discordUserId) {
            return res.status(400).json({ error: 'Missing npcId or discordUserId' });
        }

        try {
            const guildId = process.env.GUILD_ID;
            const guild = await client.guilds.fetch(guildId);
            const user = await client.users.fetch(discordUserId);

            const thread = await npcChannel.getOrCreateNPCThread(guild, npcId, user);

            if (thread) {
                res.json({ success: true, threadId: thread.id, threadUrl: `https://discord.com/channels/${guildId}/${thread.id}` });
            } else {
                res.status(500).json({ error: 'Could not create thread' });
            }
        } catch (err) {
            console.error('[API] Erro ao processar gatilho:', err.message);
            res.status(500).json({ error: err.message });
        }
    });

    app.listen(PORT, () => {
        console.log(`[API] Servidor Springfield rodando na porta ${PORT}`);
    });
}

module.exports = { startServer };
