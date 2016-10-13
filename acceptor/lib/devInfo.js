/*************************************************************************\
 * File Name    : devInfo.js                                             *
 * --------------------------------------------------------------------- *
 * Title        :                                                        *
 * Revision     : V1.0                                                   *
 * Notes        :                                                        *
 * --------------------------------------------------------------------- *
 * Revision History:                                                     *
 *   When             Who         Revision       Description of change   *
 * -----------    -----------    ---------      ------------------------ *
 * 9-07-2016      charlie_weng     V1.0          Created the program     *
 *                                                                       *
\*************************************************************************/
'use strict';

var debug  = require('debug')('ledmq:devinfo');
var axon   = require('axon');
var rpc    = require('axon-rpc');
var req    = axon.socket('req');
var config = require('../../config.js');

var client = new rpc.Client(req);

///////////////////////////////////////////////////////////////////////////
var connect = function ( ip, port ) {
    req.connect( port,ip );  
}

///////////////////////////////////////////////////////////////////////////////
var serverClearInfo = function(nodeId,manager,callback )
{
    client.call('getAllDev', function(err, data){
        
        if( data.index.length > 0 )
        {
            for( var i = 0; i < data.index.length; i++ )
            {
                var session = manager.sessions.get(data.index[i]);
                if(session){
                    session.kick();
                }
                var obj = data.items[data.index[i]];
                
                if( obj&&obj.nodeid ){
                        
                    if( obj.nodeid === nodeId ){
                        debug( 'clear nodeid: %s keys: %s' ,nodeId,data.index[i] );
                        (function(i){
                            req.send({ cmd: 'delDevInfo',did:devStatsInfo.devid }, function(msg){
                               
                                if(i === data.index.length-1)
                                {            
                                    callback('ok');
                                }       
                            }); 
                        })(i); 
                    }
                }                           
            }
	    }
        else
        {
            callback('ok');
        }            
    });
}

///////////////////////////////////////////////////////////////////////////////
var getNodeId = function( did,callback ){
    
     client.call( 'getNodeId', did, function(err, nodeid){   
        if(nodeid )
            callback(nodeid);
        else
            callback(null);
        debug('getNodeId: %j', nodeid);
    });
}


var  getDevToken = function( callback )
{
    client.call( 'getDevToken', function(err, data){ 
        callback(data);
        debug('getDevToken: %j', data);
    });
}

///////////////////////////////////////////////////////////////////////////////
var putDevStatsInfo = function( status, devStatsInfo )
{
    if( status === 'online' )
    {
        client.call( 'putDevice', devStatsInfo.devid, devStatsInfo, function(err, msg){     
            debug( 'putDevice: %j', msg );
        });       
    }
    else
    {
        client.call( 'delDevice', devStatsInfo.devid, function(err, msg){     
            debug( 'delDevice:%s -> %j ',devStatsInfo.devid, msg );
        }); 
    }
}
////////////////////////////////////////////////////////////////////////////////
var getDevices = function( callback ){
    client.call( 'getAllDev', function(err, data){   
        callback(data); 
    });
}

//////////////////////////////////////////////////////////////////////////////// 
module.exports = {
    connect         : connect,
    serverClearInfo : serverClearInfo,
    putDevStatsInfo : putDevStatsInfo,
    getNodeId       : getNodeId,
    getDevToken     : getDevToken,
    getDevices      : getDevices
};                

