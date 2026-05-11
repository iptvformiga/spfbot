const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const jobsSystem = require('../../systems/jobs');

module.exports = new ApplicationCommand({
    command: new SlashCommandBuilder()
        .setName('trabalhar')
        .setDescription('👷 Trabalhe em Springfield e ganhe Donuts!')
        .addStringOption(opt =>
            opt.setName('trabalho')
                .setDescription('Qual trabalho fazer')
                .setRequired(true)
                .addChoices(
                    { name: '☢️ Operador Nuclear (Homer)', value: 'operador_nuclear' },
                    { name: '🎸 Vendedor do Leftorium (Ned)', value: 'vendedor_mel' },
                    { name: '🍺 Barman do Moe (Moe)', value: 'barman_moe' },
                    { name: '🍔 Chef do Krusty Burger (Krusty)', value: 'chef_krusty' },
                    { name: '📚 Professor da Escola (Skinner)', value: 'professor' },
                    { name: '🔍 Detetive de Springfield (Wiggum)', value: 'detetive' },
                    { name: '🏥 Médico - Dr. Nick', value: 'medico' },
                )
        ),

    options: {
        cooldown: 3000
    },

    run: async (client, interaction) => {
        const jobId = interaction.options.getString('trabalho');
        await interaction.deferReply();

        const result = await jobsSystem.doWork(interaction.user.id, jobId);

        if (!result.success) {
            const embed = new EmbedBuilder()
                .setColor(0xe74c3c)
                .setTitle('⏰ Ainda em Cooldown!')
                .setDescription(result.reason);
            return interaction.editReply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle(`${result.job.emoji} ${result.job.name}`)
            .setDescription(`*${result.response}*`)
            .addFields(
                { name: '💰 Salário recebido', value: `**$ ${result.pay} Dólares**`, inline: true },
            );

        if (result.earnedItem) {
            embed.addFields({
                name: '🎁 Item Encontrado!',
                value: `${result.earnedItem.emoji} **${result.earnedItem.name}** foi adicionado ao inventário!`,
                inline: true
            });
            embed.setColor(0x9b59b6);
        }

        embed
            .addFields({ name: '⏰ Próximo turno em', value: '**1 hora**', inline: true })
            .setFooter({ text: `Personagem: ${result.job.character} • Springfield Work Bureau` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
}).toJSON();

