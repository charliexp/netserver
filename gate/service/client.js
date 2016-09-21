/*************************************************************************\
 * File Name    : client.js                                              *
 * --------------------------------------------------------------------- *
 * Title        :                                                        *
 * Revision     : V1.0                                                   *
 * Notes        :                                                        *
 * --------------------------------------------------------------------- *
 * Revision History:                                                     *
 *   When             Who         Revision       Description of change   *
 * -----------    -----------    ---------      ------------------------ *
 * 04-18-2014      Mark Wolfe       V0.1.5        create this program    * 
 * 08-27-2016      charlie_weng     V1.0          fix this program       *
 *                                                                       *
\*************************************************************************/
var mqtt    = require('mqtt');
var mqttrpc = require('../../index.js');

//var settings = {
//  reconnectPeriod: 5000 // chill on the reconnects
//}

var settings = {
    keepalive       : 10,
    protocolId      : 'MQTT',
    protocolVersion : 4,
    reconnectPeriod : 1000,
    connectTimeout  : 60 * 1000,
    clean: true
}

// client connection
//var mqttclient = mqtt.connect('mqtt://localhost', settings);
var mqttclient = mqtt.connect('mqtt://test1:test1@127.0.0.1:1883', settings);

// build a new RPC client
var client = mqttrpc.client(mqttclient);

// optionally configure the codec, which defaults to JSON, also supports msgpack
//client.format('json');
client.format('msgpack');

// call the remote method
setInterval(function(){
    client.callRemote('proto/time', 'localtime',{}, function(err, data){
        console.log( 'callRemote', err, data );
    }); 
},1000);
 
 
