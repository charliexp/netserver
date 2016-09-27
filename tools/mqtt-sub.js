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
var mqtt   = require('mqtt');

var url = 'mqtt://test1:test1@127.0.0.1:1883';   

var settings = {
    keepalive       : 10,
    protocolId      : 'MQTT',
    protocolVersion : 4,
    reconnectPeriod : 1000,
    connectTimeout  : 60 * 1000,
    clean: true
};
    
var client = mqtt.connect(url,settings);  

client.on('message', function(topic, message){
	console.log(topic, message.toString());
});
client.on('connect', function(topic, message){
	client.subscribe('ledmq/+/out/#');	
});
		
client.on('error', function(topic, message){
	process.exit(0);
});

	