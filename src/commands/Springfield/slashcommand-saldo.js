const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const economy = require('../../systems/economy');

module.exports = new ApplicationCommand({
    command: new SlashCommandBuilder()
        .setName('saldo')
        .setDescription('🍩 Veja seus Donuts (moeda de Springfield)')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Ver saldo de outro morador')
                .setRequired(false)
        ),

    options: {
        cooldown: 3000
    },

    run: async (client, interaction) => {
        const target = interaction.options.getUser('usuario') || interaction.user;
        const balance = await economy.getBalance(target.id);

        const embed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setAuthor({ name: 'Banco de Springfield 🏦', iconURL: target.displayAvatarURL({ dynamic: true }) })
            .setDescription(`${target.id === interaction.user.id ? '💰 Seu saldo:' : `💰 Saldo de **${target.username}**:`}\n# 💵 $ ${balance.toLocaleString('pt-BR')} Dólares`)
            .setFooter({ text: 'Dinheiro não traz felicidade, mas compra rosquinhas! 🍩' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
}).toJSON();

