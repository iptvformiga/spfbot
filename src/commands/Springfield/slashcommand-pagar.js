const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const economy = require('../../systems/economy');

module.exports = new ApplicationCommand({
    command: new SlashCommandBuilder()
        .setName('pagar')
        .setDescription('💸 Transferir Donuts para outro morador de Springfield')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Para quem enviar')
                .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName('quantidade')
                .setDescription('Quantos Donuts enviar')
                .setMinValue(1)
                .setRequired(true)
        ),

    options: {
        cooldown: 5000
    },

    run: async (client, interaction) => {
        const target = interaction.options.getUser('usuario');
        const amount = interaction.options.getInteger('quantidade');

        if (target.id === interaction.user.id) {
            return interaction.reply({ content: '❌ Você não pode se pagar, D\'oh!', ephemeral: true });
        }
        if (target.bot) {
            return interaction.reply({ content: '❌ Robôs não aceitam dinheiro!', ephemeral: true });
        }

        await interaction.deferReply();

        const result = await economy.transfer(interaction.user.id, target.id, amount);

        if (!result.success) {
            return interaction.editReply({ content: `❌ ${result.reason}` });
        }

        const senderBalance = await economy.getBalance(interaction.user.id);

        const embed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle('💸 Transferência de Dólares!')
            .setDescription(`**${interaction.user.username}** enviou **$ ${amount} Dólares** para **${target.username}**!`)
            .addFields(
                { name: '💰 Seu saldo restante', value: `$ ${senderBalance.toLocaleString('pt-BR')}`, inline: true }
            )
            .setFooter({ text: 'Banco de Springfield — D\'oh, foi rápido!' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
}).toJSON();

