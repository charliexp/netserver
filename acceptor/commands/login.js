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
var comm     = require('../../lib/comm.js');
var tlv      = require('../../lib/tlv.js');
var mqtt     = require('mqtt');
var crypto   = require('crypto'); 
var cmdconst = require('../../const/const.js');
var nodeTtl  = require( "../../devdb/ttl.js" );
var logger   = require('../../lib/log.js');

/////////////////////////////////////////////////////////////////////////
const GET_RID_TAG  = 0x01;  // get random id tag
const DEV_INFO_TAG = 0x02;  // login info tag 
var   devLoginRid  = new nodeTtl();

/////////////////////////////////////////////////////////////////////////
function makeDevRid( id )
{ 
    var rid = comm.getrid();
    devLoginRid.push( id, rid, null, 30 );  // 30sec live
    debug( 'make rid: ',rid );
    return rid;
}   

/////////////////////////////////////////////////////////////////////////
function getDevRid( id )
{ 
    return devLoginRid.get( id );  
}   

/////////////////////////////////////////////////////////////////////////
function delDevRid( id )
{ 
    return devLoginRid.del( id ); 
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

//////////////////////////////////////////////////////////////////////////
var asncTokenAuth = function( manager, id, devtoken, did, gid, callback )
{
    if( (!devtoken) || (!did) ){ 
        callback(false);
        return;
    }
    ////////////////////////////////////
    manager.getDevAuthToken( gid, function(token){
        
        var rid = getDevRid(id);
        
        if( (!token)||(!rid) ){ 
            callback(false);
            return;
        }
        var token = comm.makeMD5encrypt( did +':'+ token + ':'+ rid );
        delDevRid(id);
        
        if( token === devtoken ){           
            callback(true);      //return true;
        }else{
            debug('token check error:[%s:%s] ',token,devtoken);
            callback(false);
        }
    }); 
 }

////////////////////////////////////////////////////////////////////////
var sendAckPacket = function( manager, session, msg, data )
{
    var obj  = {};
    
    obj.head = msg.head;
    obj.addr = msg.addr;
    obj.sno  = msg.sno;
    obj.type = msg.type & 0xBF;  //not ACK
    obj.cmd  = msg.cmd|0x80;    
    obj.data = data      
    var p    = manager.protocol.encode(obj);
    
    session.send(p);
} 

////////////////////////////////////////////////////////////////////////////
var loginProcess = function( msg, session, manager )
{
    var loginInfo  = {};
    var tlvArray   = tlv.parseAll( manager.protocol.getbody( msg.data ) );
    
    if( tlvArray.length !== 1 )  
        return;
  
    debug('login data: ',tlvArray[0].tag,tlvArray[0].value ); 
    
    if( tlvArray[0].tag === GET_RID_TAG )  
    {
        var data = new Buffer(2);
        data.writeUInt16LE( makeDevRid( session.id ) );
        var TLV     = tlv.TLV;
        var tlvInfo = new TLV( 0x01, data );
        var tlvData = tlvInfo.encode();    
        sendAckPacket( manager, session, msg, tlvData );  
            
        return true;  
    }        
    else if( (tlvArray[0].tag === DEV_INFO_TAG) && tlvArray[0].value )
    {
        loginInfo = string2Object( tlvArray[0].value );
    }
    else
    {
        session.kick();
        logger.error('invalid login packet,device id: %s,ip: %s',session.deviceid,session.id );
        return false;   
    } 
   
    if( loginInfo && loginInfo.token && loginInfo.did  )
    {
        var gid = loginInfo.gid ? comm.prefixInteger( loginInfo.gid, 4 ) : '0000';
         
        asncTokenAuth( manager, session.id, loginInfo.token, loginInfo.did, gid, function( data ){
            
            if( data ){             
                 manager.registerSession( session, loginInfo, function(retval){
                    
                    logger.trace('login device id: %s,ip: %s',session.deviceid,session.id );                    
                    var status = retval ? (new Buffer([0x00])):(new Buffer([0x01])); 
                    sendAckPacket( manager, session, msg, status );
                    comm.sendTimingPacket( manager, session, 0, cmdconst.SET, false );
                }); 
            }else{
                session.kick();
                logger.error('invalid login token,device id: %s,ip: %s',session.deviceid,session.id );
            }
        });
        return true;        
    }
    else
    {
        session.kick();
        logger.error('invalid login data,device id: %s,ip: %s',session.deviceid,session.id );
        return false;   
    }
}

////////////////////////////////////////////////////////////////////
exports.callback = loginProcess;
