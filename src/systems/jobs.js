const { QuickYAML } = require('quick-yaml.db');
const config = require('../config');
const economy = require('./economy');
const inventory = require('./inventory');

const db = new QuickYAML(config.database.path);

const JOBS = {
    operador_nuclear: {
        id: 'operador_nuclear',
        name: 'Operador Nuclear ☢️',
        description: 'Trabalha no Setor 7-G da Usina Nuclear do Sr. Burns.',
        character: 'Homer Simpson',
        minPay: 30,
        maxPay: 60,
        cooldownMs: 3600000, // 1 hora
        emoji: '☢️',
        itemChance: 0.15,
        possibleItems: ['rosquinha', 'reator_nuclear'],
        responses: [
            'Você apertou alguns botões aleatórios e por algum milagre não explodiu nada. D\'oh!',
            'Você dormiu na cabine de controle mas o contador Geiger não disparou. Sucesso!',
            'O Sr. Burns não te viu dormindo. Hoje foi um bom dia na usina.',
            'Você salvou Springfield de um desastre nuclear sem nem perceber o que fez.',
        ]
    },
    vendedor_mel: {
        id: 'vendedor_mel',
        name: 'Vendedor do Leftorium 🎸',
        description: 'Vende itens para canhotos na loja do Ned Flanders.',
        character: 'Ned Flanders',
        minPay: 20,
        maxPay: 40,
        cooldownMs: 3600000,
        emoji: '🎸',
        itemChance: 0.20,
        possibleItems: ['biblia', 'terno_azul'],
        responses: [
            'Okilly-dokilly! Você vendeu uma tesoura canhota e foi abençoado pelo Ned.',
            'Um cliente comprou um abridor de latas canhoto. Deus seja louvado!',
            'Você ajudou um canhoto encontrar a caneta perfeita. Milagre pequeno, mas milagre!',
        ]
    },
    barman_moe: {
        id: 'barman_moe',
        name: 'Barman do Moe 🍺',
        description: 'Serve cervejas Duff e ouve as tristezas dos clientes na Taberna do Moe.',
        character: 'Moe Szyslak',
        minPay: 25,
        maxPay: 55,
        cooldownMs: 3600000,
        emoji: '🍺',
        itemChance: 0.25,
        possibleItems: ['cerveja_duff', 'rosquinha'],
        responses: [
            'Você serviu cerveja pra Homer e Barney por horas. O chão tá grudento mas a gorjeta foi boa.',
            'O Moe te deixou ficar com as gorjetas hoje. Que raro.',
            'Você atendeu o telefone e era mais um trote do Bart. Anotou o número.',
        ]
    },
    chef_krusty: {
        id: 'chef_krusty',
        name: 'Chef do Krusty Burger 🍔',
        description: 'Prepara os hambúrgueres duvidosos do Krusty Burger.',
        character: 'Krusty',
        minPay: 15,
        maxPay: 35,
        cooldownMs: 3600000,
        emoji: '🍔',
        itemChance: 0.10,
        possibleItems: ['rosquinha', 'bolo_marge'],
        responses: [
            'Você fritou hambúrgueres que são 40% menos melhores que qualquer coisa. Krusty aprovou!',
            'O Krusty apareceu bêbado no turno. Você assumiu o comando e ninguém percebeu.',
            'Você descobriu o que tem na salsicha especial. Preferiu não divulgar.',
        ]
    },
    professor: {
        id: 'professor',
        name: 'Professor da Escola 📚',
        description: 'Tenta ensinar algo para as crianças de Springfield. Boa sorte.',
        character: 'Seymour Skinner',
        minPay: 20,
        maxPay: 45,
        cooldownMs: 3600000,
        emoji: '📚',
        itemChance: 0.12,
        possibleItems: ['biblia', 'saxofone'],
        responses: [
            'Você ensinou matemática para o Bart. Ele não prestou atenção, mas você foi pago.',
            'O Skinner te elogiou por manter a turma quieta por 10 minutos inteiros.',
            'Você sobreviveu ao dia sem ser atingido por um aviãozinho de papel.',
        ]
    },
    detetive: {
        id: 'detetive',
        name: 'Detetive de Springfield 🔍',
        description: 'Investiga crimes menores em Springfield. Muito menores.',
        character: 'Chefe Wiggum',
        minPay: 25,
        maxPay: 50,
        cooldownMs: 3600000,
        emoji: '🔍',
        itemChance: 0.18,
        possibleItems: ['estilingue', 'terno_azul'],
        responses: [
            'Você resolveu um crime de roubo de rosquinha. O suspeito era óbvio: Homer.',
            'Você patrulhou a cidade sem fazer nada. O Chefe Wiggum está orgulhoso.',
            'Você prendeu o Snake mas ele fugiu em 10 minutos. Rotina normal.',
        ]
    },
    medico: {
        id: 'medico',
        name: 'Médico - Dr. Nick 🏥',
        description: 'Atende pacientes no hospital de Springfield. Hola a todos!',
        character: 'Dr. Nick',
        minPay: 40,
        maxPay: 80,
        cooldownMs: 3600000,
        emoji: '🏥',
        itemChance: 0.20,
        possibleItems: ['bolo_marge', 'reator_nuclear'],
        responses: [
            '¡Hola a todos! Você fez uma cirurgia que o paciente sobreviveu. Recorde pessoal!',
            'Você prescreveu o remédio certo pela primeira vez em meses. Os astros alinharam.',
            'O hospital deixou você trabalhar por mais um dia. Milagre de Springfield.',
        ]
    }
};

/**
 * Retorna todos os trabalhos
 */
function getJobs() {
    return Object.values(JOBS);
}

/**
 * Retorna um trabalho pelo ID
 */
function getJob(jobId) {
    return JOBS[jobId] || null;
}

/**
 * Verifica se usuário está em cooldown
 */
async function getCooldown(userId, jobId) {
    const lastWork = await db.get(`jobs.${userId}.${jobId}.lastWork`) || 0;
    const job = getJob(jobId);
    if (!job) return null;
    const remaining = (lastWork + job.cooldownMs) - Date.now();
    return remaining > 0 ? remaining : 0;
}

/**
 * Executa um trabalho para o usuário
 */
async function doWork(userId, jobId) {
    const job = getJob(jobId);
    if (!job) return { success: false, reason: 'Trabalho não encontrado.' };

    const cooldown = await getCooldown(userId, jobId);
    if (cooldown > 0) {
        const minutes = Math.ceil(cooldown / 60000);
        return { 
            success: false, 
            reason: `Você já trabalhou aqui! Volte em **${minutes} minuto(s)**. ⏰` 
        };
    }

    // Calcular salário
    const pay = Math.floor(Math.random() * (job.maxPay - job.minPay + 1)) + job.minPay;
    await economy.addBalance(userId, pay);
    await economy.recordEarning(userId, pay);
    await db.set(`jobs.${userId}.${jobId}.lastWork`, Date.now());

    // Chance de item
    let earnedItem = null;
    if (Math.random() < job.itemChance && job.possibleItems.length > 0) {
        const itemId = job.possibleItems[Math.floor(Math.random() * job.possibleItems.length)];
        await inventory.addItem(userId, itemId, 1);
        earnedItem = inventory.getItemData(itemId);
    }

    // Mensagem aleatória de resultado
    const response = job.responses[Math.floor(Math.random() * job.responses.length)];

    return {
        success: true,
        pay,
        earnedItem,
        response,
        job
    };
}

module.exports = {
    getJobs,
    getJob,
    getCooldown,
    doWork,
    JOBS
};
