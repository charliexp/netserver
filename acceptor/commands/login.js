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
'use strict';
var debug    = require('debug')('ledmq:login');
var xxtea    = require('../lib/xxtea.js');
var protocol = require('../src/protocol.js');
var SSDB     = require('../lib/ssdb.js');
var config   = require('../../config.js');
var sync     = require('simplesync');
var mqtt     = require('mqtt');

///////////////////////////////////////////////////////////////////////////
var devTokenMap = {};
var commToken   = '0123456789';

///////////////////////////////////////////////////////////////////////////
function string2Object( data )
{
    var array = data.toString().split(',');
    var obj   = {};
    var kv    = [];
    
    for( var i = 0; i < array.length; i++ )
    {
        kv         = array[i].split(':');
        obj[kv[0]] = kv[1];
    }
    return obj;
}
//////////////////////////////////////////////////////////////////////////
var sysTokenAuth = function( basetoken,did )
{
    var token = new Buffer( basetoken, 'base64').toString();
    var str   = xxtea.decrypt(token,'4567');
    var token = str.split(':');
         
    if( !token[0] ){
        return 0;
    }
    var tokenstr = devTokenMap[did]; 
    if( tokenstr ){
        if( token[0] === tokenstr ){
            return 1;
        }else{
            debug('token check error ');
            return 0;
        }
    }
    else if( token[0] === config.commToken ){
        return 1;
    }else{
        debug('token check error ');
        return 0;
    }    
 }
////////////////////////////////////////////////////////////////////////
var loginProcess = function( msg, session, manager )
{
    var loginInfo  = {};
    
    if( msg&&msg.data ){
        loginInfo   = string2Object( msg.data );
    }
    else{
        session.kick();
        return {ret:'fail'};  
    }        
    if( loginInfo && loginInfo.token && loginInfo.did )
    {
        if( sysTokenAuth( loginInfo.token,loginInfo.did ) === 0 )
        {
            session.kick();
            return {ret:'fail'};  
        }   
        manager.getNodeId( loginInfo.did, function(nodeId){
            
            if( nodeId ){   
                manager.kick( nodeId,loginInfo.did );
            }
            
            var ret = session.add( manager.serverId, loginInfo );
        
            var obj  = {};
            obj.head = msg.head;
            obj.addr = msg.addr;
            obj.sno  = msg.sno;
            obj.type = msg.type;
            obj.cmd  = msg.cmd|0x80;
    
            if(ret.stats === 'ok')
                obj.data = new Buffer([0x00]);
            else
                obj.data = new Buffer([0x01]); 
        
            var p = protocol.encode(obj);
            session.send(p);
        });
        return {ret:'pass'};        
    }
    else
    {
        session.kick();
        return {ret:'fail'};   
    }
}

exports.callback = loginProcess;
