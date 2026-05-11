const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const { QuickYAML } = require('quick-yaml.db');

const db = new QuickYAML('./database.yml');

module.exports = new ApplicationCommand({
    command: new SlashCommandBuilder()
        .setName('vincular')
        .setDescription('🔗 Vincule seu Gamertag do Minecraft ao Discord')
        .addStringOption(opt =>
            opt.setName('gamertag')
                .setDescription('Seu nome exatamente como aparece no Minecraft Bedrock')
                .setRequired(true)
        ),

    options: {
        cooldown: 5000
    },

    run: async (client, interaction) => {
        const gamertag = interaction.options.getString('gamertag');

        await db.set(`vincular.${gamertag}`, interaction.user.id);

        const embed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle('✅ Gamertag Vinculada!')
            .setDescription(`Agora o bot sabe que o jogador **${gamertag}** no Minecraft é você (**${interaction.user.username}**)!`)
            .addFields(
                { name: '🎮 Minecraft', value: `\`${gamertag}\``, inline: true },
                { name: '📱 Discord', value: `<@${interaction.user.id}>`, inline: true }
            )
            .setFooter({ text: 'Agora você pode interagir com os NPCs em Springfield!' });

        await interaction.reply({ embeds: [embed] });
    }
}).toJSON();

