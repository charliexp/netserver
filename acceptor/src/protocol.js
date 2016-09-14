'use strict';
/*************************************************************************\
 * File Name    : session.js                                             *
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

var StreamFrame = require('../lib/stream-frame.js');
var cmdmaps     = require('./const/cmdmaps.js');
var type        = require('./const/type.js');
var debug       = require('debug')('ledmq:proto');


function create(socket) {
    return new StreamFrame(socket,config);
}

function config( stream ) {                     // TLV协议配置 
    
    stream.set( 'lengthSize', 2     );          // uint16
    stream.set( 'offset'    , 4     );          // size starts at 3rd byte.
    stream.set( 'bigEndian' , false );          // uses bigEndian order
    stream.set( 'timeout'   , 3000  );          // 
    stream.set( 'ping', {length:2,call:ping} ); // ping 0xAA 0xBB pong 0xAA 0xBB
    stream.set( 'lenfix'    , 6     ); 
}

function ping( data ) {                         // heat packet
    var pong = Buffer( [0x55,0xBB] ); 
    if( !data )
        return;
    if( (data.length >= 2)&&(data[1] === 0xBB) )
        return pong;
    else
        return null;
}

function encode( data ) {  // encode obj->bin 
    return data;
}

function decode( data ) { // decode bin->obj

    var msg = {};
    
    msg.head   = data.readUInt16LE(0); 
    msg.addr   = data.readUInt16LE(2);
    msg.length = data.readUInt16LE(4);
    msg.sno    = data.readUInt16LE(6); 
    msg.type   = data.readUInt8(8);  
    msg.cmd    = data.readUInt8(9);
    
    if( msg.type === cmdmaps.LOGIN )
        msg.data = data.slice(10);
    else
        msg.data = data;
    
    return msg;
}

/////////////////////////////////////////////////////////////////////////
module.exports = {
    create : create,
    encode : encode,
    decode : decode
};

