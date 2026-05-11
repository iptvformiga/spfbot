const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const npcChannel = require('../../systems/npcChannel');

module.exports = new ApplicationCommand({
    command: new SlashCommandBuilder()
        .setName('npc')
        .setDescription('💬 Iniciar conversa com um NPC de Springfield no Minecraft')
        .addStringOption(opt =>
            opt.setName('personagem')
                .setDescription('Com quem você quer falar?')
                .setRequired(true)
                .addChoices(
                    { name: '🍩 Homer Simpson', value: 'homer' },
                    { name: '💙 Marge Simpson', value: 'marge' },
                    { name: '🛹 Bart Simpson', value: 'bart' },
                    { name: '🎷 Lisa Simpson', value: 'lisa' },
                    { name: '✝️ Ned Flanders', value: 'ned' },
                    { name: '🍺 Moe Szyslak', value: 'moe' },
                    { name: '💡 Sr. Burns', value: 'burns' },
                    { name: '🤡 Krusty, o Palhaço', value: 'krusty' },
                )
        ),

    options: {
        cooldown: 5000
    },

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const npcId = interaction.options.getString('personagem');
        const npcData = npcChannel.getNPC(npcId);

        if (!npcData) {
            return interaction.editReply({ content: '❌ NPC não encontrado.' });
        }

        const thread = await npcChannel.getOrCreateNPCThread(
            interaction.guild,
            npcId,
            interaction.user
        );

        if (!thread) {
            return interaction.editReply({
                content: '❌ Não consegui criar o canal de chat. Verifique se `NPC_CATEGORY_ID` está configurado no `.env` ou se existe um canal `#springfield-chat`.'
            });
        }

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(npcData.color)
                    .setTitle(`${npcData.emoji} Iniciando diálogo com ${npcData.name}...`)
                    .setDescription(`Sua conversa foi aberta em ${thread}!\n\n📍 *${npcData.location} — Springfield, MC*`)
                    .setFooter({ text: 'Escreva na thread para conversar • /encerrar para fechar' })
            ]
        });
    }
}).toJSON();

