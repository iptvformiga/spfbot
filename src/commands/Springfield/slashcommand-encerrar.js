const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const npcChannel = require('../../systems/npcChannel');

module.exports = new ApplicationCommand({
    command: new SlashCommandBuilder()
        .setName('encerrar')
        .setDescription('🚪 Encerrar conversa com o NPC nesta thread'),

    options: {
        cooldown: 3000
    },

    run: async (client, interaction) => {
        const channel = interaction.channel;

        // Precisa estar em uma thread
        if (channel.type !== ChannelType.PrivateThread && channel.type !== ChannelType.PublicThread) {
            return interaction.reply({
                content: '❌ Este comando só funciona dentro de uma thread de NPC!',
                ephemeral: true
            });
        }

        // Acha os dados do NPC nessa thread
        const npcInfo = await npcChannel.getNPCFromThread(channel.id);

        if (!npcInfo) {
            return interaction.reply({
                content: '❌ Esta thread não é uma conversa ativa com NPC.',
                ephemeral: true
            });
        }

        // Só o dono da thread pode encerrar
        if (npcInfo.userId !== interaction.user.id) {
            return interaction.reply({
                content: '❌ Só quem iniciou a conversa pode encerrá-la!',
                ephemeral: true
            });
        }

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x95a5a6)
                    .setDescription(`👋 Você encerrou a conversa com **${npcInfo.npcData.name}**.\n*Até a próxima em Springfield!*`)
            ]
        });

        await npcChannel.closeNPCThread(channel, npcInfo.npcId, npcInfo.userId);
    }
}).toJSON();

