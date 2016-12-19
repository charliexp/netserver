/*************************************************************************\
 * File Name    : flightwin.js                                           *
 * --------------------------------------------------------------------- *
 * Title        :                                                        *
 * Revision     : V1.0                                                   *
 * Notes        :                                                        *
 * --------------------------------------------------------------------- *
 * Revision History:                                                     *
 *   When             Who         Revision       Description of change   *
 * -----------    -----------    ---------      ------------------------ *
 * 2-15-2016      charlie_weng     V1.0          Created the program     *
 *                                                                       *
\*************************************************************************/
'use strict';

var Cache  = require('./cache.js');
var events = require('events');
 
 /////////////////////////////////////////////////////////////////////////
 var options = {
    ttl:      5,   // TTL 5 sec.
    interval: 60,  // Clean every sec.
    cnts:     3    // repeat cnts
};

function FlightCache(options,dataObj)
{
    events.EventEmitter.call(this);
    this.cache = new Cache(options);
    this.limit = 1;
    this.indx  = 0;
} 
util.inherits( FlightCache, events.EventEmitter );

/////////////////////////////////////////////////////////////////////////
FlightCache.prototype.get = function( sno )
{
    var data = this.cache.get( sno );
    return data;
}

FlightCache.prototype.set = function( sno, data )
{
    if( this.indx < this.limit ){
        this.cache.set( sno, data );
        this.indx++;
        this.emit( 'set', this.indx );
        return 'ok';
    }
    else
    {
        return 'full';
    }
}

FlightCache.prototype.del = function( sno )
{
    this.cache.del( sno );
    if( this.indx > 0 ){
        this.indx--;
        this.emit( 'del', this.indx );
    }
}

FlightCache.prototype.setLimit = function( num )
{
    this.limit = num;
    this.emit( 'setlimit', num );
}

FlightCache.prototype.getLimit = function( )
{
    return this.limit;
}

FlightCache.prototype.checkfull = function( )
{
    return ( this.limit < this.indx );
}

//////////////////////////////////////////////////////////////////////////
function create( setting, dataObj, publish ) 
{
    var opts = setting || options;
    var flightCache = new FlightCache( opts, dataObj, publish );
    return flightCache;
}
//////////////////////////////////////////////////////////////////////////
module.exports = {
    create : create
};


    