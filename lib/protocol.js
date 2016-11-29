/*************************************************************************\
 * File Name    : protocol.js                                            *
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
var StreamFrame = require('./stream-frame.js');
var constval    = require('../const/const.js');
var type        = require('../const/type.js');
var debug       = require('debug')('ledmq:proto');

//////////////////////////////////////////////////////////////////////////
function create(socket) {
    return new StreamFrame(socket,config);
}

//////////////////////////////////////////////////////////////////////////
function config( stream ) {                       // TLV协议配置 

    var headcfg = new Buffer([0xAA,0x55]);          // 数据包头(2BYTE)
    var pingcfg = {
        length : 2,                                 // 实际ping包长度
        ping   : new Buffer([0xBB,0x55]),           // ping包头(2BYTE)
        pong   : new Buffer([0xBB,0x55])            // pong数据包 
    };
    stream.set( 'lengthSize', 2       );            // uint16
    stream.set( 'offset'    , 4       );            // size starts at 3rd byte.
    stream.set( 'bigEndian' , false   );            // uses bigEndian order
    stream.set( 'timeout'   , 3000    );            // 
    stream.set( 'ping'      , pingcfg );            // ping 0x55 0xBB pong 0x55 0xBB
    stream.set( 'lenfix'    , 6       ); 
    stream.set( 'head'      , headcfg );            //数据包头配置，也可以不配
}

///////////////////////////////////////////////////////////////////////////
function encode( msg ) {  // encode obj->bin 

    var head   = new Buffer(10); 
    var length = msg.data.length+4;
    
    head.writeUInt16LE( msg.head  ,0 );
    head.writeUInt16LE( msg.addr  ,2 );
    head.writeUInt16LE( length    ,4 );
    head.writeUInt16LE( msg.sno   ,6 );
    head.writeUInt8(    msg.type  ,8 );
    head.writeUInt8(    msg.cmd   ,9 );
      
    var body   = msg.data;
    var packet = Buffer.concat([ head, body ]);
    
    return packet;
}

//////////////////////////////////////////////////////////////////////////
function decode( data ) { // decode bin->obj

    var msg = {};
    if( data.length >= 10 )
    {
        msg.head    = data.readUInt16LE(0); 
        msg.addr    = data.readUInt16LE(2);
        msg.length  = data.readUInt16LE(4);
        msg.sno     = data.readUInt16LE(6); 
        msg.type    = data.readUInt8(8);  
        msg.cmd     = data.readUInt8(9);
        msg.data    = data;
    }
    return msg;
}

function getbody( data ){
    return  data.slice(10);
}

function pingAck(){
    return  new Buffer([0xBB,0x55]);
}

/////////////////////////////////////////////////////////////////////////
module.exports = {
    create : create,
    encode : encode,
    decode : decode,
    getbody: getbody,
    pingAck: pingAck
};

