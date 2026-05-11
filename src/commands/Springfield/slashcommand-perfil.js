const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const economy = require('../../systems/economy');
const inventory = require('../../systems/inventory');
const jobs = require('../../systems/jobs');

module.exports = new ApplicationCommand({
    command: new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('🏠 Veja seu perfil de morador de Springfield'),
    
    options: {
        cooldown: 5000
    },

    run: async (client, interaction) => {
        await interaction.deferReply();

        const user = interaction.user;
        const profile = await economy.getProfile(user.id);
        const inv = await inventory.getInventory(user.id);

        const itemCount = Object.values(inv).reduce((sum, qty) => sum + qty, 0);

        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`🏘️ ${user.displayName || user.username} — Morador de Springfield`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '💵 Dólares', value: `**$ ${profile.balance.toLocaleString('pt-BR')}**`, inline: true },
                { name: '📦 Itens no Inventário', value: `**${itemCount}** itens`, inline: true },
                { name: '📈 Total Ganho', value: `$ ${profile.totalEarned.toLocaleString('pt-BR')}`, inline: true },
                { name: '🛒 Total Gasto', value: `$ ${profile.totalSpent.toLocaleString('pt-BR')}`, inline: true },
            )
            .setFooter({ text: '📍 Springfield, Oregon • Bem-vindo à cidade mais louca do mundo!' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
}).toJSON();

