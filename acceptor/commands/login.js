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
var protocol = require('../src/protocol.js');
var SSDB     = require('../lib/ssdb.js');
var config   = require('../../config.js');
var sync     = require('simplesync');
var mqtt     = require('mqtt');
var crypto   = require('crypto'); 

//////////////////////////////////////////////////////////////////////////
var makeMD5encrypt = function( str )
{				
    var md5     = crypto.createHash('md5');
    var string  = md5.update(str).digest('hex');
   // debug('md5-> %s : %s', str, string );
    return string;
}

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

/////////////////////////////////////////////////////////////////////////
var sysTokenAuth = function( manager,devtoken,rid,gid )
{
    if((! devtoken) || (!rid)) return false;
    
    var servertoken = manager.token[gid]; 
    if( !servertoken ) 
        return false;
    var token = makeMD5encrypt( servertoken + ':'+ rid )    

    if( token === devtoken ){
        return true;
    }else{
        debug('token check error ');
        return false;
    }
 } 
////////////////////////////////////////////////////////////////////////
var sendAckPacket = function( session, msg, state )
{
    var obj  = {};
    
    obj.head = msg.head;
    obj.addr = msg.addr;
    obj.sno  = msg.sno;
    obj.type = msg.type;
    obj.cmd  = msg.cmd|0x80;    
    obj.data = state ? (new Buffer([0x00])):(new Buffer([0x01]));      
    var p    = protocol.encode(obj);
    
    session.send(p);
} 
////////////////////////////////////////////////////////////////////////
var loginProcess = function( msg, session, manager )
{
    var loginInfo  = {};
    
    if( msg && msg.data ){
        loginInfo   = string2Object( msg.data );
    }
    else{
        session.kick();
        return false;   
    }        
    if( loginInfo && loginInfo.token && loginInfo.did,loginInfo.rid )
    {
        var gid = loginInfo.gid ? loginInfo.gid:'0000';
     
        if( !sysTokenAuth( manager, loginInfo.token,loginInfo.rid, gid ) )
        {
            session.kick();
            return false;  
        }   
        manager.register( session, loginInfo, function(retval){
            
            sendAckPacket( session, msg, retval );
        });
        return true;        
    }
    else
    {
        session.kick();
        return false;   
    }
}

////////////////////////////////////////////////////////////////////
exports.callback = loginProcess;
