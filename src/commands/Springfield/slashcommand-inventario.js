const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const inventorySystem = require('../../systems/inventory');

module.exports = new ApplicationCommand({
    command: new SlashCommandBuilder()
        .setName('inventario')
        .setDescription('🎒 Veja seus itens em Springfield')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Ver inventário de outro morador')
                .setRequired(false)
        ),

    options: {
        cooldown: 5000
    },

    run: async (client, interaction) => {
        const target = interaction.options.getUser('usuario') || interaction.user;
        await interaction.deferReply();

        const inv = await inventorySystem.getInventory(target.id);
        const entries = Object.entries(inv);

        const embed = new EmbedBuilder()
            .setColor(0x8e44ad)
            .setAuthor({
                name: `🎒 Inventário de ${target.displayName || target.username}`,
                iconURL: target.displayAvatarURL({ dynamic: true })
            })
            .setFooter({ text: '📦 Springfield Item Warehouse — Use /loja para comprar mais!' });

        if (entries.length === 0) {
            embed.setDescription('*Inventário vazio... Nem uma rosquinha!*\n\nUse `/loja` para comprar itens.');
        } else {
            const lines = entries.map(([itemId, qty]) => {
                const item = inventorySystem.getItemData(itemId);
                if (!item) return null;
                const rarity = inventorySystem.getRarityInfo(item.rarity);
                return `${rarity.emoji} **${item.name}** × ${qty}\n└ *${item.description}*`;
            }).filter(Boolean);

            embed.setDescription(lines.join('\n\n'));
        }

        await interaction.editReply({ embeds: [embed] });
    }
}).toJSON();

