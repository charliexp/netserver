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
var tlv      = require('../lib/tlv.js');
var mqtt     = require('mqtt');
var crypto   = require('crypto'); 
var cmdconst = require('../src/const/const.js');

const GET_RID_TAG  = 0x01;
const DEV_INFO_TAG = 0x02;


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
    if( !devtoken ) callback(false);
    debug('rpc----------------> ',id,devtoken,did,gid);
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
var sendAckPacket = function( session, msg, data )
{
    var obj  = {};
    
    obj.head = msg.head;
    obj.addr = msg.addr;
    obj.sno  = msg.sno;
    obj.type = msg.type & 0xBF;  //not ACK
    obj.cmd  = msg.cmd|0x80;    
    obj.data = data      
    var p    = protocol.encode(obj);
    
    session.send(p);
} 

////////////////////////////////////////////////////////////////////////////
var loginProcess = function( msg, session, manager )
{
    var loginInfo  = {};
    var tlvArray   = tlv.parseAll( protocol.getbody( msg.data ) );
    
    if( tlvArray.length !== 1 )  
        return;
  
    debug('login data: ',tlvArray[0].tag,tlvArray[0].value ); 
    
    if( tlvArray[0].tag === GET_RID_TAG )  
    {
        debug('login get rid' );
        manager.makeDeviceRid( session.id, function(rid){
            debug('get rid-> %s ', rid);
            
            var data = new Buffer(2);
            data.writeUInt16LE(rid);
            var TLV     = tlv.TLV;
            var tlvInfo = new TLV( 0x01, data );
            var tlvData = tlvInfo.encode();
            
            sendAckPacket( session, msg, tlvData );  
        });

        return true;  
    }        
    else if( (tlvArray[0].tag === DEV_INFO_TAG) && tlvArray[0].value )
    {
        loginInfo = string2Object( tlvArray[0].value );
    }
    else
    {
        session.kick();
        return false;   
    } 
   
    if( loginInfo && loginInfo.token && loginInfo.did  )
    {
        var gid = loginInfo.gid ? comm.prefixInteger(loginInfo.gid,4) : '0000';
         
        asncTokenAuth( manager, session.id, loginInfo.token,loginInfo.did, gid, function(data){
            if(data){
                 manager.registerSession( session, loginInfo, function(retval){
                     
                    var status = retval ? (new Buffer([0x00])):(new Buffer([0x01])); 
                    sendAckPacket( session, msg, status );
                    comm.sendTimingPacket( session, 0, cmdconst.SET, false );
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
