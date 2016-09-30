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
var protocol = require('../acceptor/src/protocol.js');

var url = 'mqtt://test1:test1@127.0.0.1:1883';   
var cnt = 0;
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
    
    var head = topic.split('/');
    
    if( head[1] !== 'devstate' )
    {
        var p    = protocol.decode(message);
        var obj  = {};
        var did  = topic.split('/')[3];
        obj.head = p.head;
        obj.addr = p.addr;
        obj.sno  = p.sno;
        obj.type = p.type;
        obj.cmd  = p.cmd|0x80;
        obj.data = new Buffer(1024);
        var msg  = protocol.encode(obj);
        client.publish( 'ledmq/res/dev/'+did, msg );
        console.log('send packet [did:%s, length:%d, count:%d ]',head[3],msg.length,cnt++ );
    }
    else
    {
        console.log(topic, message.toString());
    }
});
client.on('connect', function(topic, message){
	//client.subscribe('ledmq/+/out/#');
    client.subscribe('ledmq/cmd/#');
    client.subscribe('ledmq/req/#');
    client.subscribe('ledmq/devstate/#');	
});
		
client.on('error', function(topic, message){
	process.exit(0);
});

//setInterval(function(){
//    client.publish('ledmq/res/dev/0000000010','ajfdasfashnfasfaslflasflasjfjaslfjaslfjl');
     // ledmq/res/dev/${devId}
//},1000);
 // ledmq/res/dev/${devId}
	