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
var tlv      = require('./tlv.js');
var pkttype  = require('../const/type.js');
var cmdconst = require('../const/const.js');
var protocol = require('./protocol.js');
var crypto   = require('crypto'); 
var path     = require('path');
var fs       = require('fs');
var debug    = require('debug')('ledmq:comm');
///////////////////////////////////////////////////////////////////////////
module.exports = {
    
    timestamp : function(){
        return parseInt( Date.now()/1000 );
    },

    trim : function(str){     //删除左右两端的空格
　　     return str.replace(/(^s*)|(s*$)/g, "");
　　},

    prefixInteger:function (num, n) 
    {
        return (Array(n).join(0) + num).slice(-n);
    },

    getrid : function(){
        //return this.prefixInteger(crypto.randomBytes(2).readUIntLE(0, 2),4); 
        return crypto.randomBytes(2).readUInt16LE(0, 2);
        //return 0x1234;
    },
    makeMD5encrypt : function( str )
    {				
        var md5     = crypto.createHash('md5');
        var string  = md5.update(str).digest('hex');
        return string;
    },
    
    jsonParse:function(message)
    {
        try{
            return JSON.parse(message);
        }
        catch(e)
        {
            console.log( e );
            return null;
        }
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
        var ids      = lvpacket.slice( 4, 4 + headlen ).toString();
        var bodylen  = lvpacket.readUInt32LE( 4 + headlen );
        var pktlen   = lvpacket.readUInt16LE( 4 + headlen+4 );
        var bodydata = lvpacket.slice( 4 + headlen+6,4 + headlen + 6 + pktlen );
        return { ids:ids, data: bodydata }; 	
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
    
    calcTime:function( zone ) 
    { 
        var d   = new Date(); 
        var utc = d.getTime() + ( d.getTimezoneOffset() * 60000 ); 
        var nd  = new Date( utc + (3600000*zone) ); 
        return nd; 
    }, 
    
    sendTimingPacket:function( session, sno, cmd, isAck )
    {
        if( !session ) return;
        
        var obj  = {};
        var TLV  = tlv.TLV;
        var zone = session.get('tzone')||'+8';
        var d    = this.calcTime( zone );

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
        obj.addr = 0xFFFF;
        obj.sno  = sno;
        obj.type = (isAck ? pkttype.ACK : 0)|0x01;
        obj.cmd  = cmd;   
        obj.data = dataEncoded;      
        var p    = protocol.encode(obj);
    
        session.send(p);
    },
    
    installProtocol:function( proto )
    {
        var protocol;
        var port = 9090;
        var file = path.join( __dirname,'../acceptor/protocol', proto.path );
        if (fs.existsSync(file)) {
            debug( 'load protocol:', proto.name );
            protocol = require(file);
            port     = proto.port;
        }
        else
        {
            protocol = require('../acceptor/protocol/tlv/proto-tlv.js');
            port = 9090;
        }
        return { 
            name     : proto.name, 
            protocol : protocol, 
            port     : port 
        };
    }
};

