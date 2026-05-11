const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const inventorySystem = require('../../systems/inventory');
const economySystem = require('../../systems/economy');
const npcs = require('../../data/npcs.json');

module.exports = new ApplicationCommand({
    command: new SlashCommandBuilder()
        .setName('npc_inventario')
        .setDescription('🎒 Veja os itens e dinheiro de um NPC')
        .addStringOption(opt =>
            opt.setName('npc')
                .setDescription('Selecione o NPC')
                .setRequired(true)
                .addChoices(
                    ...Object.values(npcs).map(n => ({ name: `${n.emoji} ${n.name}`, value: n.id }))
                )
        ),

    options: {
        cooldown: 5000
    },

    run: async (client, interaction) => {
        const npcId = interaction.options.getString('npc');
        const npcData = npcs[npcId];
        
        if (!npcData) {
            return interaction.reply({ content: '❌ NPC não encontrado!', ephemeral: true });
        }

        await interaction.deferReply();

        const [inv, balance] = await Promise.all([
            inventorySystem.getInventory(npcId),
            economySystem.getBalance(npcId)
        ]);
        
        const entries = Object.entries(inv);

        const embed = new EmbedBuilder()
            .setColor(npcData.color)
            .setAuthor({
                name: `🎒 Inventário de ${npcData.name} ${npcData.emoji}`,
                iconURL: npcData.avatar || client.user.displayAvatarURL()
            })
            .setDescription(`**Saldo Atual:** 🍩 ${balance} Donuts\n\n**Itens:**`)
            .setFooter({ text: `📍 Springfield • ${npcData.job}` });

        if (entries.length === 0) {
            embed.addFields({ name: '\u200b', value: '*Este NPC não possui itens no momento.*' });
        } else {
            const lines = entries.map(([itemId, qty]) => {
                const item = inventorySystem.getItemData(itemId);
                if (!item) return null;
                const rarity = inventorySystem.getRarityInfo(item.rarity);
                return `${rarity.emoji} **${item.name}** × ${qty}`;
            }).filter(Boolean);

            embed.addFields({ name: '\u200b', value: lines.join('\n') });
        }

        await interaction.editReply({ embeds: [embed] });
    }
}).toJSON();
