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

var startServerClear = function( nodeId )
{
    sync.block(function() {
        var result = sync.wait( ssdb_connect( config.ssdb.ip, config.ssdb.port, sync.cb("rel") ) );
        if( result.rel.ret === 'ok' )
        {
            var ssdb = result.rel.db; 
            var next = sync.wait( serverClearInfo( nodeId, ssdb, sync.cb("rel") ) );  
            debug('ssdb is disconnected [storage] at: ',new Date());
            ssdb.close();         
        }
    });    
}
/////////////////////////////////////////////////////////////////////////
var serverClearInfo = function(nodeId,ssdb,callback )
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
var putDevStatsInfo = function( ssdb, nodeid, status, devStatsInfo )
{
    var nodeTable = 'serverInfo:'+nodeid;
    if( status === 'online' )
    {
        ssdb.hset( config.onlineTab,devStatsInfo.devid,JSON.stringify(devStatsInfo), function(err){
            if(err)
            {
                debug( 'add ssdb fail' );
                return;
            }
            debug( devStatsInfo.devid,'device add to ssdb ' );
        });
        ssdb.hset( nodeTable, devStatsInfo.devid,devStatsInfo.ts, function(err){ if(err){return;} });               
    }
    else
    {
        ssdb.hdel(config.onlineTab, devStatsInfo.devid, function(err){
            if(err)
            {
                debug( 'del ssdb fail' );
                return;
            }
            debug( devStatsInfo.devid,'del to ssdb ' );     
        });
        ssdb.hdel( nodeTable, devStatsInfo.devid, function(err){ if(err){ return; } });
    }
}

exports.connect          = connect;
exports.startServerClear = startServerClear;
exports.putDevStatsInfo  = putDevStatsInfo;
