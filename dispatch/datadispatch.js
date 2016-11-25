/*************************************************************************\
 * File Name    : req_dispatch.js                                        *
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
var config  = require('../etc/appconfig.js');
var rpcApi  = require('../devdb/rpcapi.js');
var protocol= require('../lib/protocol.js');
var comm    = require('../lib/comm.js');
var db      = require('./centdb.js');
var Frames  = require('./frames.js');
var debug   = require('debug')('ledmq:req_dispatch');
var Cache   = require('./cache.js');

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
            
var client = mqtt.connect( config.mqserver.url,settings );  

client.on('message', function(topic, message){
    
    var items = comm.getTopicItems( topic );
    
    if( !items ) return;
    
    if( (items.items[1] === 'packet')&&(items.len >= 3) )
    {
        var taskId    = items.items[2];                         // 缓存数据
        var framesObj = Frames.prase(message);  
        
        if( framesObj && (framesObj.length > 0) )
        {
            for( var i = 0; i< framesObj.length; i++ ){
                db.putdata( taskId, i, framesObj.data[i], function(err){} );
            }
        }
        client.publish( 'ledmq/pktack/'+taskId, '{"cmd":"ok"}',{ qos:0, retain: true } ); 
    }
    else
    {
        client.publish( 'ledmq/pktack/'+taskId, '{"cmd":"error"}',{ qos:0, retain: true } ); 
    }
});

client.on('connect', function(topic, message){
    
    client.subscribe('ledmq/packet/#');
});
		
client.on('error', function(topic, message){
	//process.exit(0);
});

        
 

