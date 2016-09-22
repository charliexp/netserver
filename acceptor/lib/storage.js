'use strict';
/*************************************************************************\
 * File Name    : login.js                                               *
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
/*************************************************************************\
 *                                                                       *
 *                  Function name   : httpGet                            *
 *                                                                       * 
\*************************************************************************/
ssdb_connect = function ( ip, port, callback ) {
    
    var ssdb  = SSDB.connect( ip, port, function(err){
        if(err){
            debug('ssdb state : ' + err);
            callback({ret:'err'});
            return;
        }
        debug('ssdb is connected [storage]');
        callback( { ret:'ok',db:ssdb } ); 
    }); 
}

var startServerClearInfo = function( nodeId )
{
    sync.block(function() {
        var result = sync.wait( ssdb_connect( config.ssdb.ip, config.ssdb.port, sync.cb("rel") ) );
        if( result.rel.ret === 'ok' )
        {
            var ssdb = result.rel.db; 
            var next = sync.wait( serverClearInfo( nodeId, ssdb, sync.cb("rel") ) );      
        }
    }    
}
/////////////////////////////////////////////////////////////////////////
var serverClearInfo = function(nodeId,ssdb,callback )
{
    var nodeTable = 'serverInfo:'+nodeId;
    var startkey  = '0000000000';
	var endkey    = 'ZZZZZZZZZZ'; 
      
    ssdb.hscan( nodeTable, startkey, endkey,1000 ,function(err,data){
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
                    })
                })(i); 
            }
		}
        ssdb.hclear( nodeTable, function(err){
            if(err){
                return;
            }          
        }); 
    }); 
}

/////////////////////////////////////////////////////////////////////////
var startServerClear = function(nodeId)
{
    var ssdb  = SSDB.connect(config.ssdb.ip, config.ssdb.port, function(err){
    if(err){
        debug('ssdb state : ' + err);
        return;
    }
    debug('ssdb is connected [storage]');

    var nodeTable = 'serverInfo:'+nodeId;
    var startkey  = '0000000000';
	var endkey    = 'ZZZZZZZZZZ'; 
      
    ssdb.hscan( nodeTable, startkey, endkey,1000 ,function(err,data){
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
                    })
                })(i); 
            }
		}
        ssdb.hclear( nodeTable, function(err){
            if(err){
                return;
            }    
        }); 
    });  
    });
}

exports.startServerClear = startServerClear;