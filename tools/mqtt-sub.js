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
var mqtt     = require('mqtt');
var protocol = require('../acceptor/src/protocol.js');
var comm     = require('../acceptor/src/comm.js');
var crypto   = require('crypto'); 
var tlv      = require('../acceptor/lib/tlv.js');
var TLV      = tlv.TLV;

var url = 'mqtt://test1:test1@127.0.0.1:1883';   
var cnt = 0;
var devlist =[];

var settings = {
    keepalive       : 10,
    protocolId      : 'MQTT',
    protocolVersion : 4,
    reconnectPeriod : 1000,
    connectTimeout  : 60 * 1000,
    clean: true
};
    
var client = mqtt.connect(url,settings);  

var getSno = function(){
    return crypto.randomBytes(2).readUIntLE(0, 2); 
}

client.on('message', function(topic, message){
    
    var head = topic.split('/');

    if( head[1].toString() === 'devstate' )
    {
        var devInfo = JSON.parse(message.toString());
        
        if( devInfo&&devInfo.devid ){
            console.log('push devid',devInfo.devid);
            var pos = devlist.indexOf(devInfo.devid);
            if( pos  == -1 ){
                devlist.push(devInfo.devid);            
            }      
        }
        console.log(topic, message.toString());
    }
    else if( head[1].toString() === 'cmdack' )
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
        client.publish( 'ledmq/cmd/dev/'+did, msg );
        console.log('send packet [did:%s, cmd:%s length:%d, count:%d ]',head[3],p.cmd,msg.length,cnt++ );
    }
    else
    {
        console.log(topic, message.toString());
    }
});

client.on('connect', function(topic, message){

    client.subscribe('ledmq/cmdack/dev/#');
    client.subscribe('ledmq/state/dev/#');
    client.subscribe('ledmq/devstate/#');	
});
		
client.on('error', function(topic, message){
	process.exit(0);
});

setInterval(function(){
    
    var msg = {
        ids_dev: devlist.join(','), //"0000000001,0000000002",
        sno    : getSno(),
        timing : 1
    };
    client.publish( 'ledmq/ctrlmsg/timing', JSON.stringify(msg) );
    console.log("send timing");
},5000);

function buildpacket(cmd,data)
{
    var head   = new Buffer(10);
    var body   = data;
    var packet = [];

    head[0] = 0x55;
    head[1] = 0xAA;
    head[2] = 0xFF;
    head[3] = 0xFF;
    head[4] = data.length+4;
    head[5] = ((data.length+4)>>8)
    head[6] = getSno();         //0x00;
    head[7] = (getSno()>>8);    //0x00;
    head[8] = 0x01;
    head[9] = cmd;
    packet.push(head);
    packet.push(body);

    return Buffer.concat( packet, head.length+body.length );
}

var sendCmdPacket = function()
{
    var timeData    = new TLV( 0x01, new Buffer(1024) );
    var dataEncoded = timeData.encode();
    var data = buildpacket(0x02,dataEncoded);
    var datalen = new Buffer(6);  

    datalen[0]  =  (data.length+2)&0x000000FF;
    datalen[1]  = ((data.length+2)&0x0000FF00)>> 8;
    datalen[2]  = ((data.length+2)&0x00FF0000)>>16;
    datalen[3]  = ((data.length+2)&0xFF000000)>>24;
    datalen[4]  = (data.length)&0x00FF;
    datalen[5]  = ((data.length)&0xFF00)>> 8;
    var lvData  = Buffer.concat([datalen,data]); 	 
    var ids  = devlist.join(',');
    var msg  = comm.makeLvPacket(ids,lvData);
    client.publish( 'ledmq/command', msg );
    console.log('->send packet [len:%s] ',msg.length,msg );
}    
	
setInterval(function(){
    sendCmdPacket();
},10000);    