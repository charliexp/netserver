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

'use strict';

var util   = require('util');
var events = require('events');
var debug  = require('debug')('ledmq:frame');

/**
 * [function StreamFrame]
 */
function StreamFrame(socket,config) {
    
    if (!(this instanceof StreamFrame)) 
        return new StreamFrame(socket,config);
    events.EventEmitter.call(this);

    this.pending   = null;
    this.pktlength = -1;
    this.settings  = {};
    this.tmhandle  = null;
    this.socket    = socket;
    if (socket) this.wrap(socket);
    if ( config && typeof config === 'function' ){ 
        config(this);
    }
    //this.setMaxListeners(0);
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
 * [function wrap ]
 * @param  socket 
 * @return null
 */
StreamFrame.prototype.wrap = function (socket) {
    var self = this;
    socket.on('data', function (chunk) {
        self.handleData(chunk);
    });
};

/**
 * [function handleData ]
 * @param  buff 
 * @return null
 */
StreamFrame.prototype.handleData = function (buff) {

    var lenSz   = this.get('lengthSize') || 2;
    var bigEnd  = this.get('bigEndian' );
    var offset  = this.get('offset'    ) || 0;
    var ignore  = this.get('ignore'    );
    var timeout = this.get('timeout'   );
    var ping    = this.get('ping'      );
    var lenfix  = this.get('lenfix'    ) || 0;
    var head    = this.get('head'    );
    var self    = this;
  
    if( ignore ) {
        this.emit( 'data', buff );
        return;
    }
    if( timeout ){
        this.tmhandle = setTimeout( function(){
            self.emit('error', buff);
            self.resetTimer();
            self.pending = null;             
        },timeout );
    }
    if ( this.pending === null ) {
		this.pending = buff;
	} else {
		this.pending = Buffer.concat([ this.pending, buff ]);
	}
    if( this.pending === null )
        return;
    
    if( ping&&(this.pending.length >= ping.length) )
    {
        if( ping.ping.readUInt16BE(0) === this.pending.readUInt16BE(0) ){
            this.socket.write( ping.pong );
            this.pending = this.pending.slice( ping.length );
            this.resetTimer(); 
            if( this.pending.length === 0 ){         
                this.pending = null;
                return;
            }                
        }
    }
    
    if( (this.pending === null) || (this.pending.length < lenSz + offset) ){
        return;
    }
    if( head )
    {     
       do{   
            if( head.readUInt16BE(0) !== this.pending.readUInt16BE(0) ){
                this.pending = this.pending.slice( 2 );
            }
            else{
                break;
            }
            if(this.pending.length < lenSz + offset)
                return;                
        }while(1);       
    }
    if ( lenSz === 1 )
        this.pktlength = this.pending.readUInt8(0 + offset); 
    else if (lenSz === 2 && !bigEnd)
        this.pktlength = this.pending.readUInt16LE(0 + offset); 
    else if (lenSz === 4 && !bigEnd)
        this.pktlength = this.pending.readUInt32LE(0 + offset);  
    else if (lenSz === 2 && bigEnd)
        this.pktlength = this.pending.readUInt16BE(0 + offset); 
    else if (lenSz === 4 && bigEnd)
        this.pktlength = this.pending.readUInt32BE(0 + offset); 
    else
        throw new Error('invalid length');
    
    this.pktlength += lenfix; 
        
    if( this.pktlength < lenSz + offset  ) 
    {
        this.emit('error', this.pending);
        this.resetTimer();
        this.pending = null; 
        return;
    }
    if (this.pending.length >= this.pktlength) {
        var tmp      = this.pending.slice( 0, this.pktlength );
        this.pending = this.pending.slice( this.pktlength );
        this.emit('data', tmp );
        this.resetTimer();
        if (this.pending.length > 0){ 
            this.handleData(new Buffer([]));
        }
        else{
            this.pending = null;
        }
    }
};

/**
 * [function resetTimer]
 * @return null
 */
StreamFrame.prototype.resetTimer = function () {
 
    if( this.tmhandle ){
        clearTimeout(this.tmhandle); 
        this.tmhandle   = null;
    }
};


