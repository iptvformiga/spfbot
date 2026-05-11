const { success } = require("../../utils/Console");
const Event = require("../../structure/Event");
const { startServer } = require("../../systems/webserver");
const { startBedrockServer } = require("../../systems/bedrockWS");

module.exports = new Event({
    event: 'clientReady',
    once: true,
    run: (__client__, client) => {
        success('Logged in as ' + client.user.displayName + ', took ' + ((Date.now() - __client__.login_timestamp) / 1000) + "s.");
        
        // Inicia o servidor para webhooks do Minecraft (Java/Geral)
        startServer(__client__);

        // Inicia o servidor Websocket para Minecraft Bedrock
        startBedrockServer(__client__);
    }
}).toJSON();