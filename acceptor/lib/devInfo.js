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
var req    = axon.socket('req');
var config = require('../../config.js');

///////////////////////////////////////////////////////////////////////////
var connect = function ( ip, port ) {
    req.connect( port,ip );  
}

///////////////////////////////////////////////////////////////////////////////
var serverClearInfo = function(nodeId,manager,callback )
{
    req.send({ cmd: 'getAllDev' }, function(data){
        
        if( data.index.length > 0 )
        {
            for( var i = 0; i < data.index.length; i++ )
            {
                var session = manager.sessions.get(data.index[i]);
                if(session){
                    session.kick();
                }
           
                //try{
                //    var obj = JSON.parse( data.items[data.index[i]] );
                //}catch(e){
                //    console.log( 'json parse error'+e );
                //    return;
                //}
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
    
    req.send({ cmd: 'getNodeId',did:did }, function(msg){
        if(msg && msg.nodeid != '' )
            callback(msg.nodeid);
        else
            callback(null);
        debug('getNodeId: %j', msg.nodeid);
    });
}


var  getDevToken = function( callback )
{
    req.send({ cmd: 'getDevToken'}, function(msg){
        callback(msg);
        debug('getDevToken: %j', msg);
    });
}

///////////////////////////////////////////////////////////////////////////////
var putDevStatsInfo = function( status, devStatsInfo )
{
    if( status === 'online' )
    {
        req.send({ cmd: 'putDevice',did:devStatsInfo.devid,data:devStatsInfo }, function(msg){
            debug('putDevice: %j', msg);
        });       
    }
    else
    {
        req.send({ cmd: 'delDevice',did:devStatsInfo.devid }, function(msg){
            debug('delDevice: %j', msg);
        }); 
    }
}
                            
exports.connect          = connect;
exports.serverClearInfo  = serverClearInfo;
exports.putDevStatsInfo  = putDevStatsInfo;
exports.getNodeId        = getNodeId;
exports.getDevToken      = getDevToken;
