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
'use strict';

var mqtt    = require('mqtt');
var config  = require('../config.js');
var devInfo = require('../acceptor/lib/devInfo.js');
var protocol= require('../acceptor/src/protocol.js');
var comm    = require('../acceptor/src/comm.js');
var Cache   = require('./cache.js');
var debug   = require('debug')('ledmq:dispatch');

devInfo.connect(config.rpcserver.ip, config.rpcserver.port);

var options ={
    ttl:      1,   // TTL 5 sec.
    interval: 60,  // Clean every sec.
    cnts:     1    // repeat cnts
};

var cache = new Cache(options);
////////////////////////////////////////////////////////////////////////// 
var settings = {
    keepalive       : 10,
    protocolId      : 'MQTT',
    protocolVersion : 4,
    reconnectPeriod : 1000,
    connectTimeout  : 60 * 1000,
    clean           : true
};

// ledmq/cmd/dev/${devId}    --->
// ledmq/cmdack/dev/${devId} <---
// ledmq/msgup/dev/${devId}  --->
// ledmq/msgdw/dev/${devId}  <---
// ledmq/req/dev/${devId}    --->
// ledmq/res/dev/${devId}    <---
            
var client = mqtt.connect( config.mqserver.url,settings );  

client.on('message', function(topic, message){
    
    var topicItems = comm.getTopicItems(topic);
    if(!topicItems) return;
    
    else if( topicItems.items[1] === 'devstate' )
    {
        var devId = topicItems.items[2];
    }
    else if( topicItems.items[1] === 'devices' )
    {
        devInfo.getDevices( function(data){
            client.publish( 'ledmq/devices/ack', JSON.stringify(data) );
        });
    }
    else if( topicItems.items[1] === 'cmd' )
    {
        var chan = topicItems.items[1];
        var did  = topicItems.items[3];
 
        devInfo.getNodeId( did, function(nodeid){
 
            if( nodeid ){   

                var msgTopic = comm.makeTopic( 'ID', nodeid, chan, did );
                client.publish( msgTopic, message );  // publish -> devices
                debug( '[cmd]publish data to ->',msgTopic );
            }
            else{
                debug( 'not find device!' );
            }
        });
    }
    /*
    else if( devTopic[1] === 'cmd' && devTopic.length >= 4 )
    {
        var chan = devTopic[1];
        var did  = devTopic[3];
 
        devInfo.getNodeId( did, function(nodeid){
 
            if( nodeid ){   

                var msgTopic = comm.makeTopic( 'ID', nodeid, chan, did );
                var p  = protocol.decode(message);
                if( p && p.sno ){
                    cache.set( p.sno, {topic: msgTopic, msg:message}, 5 );
                }
                client.publish( msgTopic, message );  // publish -> devices
                debug( 'publish data to ->',msgTopic );
            }
            else{
                debug( 'not find device!' );
            }
        });
    }
    else if( devTopic[1] === 'cmdack' )
    {
        var p  = protocol.decode(message);
        if( p && p.sno ){
            cache.del( p.sno );
        }
    }
    */
    
});

client.on('connect', function(topic, message){
    
    client.subscribe('ledmq/cmd/#');
   // client.subscribe('ledmq/msgdw/#');
    client.subscribe('ledmq/devices');
  //client.subscribe('ledmq/devstate/#');
});
		
client.on('error', function(topic, message){
	//process.exit(0);
});

cache.on('expire',function( key, data ){
    debug('expire key:',key );
    if( data ){
        client.publish( data.topic, data.msg );
    }
});

cache.on('clean',function(cnt){
    //console.log('clean count:',cnt);
});
    
 

