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
var debug   = require('debug')('ledmq:http');
var rpcApi  = require('../devdb/rpcapi.js');

rpcApi.connect( config.devicerpc.ip, config.devicerpc.port );

///////////////////////////////////////////////////////////////////////////
module.exports = (function () {
    'use strict';
    var router = express.Router({ mergeParams: true });
    
    router.route('/devices').get(function (req, res, next) { 
	    debug('/ledmq/devices' );

        rpcApi.getOnlineIds( function(devids){  
            
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
    router.route('/nodes').get(function (req, res, next) { 
	    debug('/ledmq/nodes' );

        rpcApi.getAllServer( function(err,nodes){  
            
            var acceptEncoding = req.headers['accept-encoding'];
            if( acceptEncoding && acceptEncoding.indexOf('gzip') != -1 ){
          
                var buf = new Buffer(JSON.stringify(nodes)); 
                res.setHeader("content-encoding", "gzip");  // 设置返回头content-encoding为gzip
                zlib.gzip( buf, function(err,zipdata){                 
                    res.end( zipdata );
                }); 
            }
            else
            {
                res.end( JSON.stringify(nodes) );
            } 
        });    
    });
 
    return router;
})();
