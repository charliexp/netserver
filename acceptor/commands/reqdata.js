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
var db       = require('../../dispatch/centdb.js');
var Cache    = require('../../dispatch/cache.js');

///////////////////////////////////////////////////////////////////////////
var options ={
    ttl:      60,    // TTL 1 min.
    interval: 600,   // Clean 10 min.
    cnts:     1      // repeat cnts
};

var   cache    = new Cache(options);
var   downstep = new Cache(options);
const step     = [ 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 100, 100, 100 ];
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
                tid  : taskId,
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
var sendResPacket = function( manager, session, msg, data )
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
//////////////////////////////////////////////////////////////////////////
var downloadInd = function( id, currCnt, maxCnt )
{
    var info = parseInt((currCnt*100)/maxCnt);
    var indx = downstep.get(id);
    if( indx )
    {
        if( info >= 100 ){
            info = 100;
            downstep.del(id);
            return info;
        }
        if( info >= step[indx] ){
            downstep.set(id, indx+1);
            downstep.ttl(id, 60);
            return info;
        }
        return null;
    }
    else
    {
        if( info >= 100 ){
            info = 100;
            downstep.del(id);
        }
        else{
            downstep.set(id, 1);
        }
        
        return info;
    }
}
//////////////////////////////////////////////////////////////////////////
var buildPacket = function( manager, msg, data )
{
    var obj  = {};
    
    obj.head = msg.head;
    obj.addr = msg.addr;
    obj.sno  = msg.sno;
    obj.type = msg.type & 0xBF;  //not ACK
    obj.cmd  = msg.cmd|0x80;    
    obj.data = data      
    return manager.protocol.encode(obj);  
} 

//////////////////////////////////////////////////////////////
var pushDataAndSend = function( manager, session, indx, pks, msg, data, p ,maxCnt )
{
    pks[indx] = buildPacket(  manager, msg, data ) ; 
    
    if( pks.length >= p.pcnt )
    {
        session.send( Buffer.concat(pks) );
        if(( p.spid + pks.length) >= maxCnt )
        {
            sendResPacket( manager, session, msg, new Buffer([0x0]) );  //节目OK 
        }
    }
    else if( ( p.spid + pks.length) >= maxCnt )
    {
        session.send( Buffer.concat(pks) );
        sendResPacket( manager, session, msg, new Buffer([0x0]) );  //节目OK  
        return true;
    }
    return false;
}
////////////////////////////////////////////////////////////////////
var getDataProcess = function( manager, session, msg, p, pkscnt )
{
    var pks = [];
    debug('max packets:%s,start cnt:%s,pcnt:%s ',pkscnt,p.spid,p.pcnt);
    for( var i = 0; i< p.pcnt; i++ )
    {        
        var cacheData = cache.get( p.rid+'_'+(p.spid+i) );

        if( cacheData )
        {
            if( ( p.spid + i) >= pkscnt ){           
                break;
            }
            pushDataAndSend( manager, session, i ,pks, msg, cacheData, p, pkscnt );           
            cache.ttl(p.rid+'_'+(p.spid+i), 60);
            debug('req on cache data:',p.rid+'_'+(p.spid+i));
        }
        else
        {
            debug('req on ssdb data:',p.rid+'_'+(p.spid+i));
            (function(i){ 
                db.getdata( p.rid, p.spid + i, function(err,data){
                    if( ( p.spid + i) >= pkscnt ){                    
                        return;
                    }   
                    if( err||(!data) ){
                        if( ( p.spid + i) < pkscnt )
                           sendResPacket( manager, session, msg, new Buffer([0x07]) );  //节目不存在  
                        return;  
                    }
                    pushDataAndSend( manager, session, i, pks, msg, data, p, pkscnt );                    
                    cache.set( p.rid+'_'+(p.spid+i), data );
                })
            })(i);
        }
    }
}
////////////////////////////////////////////////////////////////////
var sendResData = function( manager, session, msg, p, callback ){
    
    debug('resource md5: ',p.rid );
    
    ////////////////////////////////////////////////////////
    var dataInfo = cache.get( p.rid+'_info' );
    
    if( !dataInfo )
    {
        db.getdata( p.rid, 'info', function(err,data){
            if( err||(!data) ){
                debug('program not exist');
                sendResPacket( manager, session, msg, new Buffer([0x07]) );  //节目不存在   
                callback({ret:'err',errcode:0x07},null);
                return;  
            }
            try{            
                dataInfo = JSON.parse(data);
                console.log('parse data:',data,dataInfo);
            }catch(e)
            {
                console.log('resource data error:',e);
                callback({ret:'err',errcode:0x07},null);
                return;
            }
            cache.set( p.rid+'_info', dataInfo );
            getDataProcess( manager, session, msg, p, dataInfo.pktscnt );
            var info = downloadInd( session.deviceid, (p.spid+p.pcnt), dataInfo.pktscnt )
            if( info != null )
            {
                callback( null, {ret:'ok',val:info,max:dataInfo.pktscnt} );
            }
        });
    }
    else
    {
        cache.ttl( p.rid+'_info', 60);
        getDataProcess( manager, session, msg, p, dataInfo.pktscnt );
        var info = downloadInd( session.id, (p.spid+p.pcnt), dataInfo.pktscnt )
        if( info != null )
        {
            callback( null, {ret:'ok',val:info,max:dataInfo.pktscnt} );
        }
    }
} 
     
//////////////////////////////////////////////////////////////////////////
var reqdataProcess = function( manager, p, msg, session, callback )
{
    if( (!p)||(!session)||(!msg) ) 
        return false;
    sendResData( manager, session, msg, p, callback );
    
    return true;
}

//////////////////////////////////////////////////////////////////////////
exports.reqdataProcess    = reqdataProcess;
exports.parseResourceData = parseResourceData;
