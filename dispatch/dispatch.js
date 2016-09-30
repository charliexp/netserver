/*************************************************************************\
 * File Name    : dispatch.js                                            *
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
var debug   = require('debug')('ledmq:dispatch');
 
var ssdb = storage.connect(config.ssdb.ip, config.ssdb.port);

var settings = {
    keepalive       : 10,
    protocolId      : 'MQTT',
    protocolVersion : 4,
    reconnectPeriod : 1000,
    connectTimeout  : 60 * 1000,
    clean: true
};

// ledmq/cmd/dev/${devId}    --->
// ledmq/cmdack/dev/${devId} <---
// ledmq/msgup/dev/${devId}  --->
// ledmq/msgdw/dev/${devId}  <---
// ledmq/req/dev/${devId}    --->
// ledmq/res/dev/${devId}    <---
            
var client = mqtt.connect( config.mqserver.url,settings );  

client.on('message', function(topic, message){
    
    var devHeat = topic.split('/');
    if( devHeat && devHeat[3] ){
        var did = devHeat[3];
        storage.getServerId( ssdb,did, function(nodeId){
             if( nodeId ){   
                var msgHeat = 'ID/'+ nodeId + '/in/'+ topic;
                client.publish(msgHeat,message);
                debug( 'publish data to ->',msgHeat );
            }
        });
    }
});
client.on('connect', function(topic, message){
    
    client.subscribe('ledmq/cmd/#');
    client.subscribe('ledmq/msgdw/#');
    client.subscribe('ledmq/res/#');
});
		
client.on('error', function(topic, message){
	process.exit(0);
});

	