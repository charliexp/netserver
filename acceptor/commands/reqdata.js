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

///////////////////////////////////////////////////////////////////////////
var options ={
    ttl:      60,    // TTL 1 min.
    interval: 600,   // Clean 10 min.
    cnts:     1      // repeat cnts
};

var cache = new Cache(options);

//////////////////////////////////////////////////////////////////////////
var parseResourceData = function( resData )
{
    if( resData.value.length < 28 ) return null;
    
    var requstType = resData.value.readUInt8(0);
    if( requstType === 0 )
    {
        var taskId     = resData.value.readUInt32LE(1);
        var resourceId = resData.value.slice( 5, 25 ).toString('hex');
        var pktId      = resData.value.readUInt16LE(25);
        var pktCnt     = resData.value.readUInt8(27);
             
        debug('resourceId:%s,packetId:%d,packetCnt:%d', resourceId, pktId, pktCnt);

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
    else
    {
        return null;
    }
} 
//////////////////////////////////////////////////////////////////////////
var sendResPacket = function( session, msg, data )
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
//////////////////////////////////////////////////////////////////////////
/*
var sendResData = function( session, msg, p ){
    
    debug('resource md5: ',p.rid );
    
    ////////////////////////////////////////////////////////
    var dataInfo = cache.get( p.rid+'_info' );
    
    if( !dataInfo )
    {
        db.getdata( p.rid, 'info', function(err,data){
            if( err||(!data) ){
                return;  
            }
            try{            
                dataInfo = JSON.parse(data);
            }catch(e)
            {
                console.log('resource data error:',e);
                return;
            }
            cache.set( p.rid+'_info', dataInfo );
        });
    }
    else
    {
        cache.ttl( p.rid+'_info', 60);
    }
    /////////////////////////////////////////////////////////   
    
    for( var i = 0; i< p.pcnt; i++ )
    {
        if( dataInfo && dataInfo.pktscnt && ( p.spid+i) >= dataInfo.pktscnt )
        {
            sendResPacket( session, msg, new Buffer([0x0]) );  //节目OK
            return;        
        }

        var cacheData = cache.get( p.rid+'_'+(p.spid+i) );

        if( cacheData )
        {
            sendResPacket( session, msg, cacheData );
            cache.ttl(p.rid+'_'+(p.spid+i), 60);
            debug('req on cache data:',p.rid+'_'+(p.spid+i));
        }
        else
        {
            debug('req on ssdb data:',p.rid+'_'+(p.spid+i));
            (function(i){ 
                db.getdata( p.rid, p.spid + i, function(err,data){
            
                    if( err||(!data) ){
                        sendResPacket( session, msg, new Buffer([0x07]) );  //节目不存在  
                        return;  
                    }  
                    sendResPacket( session, msg, data );
                    cache.set( p.rid+'_'+(p.spid+i), data );
                })
            })(i);
        }
    }
}  
*/

var buildPacket = function( msg, data )
{
    var obj  = {};
    
    obj.head = msg.head;
    obj.addr = msg.addr;
    obj.sno  = msg.sno;
    obj.type = msg.type & 0xBF;  //not ACK
    obj.cmd  = msg.cmd|0x80;    
    obj.data = data      
    return protocol.encode(obj);  
} 

//////////////////////////////////////////////////////////////
var pushDataOnSend = function( session,pks, msg, data, p ,maxCnt )
{
    pks.push( buildPacket( msg, data ) ); 
    
    if( pks.length >= p.pcnt )
    {
        session.send( Buffer.concat(pks) );
    }
    else if( ( p.spid + pks.length) >= maxCnt )
    {
        session.send( Buffer.concat(pks) );
        sendResPacket( session, msg, new Buffer([0x0]) );  //节目OK  
        return true;
    }
    return false;
}
////////////////////////////////////////////////////////////////////
var getDataProcess = function( session, msg, p, pkscnt )
{
    var pks = [];
    for( var i = 0; i< p.pcnt; i++ )
    {
        if( ( p.spid + i) >= pkscnt )
            break;
        
        var cacheData = cache.get( p.rid+'_'+(p.spid+i) );

        if( cacheData )
        {
            pushDataOnSend( session, pks, msg, cacheData, p, pkscnt );           
            cache.ttl(p.rid+'_'+(p.spid+i), 60);
            debug('req on cache data:',p.rid+'_'+(p.spid+i));
        }
        else
        {
            debug('req on ssdb data:',p.rid+'_'+(p.spid+i));
            (function(i){ 
                db.getdata( p.rid, p.spid + i, function(err,data){
            
                    if( err||(!data) ){
                        if( ( p.spid + i) < pkscnt )
                           sendResPacket( session, msg, new Buffer([0x07]) );  //节目不存在  
                        return;  
                    }
                    pushDataOnSend( session, pks, msg, data, p, pkscnt );                    
                    cache.set( p.rid+'_'+(p.spid+i), data );
                })
            })(i);
        }
    }
}
////////////////////////////////////////////////////////////////////
var sendResData = function( session, msg, p ){
    
    debug('resource md5: ',p.rid );
    
    ////////////////////////////////////////////////////////
    var dataInfo = cache.get( p.rid+'_info' );
    
    if( !dataInfo )
    {
        db.getdata( p.rid, 'info', function(err,data){
            if( err||(!data) ){
                debug('program not exist');
                sendResPacket( session, msg, new Buffer([0x07]) );  //节目不存在   
                return;  
            }
            try{            
                dataInfo = JSON.parse(data);
                console.log('parse data:',data,dataInfo);
            }catch(e)
            {
                console.log('resource data error:',e);
                return;
            }
            cache.set( p.rid+'_info', dataInfo );
            getDataProcess( session, msg, p, dataInfo.pkscnt );
        });
    }
    else
    {
        cache.ttl( p.rid+'_info', 60);
        getDataProcess(session, msg, p, dataInfo.pkscnt );
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
exports.reqdataProcess    = reqdataProcess;
exports.parseResourceData = parseResourceData;
