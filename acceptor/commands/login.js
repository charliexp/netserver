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

var devTokenMap = {};
var commToken   = '0123456789';

/////////////////////////////////////////////////////////////////////////
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

////////////////////////////////////////////////////////////////////
var loginProcess = function( msg, session, manager )
{
    var loginInfo  = {};
    var isPass     = false;
	var oldsession = null;
    
    if( msg&&msg.data ){
        loginInfo   = string2Object( msg.data );
    }
    else{
        session.kick();
        return {ret:'fail'};  
    }        
    if( loginInfo && loginInfo.token )
    {
        var token = new Buffer(loginInfo.token, 'base64').toString();
        var str   = xxtea.decrypt(token,'4567');
        var token = str.split(':');
         
        if( !token[0]||(!loginInfo.did) )
        {
            return {ret:'fail'};
        }
        var tokenstr = devTokenMap[loginInfo.did]; 
        if( tokenstr ){
            if( token[0] === tokenstr ){
                isPass = true;
            }else{
                debug('token check error ');
				return {ret:'fail'};
            }
        }
        else if( token[0] === config.commToken ){
            isPass = true;
        }else{
            debug('token check error ');
            return {ret:'fail'};
        }    
        if( isPass !== true ) return {ret:'fail'};
        
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
