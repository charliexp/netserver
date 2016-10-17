/*************************************************************************\
 * File Name    : dbApi.js                                               *
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

var debug  = require('debug')('ledmq:devdbapi');
var token  = require('./tokenconf.js');

///////////////////////////////////////////////////////////////////////////
var devStats = {};
var devToken = {};

///////////////////////////////////////////////////////////////////////////
var getNodeId = function( did, fn ){ 
       
    if( devStats[ did ] ){   
        var nodeid = devStats[ did ].nodeid; 
        fn( null, nodeid );        
    }
    else{
        fn( null, null );
    } 
}

///////////////////////////////////////////////////////////////////////////
var putDevice = function( did, devInfo, fn ){ 
    devStats[ did ] = devInfo;
    fn( null, 'ok' );
}

///////////////////////////////////////////////////////////////////////////
var delDevice = function( did, fn ){ 
    delete  devStats[ did ];
    fn( null, 'ok' );
}

///////////////////////////////////////////////////////////////////////////
var getAllDevToken = function( fn ){ 
    var data = {index: [], items: {}};
    for( var p in devToken ){
		data.index.push(p);
		data.items[i] = devToken[p];
	}
    fn( null, data );
}

var getDevtoken = function( gid, fn ){ 
    fn( null, devToken[gid] );
}

////////////////////////////////////////////////////////////////////////////
var setDevToken = function( gid, token, fn ){ 
          
    debug('set Device token',gid,token);
    if( gid && token ){ 
        devToken[ gid ] = token;
        fn( null, 'ok' );
    }
    else
    {
        fn( 'err', null );
    }
}

/////////////////////////////////////////////////////////////////////////////
var getAllDev = function( fn ){ 
    var data = {index: [], items: {}};
    for( var p in devStats ){
        data.index.push(p);
		data.items[p] = devStats[p];
    }
    fn( null, data );
}

/////////////////////////////////////////////////////////////////////////////
module.exports = {
    getNodeId      : getNodeId,
    putDevice      : putDevice,
    delDevice      : delDevice,
    getAllDevToken : getAllDevToken,
    getDevtoken    : getDevtoken,
    setDevToken    : setDevToken,
    getAllDev      : getAllDev
}
