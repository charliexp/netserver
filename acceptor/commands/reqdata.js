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
var Cache    = require('../../dispatch/cache.js');

var options ={
    ttl:      60,     // TTL 1 min.
    interval: 600,   // Clean 10 min.
    cnts:     1      // repeat cnts
};

var cache = new Cache(options);

//////////////////////////////////////////////////////////////////////////
var parseResourceData = function( resData )
{
    if( resData.value.length < 26) return null;
    
    var serverType = resData.value.readUInt8(0);
    var taskId     = resData.value.readUInt16LE(1);
    var resourceId = resData.value.slice( 3, 23 ).toString('hex');
    var pktId      = resData.value.readUInt16LE(23);
    var pktCnt     = resData.value.readUInt8(25);
            
    debug('resourceId:%s,packetId:%d,packetCnt:%d', resourceId, pktId, pktCnt);
  //console.log('resourceId:%s,packetId:%d,packetCnt:%d', resourceId, pktId, pktCnt);
    
    if( (pktCnt > 10)||( pktId >= 0xF000 ) ) //一次请求大于10包的判为非法
        return null;
    else
    {
        return { 
            rid  : resourceId,    // resource Id
            spid : pktId,         // start packet id   
            pcnt : pktCnt         // req total packets      
        };
    }
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
var sendResData = function( session, msg, p ){
    
    debug('resource md5: ',p.rid );
        
    for( var i = 0; i< p.pcnt; i++ )
    {
        db.getdata( p.rid, p.spid + i, function(err,data){
            
            if( err||(!data) ){
                sendResPacket( session, msg, new Buffer([0x07]) );  //节目不存在  
                return;  
            }  
            sendResPacket( session, msg, data );
        });
    }
}       
//////////////////////////////////////////////////////////////////////////
var reqdataProcess = function( p, msg, session )
{
    if( (!p)||(!session)||(!msg) ) 
        return false;
    sendResData( session, msg, p );
    
    return true;
}

//////////////////////////////////////////////////////////////////////////
exports.reqdataProcess = reqdataProcess;
exports.parseResourceData = parseResourceData;
