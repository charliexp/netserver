/*************************************************************************\
 * File Name    : httpapi.js                                             *
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
var express = require('express');
var config  = require('../etc/httpconfig.js');
var zlib    = require('zlib');
var axon    = require('axon');
var axonrpc = require('axon-rpc');
var req     = axon.socket('req');
var debug   = require('debug')('ledmq:http');

var client  = new axonrpc.Client(req);

///////////////////////////////////////////////////////////////////////////
req.connect( config.devicerpc.port,config.devicerpc.ip );  

///////////////////////////////////////////////////////////////////////////
var getDevicesOnlineList = function( callback )
{
    var devList = [];
    client.call('getAllDev', function(err, data){
        
        if( data.index.length > 0 )
        {
            for( var i = 0; i < data.index.length; i++ )
            {
                var obj = data.items[data.index[i]];
                
                if( obj && (obj.stauts === 'online') )
                {
                    devList.push( obj ); 
                }                           
            }
            callback(devList);
	    }
        else
        {
            callback(null);
        }            
    });
}

///////////////////////////////////////////////////////////////////////////
module.exports = (function () {
    'use strict';
    var router = express.Router({ mergeParams: true });
    
    router.route('/get').get(function (req, res, next) { 
	    debug('/devices/get' );

        getDevicesOnlineList( function(devids){  
            
            var acceptEncoding = req.headers['accept-encoding'];
            if( acceptEncoding && acceptEncoding.indexOf('gzip') != -1 ){
          
                var buf = new Buffer(JSON.stringify(devids)); 
                res.setHeader("content-encoding", "gzip");  // 设置返回头content-encoding为gzip
                zlib.gzip( buf, function(err,zipdata){                 
                    res.end( zipdata );
                }); 
            }
            else
            {
                res.end( JSON.stringify(devids) );
            } 
        });    
    });
    return router;
})();
