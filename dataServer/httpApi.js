/*************************************************************************\
 * File Name    : httpapi.js                                                *
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
var express   = require('express');
var config    = require('./config.js');
var fb        = require('./func.js');
var sync      = require('simplesync');
var zlib      = require('zlib');


///////////////////////////////////////////////////////////////////////////
module.exports = (function () {
    'use strict';
    var router = express.Router({ mergeParams: true });
    
    router.route('/db/:name').post(function (req, res, next) { 
	    console.log('/db/:name' );
        
        var info = req.body;

		if( (!info)||(!info.user)||(!info.token)||(!info.ts) )
		{
			res.json({err: 'error user' });
			return;
		}	
        if( info.user !== config.httpuser )
        {
            res.json({err: 'user error' });
            return;
        } 
        if( info.token === fb.check_token(config.httppwd,info.ts) )
        {
            console.log('auth ok' );
            var result;          
            sync.block( function(){
                //result = sync.wait( execQuery( info.qrytype, info.sql, info.params, sync.cb("rel") ) );
                result = sync.wait( xxxxx( '', sync.cb("rel") ) );
                var acceptEncoding = req.headers['accept-encoding'];
                if( acceptEncoding && acceptEncoding.indexOf('gzip') != -1 ){
                    var buf = new Buffer(result.rel); 
                    res.setHeader("content-encoding", "gzip");  // 设置返回头content-encoding为gzip
                    zlib.gzip( buf, function(err,zipdata){    
                        res.end( zipdata );
                    }); 
                }
                else
                {
                    res.end( result.rel );
                } 
            });
        }   
	})
    return router;
})();
