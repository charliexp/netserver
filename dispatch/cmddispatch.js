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
var rpcApi  = require('../devdb/rpcapi.js');
var comm    = require('../lib/comm.js');
var Frames  = require('./frames.js');
var Cache   = require('./cache.js');
var debug   = require('debug')('ledmq:dispatch');
var loader  = require('../lib/conf-loader.js');
var config  = loader.readConfigFile('./etc/config.yml');

var mqurl   = config.mqserver.type+ '://'+
              config.mqserver.user+':'+config.mqserver.passwd+'@'+
              config.mqserver.host+':'+config.mqserver.port;
               
rpcApi.connect(config.rpcserver.ip, config.rpcserver.port);

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
            
var client = mqtt.connect( mqurl, settings );  

///////////////////////////////////////////////////////////////////////////
client.on('message', function(topic, message){
    
    var topicItems = comm.getTopicItems(topic);
    if(!topicItems) return;
    
    else if( topicItems.items[1] === 'devstate' )
    {
        var devId = topicItems.items[2];
    }
    else if( topicItems.items[1] === 'devices' )
    {
        rpcApi.getDevices( function(data){
            client.publish( 'ledmq/devices/ack', JSON.stringify(data) );
        });
    }
    else if( topicItems.items[1] === 'command' )
    {
        var chan   = 'cmd';
        var msgObj = Frames.parse(message);
        debug("command chan parse data: ",msgObj );
        
        for(var i = 0; i < msgObj.ids.length; i++ )
        {
            var did  = msgObj.ids[i];  
            (function(did){
                rpcApi.getNodeId( did, function(nodeid){
 
                    if( nodeid ){   

                        var msgTopic = comm.makeTopic( 'ID', nodeid, chan, did );
                        client.publish( msgTopic, msgObj.data[0] );  // publish -> devices
                        debug( '[cmd]publish data to ->',msgTopic );
                    }
                    else{
                        debug( 'not find device!' );
                    }
                });
            })(did);
        }
    }
    else if( (topicItems.items[1] === 'ctrlmsg')&&(topicItems.items[2] === 'timing') )
    {
        var chan    = 'timing';
        var msgData = comm.jsonParse( message ); 
        
        if( (msgData == null)|| (!msgData.sno)||(!msgData.ids_dev) ) 
            return 0;        

        var ids   = msgData.ids_dev.split(',');
        var tdata = { sno:msgData.sno, data :'timing'};
        
        for(var i = 0; i < ids.length; i++ )
        {
            var did  = ids[i];  
            (function(did){
                rpcApi.getNodeId( did, function(nodeid){
 
                    if( nodeid ){   
                       
                        var msgTopic = comm.makeTopic( 'ID', nodeid, chan, did );
                        client.publish( msgTopic, JSON.stringify( tdata ) );  // publish -> devices
                        debug( '[cmd]publish data to ->',msgTopic );                   
                    }
                    else{
                        debug( 'not find device!' );
                    }
                });
            })(did);
        }
    }
});

client.on('connect', function(topic, message){
    
    client.subscribe('ledmq/command');
    client.subscribe('ledmq/devices');
    client.subscribe('ledmq/ctrlmsg/timing');
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
    
 

