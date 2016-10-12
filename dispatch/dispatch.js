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
var storage = require('../acceptor/lib/storage.js');
var config  = require('../config.js');
var devInfo = require('../acceptor/lib/devInfo.js');
//var axon    = require('axon');
var debug   = require('debug')('ledmq:dispatch');
//var req     = axon.socket('req');

var devStats = {};

devInfo.connect(config.rpcserver.ip, config.rpcserver.port);
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
    
    var devTopic = topic.split('/');
    if( !devTopic )
        return;
    
    else if( devTopic[1] === 'devstate' )
    {
        var devId = devTopic[2];
    }
    else if( devTopic.length >= 4 )
    {
        var chan = devTopic[1];
        var did  = devTopic[3];
 
        devInfo.getNodeId( did, function(nodeid){
 
            if( nodeid ){   
                var msgTopic = 'ID/'+ nodeid + '/in/'+ chan +'/dev/'+ did;
                client.publish( msgTopic, message );
                debug( 'publish data to ->',msgTopic );
            }
            else
            {
                debug( 'not find device!' );
            }
        });
    }
});

client.on('connect', function(topic, message){
    
    client.subscribe('ledmq/cmd/#');
    client.subscribe('ledmq/msgdw/#');
    client.subscribe('ledmq/res/#');
    //client.subscribe('ledmq/devstate/#');
});
		
client.on('error', function(topic, message){
	//process.exit(0);
});



