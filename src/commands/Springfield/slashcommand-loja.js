const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const inventorySystem = require('../../systems/inventory');
const economy = require('../../systems/economy');

const RARITY_ORDER = ['comum', 'incomum', 'raro', 'epico', 'lendario'];

module.exports = new ApplicationCommand({
    command: new SlashCommandBuilder()
        .setName('loja')
        .setDescription('🏪 Loja de Springfield — compre itens com seus Donuts!')
        .addStringOption(opt =>
            opt.setName('comprar')
                .setDescription('ID do item para comprar diretamente')
                .setRequired(false)
        )
        .addIntegerOption(opt =>
            opt.setName('quantidade')
                .setDescription('Quantidade a comprar (padrão: 1)')
                .setMinValue(1)
                .setMaxValue(99)
                .setRequired(false)
        ),

    options: {
        cooldown: 5000
    },

    run: async (client, interaction) => {
        await interaction.deferReply();

        const itemId = interaction.options.getString('comprar');
        const qty = interaction.options.getInteger('quantidade') || 1;

        // Modo compra direta
        if (itemId) {
            const result = await inventorySystem.buyItem(interaction.user.id, itemId, qty);
            if (!result.success) {
                return interaction.editReply({ content: `❌ ${result.reason}` });
            }

            const rarityInfo = inventorySystem.getRarityInfo(result.item.rarity);
            const balance = await economy.getBalance(interaction.user.id);

            const embed = new EmbedBuilder()
                .setColor(rarityInfo.color)
                .setTitle('✅ Compra Realizada!')
                .setDescription(`Você comprou **${result.item.emoji} ${result.item.name}** × ${qty}!`)
                .addFields(
                    { name: '💸 Pago', value: `$ ${result.totalCost}`, inline: true },
                    { name: '💰 Saldo restante', value: `$ ${balance.toLocaleString('pt-BR')}`, inline: true },
                    { name: '✨ Raridade', value: `${rarityInfo.emoji} ${rarityInfo.label}`, inline: true },
                )
                .setFooter({ text: 'Loja de Springfield — Obrigado pela compra!' });

            return interaction.editReply({ embeds: [embed] });
        }

        // Modo catálogo
        const shopItems = inventorySystem.getShopItems();
        const balance = await economy.getBalance(interaction.user.id);

        // Ordena por raridade
        shopItems.sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));

        const embed = new EmbedBuilder()
            .setColor(0xf39c12)
            .setTitle('🏪 Loja de Springfield')
            .setDescription(`**Seu saldo:** $ ${balance.toLocaleString('pt-BR')}\n\nUse \`/loja comprar:<id_do_item>\` para comprar!\n`)
            .setFooter({ text: 'Mmm... tanto para comprar... — Homer' });

        const grouped = {};
        for (const item of shopItems) {
            if (!grouped[item.rarity]) grouped[item.rarity] = [];
            grouped[item.rarity].push(item);
        }

        for (const rarity of RARITY_ORDER) {
            if (!grouped[rarity]) continue;
            const rarityInfo = inventorySystem.getRarityInfo(rarity);
            const lines = grouped[rarity].map(item =>
                `${item.emoji} **${item.name}** — $ ${item.price}\n└ ID: \`${item.id}\` • *${item.description}*`
            ).join('\n\n');

            embed.addFields({
                name: `${rarityInfo.emoji} ${rarityInfo.label}`,
                value: lines,
                inline: false
            });
        }

        await interaction.editReply({ embeds: [embed] });
    }
}).toJSON();

