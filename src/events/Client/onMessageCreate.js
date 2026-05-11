const { ChannelType } = require('discord.js');
const Event = require('../../structure/Event');
const npcChannel = require('../../systems/npcChannel');

module.exports = new Event({
    event: 'messageCreate',
    run: async (client, message) => {
        // Ignora bots e mensagens fora de threads
        if (message.author.bot) return;
        if (
            message.channel.type !== ChannelType.PrivateThread &&
            message.channel.type !== ChannelType.PublicThread
        ) return;

        // Ignora comandos slash que aparecem como mensagens
        if (message.content.startsWith('/')) return;

        // Verifica se a thread pertence a algum NPC ativo
        const npcInfo = await npcChannel.getNPCFromThread(message.channel.id);
        if (!npcInfo) return;

        // Verifica se é o dono da conversa falando
        if (message.author.id !== npcInfo.userId) {
            // Outros membros não devem interferir
            return;
        }

        // Processa a mensagem com a IA
        await npcChannel.processNPCMessage(
            message.channel,
            npcInfo.npcId,
            message.author.id,
            message.content
        );
    }
}).toJSON();

