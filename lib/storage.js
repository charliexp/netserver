/*************************************************************************\
 * File Name    : storage.js                                             *
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
var debug    = require('debug')('ledmq:storage');
var SSDB     = require('./ssdb.js');
var config   = require('../etc/appconfig.js');


///////////////////////////////////////////////////////////////////////////
var connect = function ( ip, port ) {
    
    var ssdb  = SSDB.connect( ip, port, function(err){
        if(err){
            debug( 'ssdb state : ' + err );
            return;
        }
        debug( 'ssdb is connected [storage] at: ',new Date() );
    });
    return ssdb;    
}

///////////////////////////////////////////////////////////////////////////////
var serverClearInfo = function(nodeId,ssdb,manager,callback )
{
    var startkey  = '0000000000';
	var endkey    = 'ZZZZZZZZZZ'; 
      
    ssdb.hscan( config.onlineTab, startkey, endkey,1000000 ,function(err,data){
        if(err){
            callback('err');
            return;
        }
        if( data.index.length > 0 )
        {
            for( var i = 0; i < data.index.length; i++ )
            {
                var session = manager.sessions.get(data.index[i]);
                if(session){
                    session.kick();
                }
           
                try{
                    var obj = JSON.parse( data.items[data.index[i]] );
                }catch(e){
                    console.log( 'json parse error'+e );
                    return;
                }
                if( obj&&obj.nodeid ){
                        
                    if( obj.nodeid === nodeId ){
                        debug( 'clear nodeid: %s keys: %s' ,nodeId,data.index[i] );
                        (function(i){
                            ssdb.hdel( config.onlineTab, data.index[i], function(err){ 
                            
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
var getServerId = function( ssdb,did,callback )
{
    ssdb.hget( config.onlineTab, did ,function(err,data){
        if(err){
            callback(null); 
            return;
        }
        if( data )
        {
            try{
                var obj = JSON.parse(data);
            }catch(e)
            {
                console.log( 'json parse error'+e );
                callback(null);
                return;
            }
            if( obj&&obj.nodeid )
                callback(obj.nodeid);       
	    }
        callback(null);        
    }); 
}

var  getDevToken = function( ssdb,callback )
{
    var token = {};
    
    ssdb.hscan( config.devTokenTab, "","",10000, function(err,data){
        
        if(err){
            callback(null); 
            return;
        }
        if( data.index.length > 0 )
        {
            callback( data );
        }
        else
        {
            callback(null);        
        }
    }); 
}

///////////////////////////////////////////////////////////////////////////////
var callback = function(err)
{
    if(err){
        debug( 'ssdb ops fail' );
    }
}
///////////////////////////////////////////////////////////////////////////////
var putDevStatsInfo = function( ssdb, nodeid, status, devStatsInfo )
{
    if( status === 'online' )
    {
        ssdb.hset( config.onlineTab, devStatsInfo.devid, JSON.stringify(devStatsInfo), callback );
        debug( 'device %s add to ssdb ',devStatsInfo.devid );        
    }
    else
    {
        ssdb.hdel( config.onlineTab, devStatsInfo.devid, callback );
        debug( 'del device %s to ssdb ',devStatsInfo.devid ); 
    }
}
                            
exports.connect          = connect;
exports.serverClearInfo  = serverClearInfo;
exports.putDevStatsInfo  = putDevStatsInfo;
exports.getServerId      = getServerId;
exports.getDevToken      = getDevToken;
