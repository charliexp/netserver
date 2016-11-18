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
var comm     = require('../src/comm.js');
var mqtt     = require('mqtt');
var crypto   = require('crypto'); 


//////////////////////////////////////////////////////////////////////////
var makeMD5encrypt = function( str )
{				
    var md5     = crypto.createHash('md5');
    var string  = md5.update(str).digest('hex');
    debug('md5-> %s : %s', str, string );
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
        kv = array[i].split(':');
        if( kv.length >= 2 ){
            obj[ comm.trim( kv[0] ) ] = comm.trim( kv[1] );
        }
    }
    return obj;
}

 /////////////////////////////////////////////////////////////////////////
var asncTokenAuth = function( manager, id, devtoken, did, gid, callback )
{
    if( ! devtoken ) callback(false);
  
    manager.getDevAuthToken( id, did, gid, function(token){
   
        if( !token ) 
            callback(false);
        
        if( token === devtoken ){
            callback(true); //return true;
        }else{
            debug('token check error:[%s:%s] ',token,devtoken);
            callback(false);
        }
    }); 
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

////////////////////////////////////////////////////////////////////////////
var loginProcess = function( msg, session, manager )
{
    var loginInfo  = {};
    var loginData = protocol.getbody(msg.data);

    if( msg && loginData ){
        loginInfo = string2Object( loginData );
    }
    else{
        session.kick();
        return false;   
    } 
    if( loginInfo.get )
    {
        debug('loginInfo.get: %s ', loginInfo.get);
        manager.makeDeviceRid( session.id, function(rid){
            debug('get rid-> %s ', rid);
            var obj  = {};
    
            obj.head = msg.head;
            obj.addr = msg.addr;
            obj.sno  = msg.sno;
            obj.type = msg.type;
            obj.cmd  = msg.cmd|0x80;
            var data = new Buffer(2);
            data.writeUInt16LE(rid);
            obj.data = data;     
            var p    = protocol.encode(obj);
    
            session.send(p);
        });

        return true;  
    }        
    else if( loginInfo && loginInfo.token && loginInfo.did  )
    {
        debug('login Packet:', loginInfo);
        var gid = loginInfo.gid ? comm.prefixInteger(loginInfo.gid,4) : '0000';

        asncTokenAuth( manager, session.id, loginInfo.token,loginInfo.did, gid, function(data){
            if(data){
                 manager.registerSession( session, loginInfo, function(retval){
                    sendAckPacket( session, msg, retval );
                    comm.sendTimingPacket( session, 0, false );
                }); 
            }else{
                session.kick();
            }
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
