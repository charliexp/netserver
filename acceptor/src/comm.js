'use strict';
/*************************************************************************\
 * File Name    : comm.js                                                *
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
var tlv      = require('../lib/tlv.js');
var pkttype  = require('./const/type.js');
var cmdconst = require('./const/const.js');
var protocol = require('./protocol.js');

///////////////////////////////////////////////////////////////////////////
module.exports = {
    
    timestamp : function(){
        return parseInt( Date.now()/1000 );
    },
    
    prefixInteger:function (num, n) 
    {
        return (Array(n).join(0) + num).slice(-n);
    },
    
    makeTopic : function( type, nodeid, cmd, did ){
        
        if( !type ) 
            return null;
        if( type === 'ID' )
            return 'ID/'+ nodeid + '/in/'+ cmd +'/dev/'+ did;
        if( type === 'SYSTEM' )  //SYSTEM/nodeid/notify/kick
            return 'SYSTEM/'+ nodeid + '/notify'+ cmd;
    },
  
    getTopicItems : function( topic ){
         var  items = topic.split('/');
         if( !items )
            return null;
         else
            return { 
                len   : items.length, 
                items : items 
            };
    },
    
    getLvPacketData:function( lvpacket )
    {
        if( !Buffer.isBuffer(lvpacket) ){
            return null; 
        }	
        var headlen  = lvpacket.readUInt32LE( 0 );	
        var headdata = lvpacket.slice( 4, 4 + headlen );
        var bodydata = lvpacket.slice( 4 + headlen );
        var bodylen  = bodydata.readUInt32LE( 0 );	
	
        return { len:bodylen, data:bodydata }; 	
    },
    
    makeLvPacket:function( ids, lvData )
    {
        if( !Buffer.isBuffer(lvData) ){
            return null; 
        }	    
        var devlen = new Buffer(4);  
        var head   = new Buffer(ids);
    
        devlen[0]=  (ids.length)&0x000000FF;
        devlen[1]= ((ids.length)&0x0000FF00)>> 8;
        devlen[2]= ((ids.length)&0x00FF0000)>>16;
        devlen[3]= ((ids.length)&0xFF000000)>>24;
   
        return Buffer.concat([devlen,head,lvData]); 	
    },
    
    sendTimingPacket:function( session,isAck )
    {
        if( !session ) return;
        
        var obj  = {};
        var TLV  = tlv.TLV;
        var d    = new Date();
  
        var year = parseInt( d.getFullYear() );
        var mon  = parseInt( d.getMonth()    )+1;
        var day  = parseInt( d.getDate()     );
        var hou  = parseInt( d.getHours()    );
        var min  = parseInt( d.getMinutes()  );
        var sec  = parseInt( d.getSeconds()  );
    
        var time = new Buffer(7); 
    
        time.writeUInt16LE( year ,0 );
        time.writeUInt8(    mon  ,2 );
        time.writeUInt8(    day  ,3 );
        time.writeUInt8(    hou  ,4 );
        time.writeUInt8(    min  ,5 );
        time.writeUInt8(    sec  ,6 );
    
        var timeData    = new TLV( 0x05, time );
        var dataEncoded = timeData.encode();
    
        obj.head = cmdconst.HEAD; 
        obj.addr = 0;
        obj.sno  = 0;
        obj.type = isAck ? pkttype.ACK : 0;
        obj.cmd  = cmdconst.SET;   
        obj.data = dataEncoded;      
        var p    = protocol.encode(obj);
    
        session.send(p);
    }
};

