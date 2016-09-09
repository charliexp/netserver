'use strict';
/*************************************************************************\
 * File Name    : stream-frame.js                                        *
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
var util   = require('util');
var events = require('events');

/**
 * [StreamFrame description]
 */
function StreamFrame(socket) {
    if (!(this instanceof StreamFrame)) return new StreamFrame(socket);
    events.EventEmitter.call(this);

    this.inPacket   = [];
    this.expectedSz = -1;
    this.receivedSz = 0;
    this.settings   = {};
    this.tmhandle   = null;
    this.socket     = socket;

    if (socket) this.wrap(socket);
}

util.inherits(StreamFrame, events.EventEmitter);
module.exports = StreamFrame;

StreamFrame.prototype.set = function (setting, value) {
    this.settings[setting] = value;
};

StreamFrame.prototype.get = function (setting) {
    return this.settings[setting];
};

/**
 * [wrap description]
 * @param  {[type]} socket [description]
 * @return {[type]}        [description]
 */
StreamFrame.prototype.wrap = function (socket) {
    var self = this;
    socket.on('data', function (chunk) {
        self.handleData(chunk);
    });
};

/**
 * [handleData description]
 * @param  {[type]} buff [description]
 * @return {[type]}      [description]
 */
StreamFrame.prototype.handleData = function (buff) {
    var recurse = false;

    var lenSz   = this.get('lengthSize') || 2;
    var bigEnd  = this.get('bigEndian' );
    var offset  = this.get('offset'    ) || 0;
    var ignore  = this.get('ignore'    );
    var timeout = this.get('timeout'   );
    var ping    = this.get('ping'      );
    var lenfix  = this.get('lenfix'    ) || 0;
    var self    = this;
  
    if (ignore) {
        this.emit( 'data', buff );
        return;
    }
    if(timeout)
    {
        this.tmhandle = setTimeout( function(){
            self.emit('error', buff);
            self.reset();  
        },timeout );
    }
    if( ping )
    {
        var pongdata = ping.call( buff );
        if( pongdata )
        {
            this.socket.write( pongdata );
            buff = buff.slice( ping.length );
            this.reset(); 
            
            if( buff.length === 0 ){
                return;
            }
            else
            {
                this.inPacket.push(buff);
                this.receivedSz += buff.length;
            }
        }
    }
    if(  buff.length < lenSz + offset )
    {
        this.inPacket.push(buff);
        this.receivedSz += buff.length;
        return;
    }

    if ( ( this.expectedSz < 0 ) /*&&( buff.length >= lenSz + offset )*/ ) {
        if (lenSz === 1)
            this.expectedSz = buff.readUInt8(0 + offset); 
        else if (lenSz === 2 && !bigEnd)
            this.expectedSz = buff.readUInt16LE(0 + offset); 
        else if (lenSz === 4 && !bigEnd)
            this.expectedSz = buff.readUInt32LE(0 + offset);  
        else if (lenSz === 2 && bigEnd)
            this.expectedSz = buff.readUInt16BE(0 + offset); 
        else if (lenSz === 4 && bigEnd)
            this.expectedSz = buff.readUInt32BE(0 + offset); 
        else
            throw new Error('invalid length');
        
        this.expectedSz += lenfix; 
        
        if( this.expectedSz < lenSz + offset  ) 
        {
            this.emit('error', buff);
            this.reset();
            return;
        }
    }

    var expectedRemaining = (this.expectedSz - this.receivedSz);

    if (buff.length > expectedRemaining) {
        var tmp = buff.slice(0, expectedRemaining);
        buff = buff.slice(expectedRemaining);

        recurse = true;
        this.inPacket.push(tmp);
        this.receivedSz = this.expectedSz;
    } else {
        this.inPacket.push(buff);
        this.receivedSz += buff.length;
    }

    if (this.receivedSz === this.expectedSz) { 
        this.emit('data', Buffer.concat( this.inPacket, this.expectedSz) );
        this.reset();
    }

    if (recurse) this.handleData(buff);
};

/**
 * [reset description]
 * @return {[type]} [description]
 */
StreamFrame.prototype.reset = function () {
    this.inPacket   = [];
    this.expectedSz = -1;
    this.receivedSz = 0;
    if( this.tmhandle )
    {
        clearTimeout(this.tmhandle); 
        this.tmhandle   = null;
    }
};
