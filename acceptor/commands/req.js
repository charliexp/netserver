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
var tag      = require('../src/const/tag.js');
var config   = require('../../config.js');
var db       = require('../../dispatch/centdb.js');
var tlv      = require('../lib/tlv.js');
var Cache   = require('../../dispatch/cache.js');

var options ={
    ttl:      600,   // TTL 10 min.
    interval: 600,   // Clean 10 min.
    cnts:     1      // repeat cnts
};

var cache = new Cache(options);

//////////////////////////////////////////////////////////////////////////
var reqDataParse = function( data )
{
    if( !data  )  return null;

    var result = tlv.parseAll( protocol.getbody(data) );
    
    for( var i = 0; i< result.length; i++ )
    {    
        if( result[i].tag === tag.TAG_RESID )
        {
            var resourceId = result[i].value.slice( 0, 8 ).toString();
            var pktId      = result[i].value.readUInt16LE(8);
            var pktCnt     = result[i].value.readUInt8(10);
            
            debug('resourceId:%s,packetId:%d,packetCnt:%d', resourceId, pktId, pktCnt);
            //console.log('resourceId:%s,packetId:%d,packetCnt:%d', resourceId, pktId, pktCnt);
    
            if( (pktCnt > 10)||( pktId >= 0xF000 ) ) //一次请求大于10包的判为非法
                return null;
            else
                return { 
                    rid  : resourceId,    // resource Id
                    spid : pktId,         // start packet id   
                    pcnt : pktCnt         // req total packets      
                };
        }
        debug('tlv decode data: ',result[i].tag,result[i].value );
    }
    return null;
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
var sendResData = function( session, msg, rmd5, p ){
    
    var resmd5 = rmd5.toString();
    debug('resource md5: ',resmd5 );
        
    for( var i = 0; i< p.pcnt; i++ )
    {
        db.getdata( resmd5, p.spid + i, function(err,data){
            
            if( err||(!data) ){
                sendResPacket( session, msg, new Buffer([0x07]) );  //节目不存在  
                return;  
            }  
            sendResPacket( session, msg, data );
        });
    }
}       
//////////////////////////////////////////////////////////////////////////
var reqProcess = function( msg, session, manager )
{
    debug('[req] req device: ',session.deviceid );
    var p = reqDataParse( msg.data );

    if( !p ) return false;
    
    var md5 = cache.get( p.rid );
    if( md5 )
    {
        sendResData( session, msg, md5, p ); 
    }
    else
    {        
        db.getResIdMD5( p.rid, function(err,rmd5){
        
            if( err||(!rmd5) ) {
                sendResPacket( session, msg, new Buffer([0x07]) );  //节目不存在
                return;
            }
            sendResData( session, msg, rmd5, p );
            cache.set( p.rid, rmd5 );
        });
    }
    return true;
}

//////////////////////////////////////////////////////////////////////////
exports.callback = reqProcess;
