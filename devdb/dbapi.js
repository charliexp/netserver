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

var debug   = require('debug')('ledmq:devdbapi');
var token   = require('./tokenconf.js');
var nodeTtl = require( "./ttl.js" );
var comm    = require('../acceptor/src/comm.js');


///////////////////////////////////////////////////////////////////////////
var devStats = {};
var devToken = {};
var nodeInfoMap = new nodeTtl();
var devLoginMap = new nodeTtl();

var initToken = function()
{
    for( var i = 0; i< token.length; i++ ){
        devToken[token[i].gid] = token[i].token;
    }
    console.log('init token db ok! list is: ');
    console.log(devToken);
}

initToken();

///////////////////////////////////////////////////////////////////////////
var makeDeviceRid = function( id,fn )
{
    var rid = comm.getrid();
    devLoginMap.push( id, rid, null, 30 );  // 30sec live
    fn( null, rid );
}

var getDevAuthToken = function( id, did, gid, fn )
{
    var rid  = devLoginMap.get( id );
    var data = devToken[gid];
    // debug('OKOKOKOK',rid,data,did);
    if( rid && data && did )
    {
        var token = comm.makeMD5encrypt( did +':'+ data + ':'+ rid );
      //  debug('~~~~~~~~~~~~~~~~~',token);
        fn( null, token );
    }
    else
    {
        fn( null, null );
    }  
}

///////////////////////////////////////////////////////////////////////////
var pushNodeInfo = function(nodeid,data,fn )
{
    nodeInfoMap.push( nodeid, {name: nodid,data:data}, null, 10 );
    fn(null,'ok');
}

var delNodeInfo = function(nodeid,fn )
{
    nodeInfoMap.del( nodeid );
    fn(null,'ok');
}

var getNodeInfo = function(nodeid,fn )
{
    var data = nodeInfoMap.get( nodeid );
    fn(null,data);
}

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
		data.items[p] = devToken[p];
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

///////////////////////////////////////////////////////////////////////////
var nodeRegister = function( nodeid, nodeInfo, fn ){ 
   //nodeInfoMap[ nodeid ] = nodeInfo;
    pushNodeInfo( nodeid, nodeInfo );
    fn( null, 'ok' );
}

///////////////////////////////////////////////////////////////////////////
var getNodeInfo = function( nodeid, fn ){ 
    
    fn( null, getNodeInfo( nodeid ));
}

///////////////////////////////////////////////////////////////////////////
var getAllNodeid = function( fn ){ 
    
    var nodeids = [];
    nodeInfoMap.forEach( function(data,key){
            nodeids.push(key);
        },
        function(){
           fn( null, nodeids );
    });
}

/////////////////////////////////////////////////////////////////////////////
module.exports = {
    getNodeId      : getNodeId,
    putDevice      : putDevice,
    delDevice      : delDevice,
    getAllDevToken : getAllDevToken,
    getDevtoken    : getDevtoken,
    setDevToken    : setDevToken,
    getAllDev      : getAllDev,
    nodeRegister   : nodeRegister,
    getNodeInfo    : getNodeInfo,
    getAllNodeid   : getAllNodeid,
    makeDeviceRid  : makeDeviceRid,
    getDevAuthToken: getDevAuthToken
}
