'use strict';
/*************************************************************************\
 * File Name    : req.js                                                 *
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

var debug    = require('debug')('ledmq:req');
var protocol = require('../src/protocol.js');
var config   = require('../../config.js');
var db       = require('../../dispatch/centdb.js');

//////////////////////////////////////////////////////////////////////////
var reqDataParse = function( data )
{
    if( !data || (data.length < 11) ) return null;
    
    var resourceId  = data.slice( 0, 8 ).toString();
    var pktId       = data.readUInt16LE(8);
    var pktCnt      = data.readUInt8(10);
    
    if( (pktCnt > 10)||( pktId >= 0xF000 ) ) 
        return null;
    else
        return { 
            rid  : resourceId,
            spid : pktId,
            pcnt : pktCnt
        };
}
//////////////////////////////////////////////////////////////////////////
var sendResPacket = function( session, msg, data )
{
    var obj  = {};
    
    obj.head = msg.head;
    obj.addr = msg.addr;
    obj.sno  = msg.sno;
    obj.type = msg.type;
    obj.cmd  = msg.cmd|0x80;    
    obj.data = data      
    var p    = protocol.encode(obj);
    
    session.send(p);
} 

//////////////////////////////////////////////////////////////////////////
var reqProcess = function( msg, session, manager )
{
    var p   = reqDataParse( msg.data );

    if( !p ) 
        return false;
    
    for( var i =0; i< p.pcnt; i++ )
    {
        db.getdata( p.rid, spid + i, function(err,data){
            
            if(err)  return;
            if(data){
                sendResPacket( session, msg, data );
            } 
        });
    }
    return true;
}

//////////////////////////////////////////////////////////////////////////
exports.callback = reqProcess;
