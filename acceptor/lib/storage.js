'use strict';
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

var debug    = require('debug')('ledmq:storage');
var SSDB     = require('./ssdb.js');
var config   = require('../../config.js');
var sync     = require('simplesync');


///////////////////////////////////////////////////////////////////////////
var connect = function ( ip, port ) {
    
    var ssdb  = SSDB.connect( ip, port, function(err){
        if(err){
            debug('ssdb state : ' + err);
            return;
        }
        debug('ssdb is connected [storage] at: ',new Date());
    });
    return ssdb;    
}
/*************************************************************************\
 *                                                                       *
 *                  Function name   : httpGet                            *
 *                                                                       * 
\*************************************************************************/
var ssdb_connect = function ( ip, port, callback ) {
    
    var ssdb  = SSDB.connect( ip, port, function(err){
        if(err){
            debug('ssdb state : ' + err);
            callback({ret:'err'});
            return;
        }
        debug('ssdb is connected [storage] at: ',new Date());
        callback( { ret:'ok',db:ssdb } ); 
    }); 
}

var startServerClear = function( nodeId,manager )
{
    sync.block(function() {
        var result = sync.wait( ssdb_connect( config.ssdb.ip, config.ssdb.port, sync.cb("rel") ) );
        if( result.rel.ret === 'ok' )
        {
            var ssdb = result.rel.db; 
            var next = sync.wait( serverClearInfo( nodeId, ssdb, manager, sync.cb("rel") ) );  
            debug('ssdb is disconnected [storage] at: ',new Date());
            ssdb.close();         
        }
    });    
}
/////////////////////////////////////////////////////////////////////////
var serverClearInfo = function(nodeId,ssdb,manager,callback )
{
    var nodeTable = 'serverInfo:'+nodeId;
    var startkey  = '0000000000';
	var endkey    = 'ZZZZZZZZZZ'; 
      
    ssdb.hscan( nodeTable, startkey, endkey,100000 ,function(err,data){
        if(err){
            return;
        }
        debug(' %s keys: %s ' ,nodeId,data.index);
        if( data.index.length > 0 )
        {
            for( var i = 0; i < data.index.length; i++ )
            {
                var session = manager.sessions.get(data.index[i]);
                if(session){
                    session.kick();
                }
                
                (function(i){
                    ssdb.hdel( config.onlineTab, data.index[i], function(err){ 
                        if(err){return;}
                        if(i === data.index.length-1)
			            {            
        			        ssdb.hclear( nodeTable, function(err){
            				    if(err){
                				    return;
            				    }   	
					            callback('ok');
				            });
			            }
		            });	 
                })(i); 
            }
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
    var nodeTable = 'serverInfo:'+nodeid;
    if( status === 'online' )
    {
        ssdb.hset( config.onlineTab, devStatsInfo.devid, JSON.stringify(devStatsInfo), callback );
        ssdb.hset( nodeTable, devStatsInfo.devid, devStatsInfo.ts, callback );
        debug( 'device %s add to ssdb ',devStatsInfo.devid );        
    }
    else
    {
        ssdb.hdel( config.onlineTab, devStatsInfo.devid, callback );
        ssdb.hdel( nodeTable, devStatsInfo.devid, callback );
        debug( 'del device %s to ssdb ',devStatsInfo.devid ); 
    }
}

exports.connect          = connect;
exports.startServerClear = startServerClear;
exports.putDevStatsInfo  = putDevStatsInfo;
