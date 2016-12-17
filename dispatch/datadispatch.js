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
var rpcApi  = require('../devdb/rpcapi.js');
var comm    = require('../lib/comm.js');
var db      = require('./centdb.js');
var Frames  = require('./frames.js');
var debug   = require('debug')('ledmq:req_dispatch');
var Cache   = require('./cache.js');
var loader  = require('../lib/conf-loader.js');
var config  = loader.readConfigFile('./etc/config.yml');

var mqurl   = config.mqserver.type+ '://'+
              config.mqserver.user+':'+config.mqserver.passwd+'@'+
              config.mqserver.host+':'+config.mqserver.port;
               
rpcApi.connect(config.rpcserver.ip, config.rpcserver.port);

var options ={
    ttl:      5,   // TTL 5 sec.
    interval: 60,  // Clean every sec.
    cnts:     3    // repeat cnts
};

function flightCache(options)
{
    this.cache = new Cache(options);
    this.limit = 1;
    this.indx  = 0;
} 

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

        
 

