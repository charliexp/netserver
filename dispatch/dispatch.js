/*************************************************************************\
 * File Name    : login.js                                              *
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
var mqtt    = require('mqtt');
var storage = require('../acceptor/lib/storage.js');
var config  = require('../config.js');
var debug    = require('debug')('ledmq:dispatch');

var url = 'mqtt://test1:test1@127.0.0.1:1883';   
var ssdb = storage.connect(config.ssdb.ip, config.ssdb.port);

var settings = {
    keepalive       : 10,
    protocolId      : 'MQTT',
    protocolVersion : 4,
    reconnectPeriod : 1000,
    connectTimeout  : 60 * 1000,
    clean: true
};

            // ledmq/cmd/dev/${devId}
            // ledmq/cmdack/dev/${devId}
            // ledmq/msgup/dev/${devId}
            // ledmq/msgdw/dev/${devId}
            // ledmq/req/dev/${devId}
            // ledmq/res/dev/${devId}
            
var client = mqtt.connect(url,settings);  

client.on('message', function(topic, message){
    
    var devHeat = topic.split('/');
    if(devHeat && devHeat[3]){
        var did = devHeat[3];
        storage.getServerId( ssdb,did, function(nodeId){
             if( nodeId ){   
                var msgHeat = nodeId + '/in/'+ topic;
                client.publish(msgHeat,message);
            }
        });
    }
	debug(topic, message.toString());
});
client.on('connect', function(topic, message){
	//client.subscribe('ledmq/+/out/#');
    client.subscribe('ledmq/#');	
});
		
client.on('error', function(topic, message){
	process.exit(0);
});

	