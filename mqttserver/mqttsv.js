/*************************************************************************\
 * File Name    : mqttsv.js                                              *
 * --------------------------------------------------------------------- *
 * Title        :                                                        *
 * Revision     : V1.0                                                   *
 * Notes        :                                                        *
 * --------------------------------------------------------------------- *
 * Revision History:                                                     *
 *   When             Who         Revision       Description of change   *
 * -----------    -----------    ---------      ------------------------ *
 * 2-15-2016      charlie_weng     V1.0          Created the program     *
 *                                                                       *
\*************************************************************************/

var mosca  = require('mosca');
var debug  = require('debug')('ledmq:mqttsv');
var loader = require('../lib/conf-loader.js');
var config = loader.readConfigFile('./etc/config.yml','mqserver');

//////////////////////////////////////////////////////////
var settings = {
    port: config.port
};

//here we start mosca
var server = new mosca.Server(settings);
server.on('ready', setup);

// fired when the mqtt server is ready
function setup() 
{
	server.authenticate       = authenticate;
    server.authorizePublish   = authorizePublish;
    server.authorizeSubscribe = authorizeSubscribe;
    console.log('mqtt server is up and running')
}

// Accepts the connection if the username and password are valid
var authenticate = function(client, username, password, callback) {
    debug('user: ',username, password.toString());
    if( (username === config.user)&&(password.toString() === config.passwd) ){
        callback(null, true);
        
    }else{
        callback(null, false);
    }
}

var authorizePublish = function (client, topic, payload, callback) {
    callback(null, true);
}

var authorizeSubscribe = function (client, topic, callback) {
    callback(null, true);
}

// fired whena  client is connected
server.on('clientConnected', function (client) {
    debug('client connected', client.id);
});

server.published = function (packet, client, callback) {
	
    if (packet.topic.indexOf('$SYS') === 0) {
        return callback();
    }
	if (packet.topic.indexOf('ch') === 0) {
        return callback();
    }
}

// fired when a client subscribes to a topic
server.on('subscribed', function (topic, client) {
    debug('subscribed : ', topic);
});

// fired when a client subscribes to a topic
server.on('unsubscribed', function (topic, client) {
    debug('unsubscribed : ', topic);
});

// fired when a client is disconnecting
server.on('clientDisconnecting', function (client) {
    debug('clientDisconnecting : ', client.id);
});

// fired when a client is disconnected
server.on('clientDisconnected', function (client) {
    debug('clientDisconnected : ', client.id);
});
