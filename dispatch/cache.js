/*************************************************************************\
 * File Name    : cache.js                                               *
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

var events = require('events');
var	util   = require('util');
var	slice  = [].slice;

//////////////////////////////////////////////////////////////////////////    
function bind(f, to) {
	if (!f) console.log("No function", f);
	return function () {
		return f.apply(to, arguments);
	};
}

//////////////////////////////////////////////////////////////////////////
function stop(cache) {
	if (cache.timer) {
		clearTimeout(cache.timer);
		cache.timer = false;
	}
}

///////////////////////////////////////////////////////////////////////////
function start(cache) {
	if (cache.options.interval > 0) {
		cache.timer = setTimeout(cache.clean, cache.options.interval * 1000);
	}
}

///////////////////////////////////////////////////////////////////////////
function fetch(cache, key) {
	var ttl = cache.ttls[key],
		now = ttl ? +(new Date) : 0;

	if (ttl && ttl < now) {
		cache.stats.keys--;
        var value = cache.data[key];

        if( cache.cnts[key] > 0 )
        {
            cache.cnts[key]--;
            cache.ttls[key] = +(new Date) + cache.options.ttl * 1000;
        }
        else
        {
            delete cache.data[key];
            delete cache.ttls[key];
        }
		cache.emit("expire", key, value );

		return;
	}

	return cache.data[key];
}

////////////////////////////////////////////////////////////////////////////
function Cache(options) {
	if (!(this instanceof Cache)) {
		return new Cache(options);
	}

	this.get   = bind( this.get,   this );
	this.mget  = bind( this.mget,  this );
	this.set   = bind( this.set,   this );
	this.del   = bind( this.del,   this );
	this.ttl   = bind( this.ttl,   this );
	this.flush = bind( this.flush, this );
	this.clean = bind( this.clean, this );

	this.timer = false;
	this.data  = {};
	this.ttls  = {};
    this.cnts  = {};

	this.options = {
		ttl:      300, // Default TTL 5 minutes.
		interval: 60,   // Clean every minute.
        cnts:     0
	};

	if (options && options.ttl) 
           this.options.ttl = options.ttl;
	if (options && options.interval) 
           this.options.interval = options.interval;
    if (options && options.cnts > 0) 
           this.options.cnts = options.cnts-1;   

	this.stats = {
		hits:   0,
		misses: 0,
		keys:   0
	};

	start(this);
}

//////////////////////////////////////////////////////////////////
util.inherits(Cache, events.EventEmitter);

//////////////////////////////////////////////////////////////////
Cache.prototype.get = function (key) {
	var v = fetch(this, key);

	if ('undefined' !== typeof v) {
		this.stats.hits++;
		return v;
	}

	this.stats.misses++;
};
//////////////////////////////////////////////////////////////////
Cache.prototype.mget = function (keys) {
	var key, val, ret, i, len;

	if (!(keys instanceof Array)) {
		keys = slice.call(arguments);
	}

	ret = {};
	for (i = 0, len = keys.length; i < len; i++) {
		key = keys[i];
		val = fetch(this, key);
		if ('undefined' !== typeof val) {
			ret[key] = val;
			this.stats.hits++;
		}
		else {
			this.stats.misses++;
		}
	}

	return ret;
};
//////////////////////////////////////////////////////////////////
Cache.prototype.set = function (key, val) {
	var exists = fetch(this, key);

	if ('undefined' === typeof val) {
		this.del(key);
		return exists;
	}

    var ttl = this.options.ttl;

	this.data[key] = val;
	ttl && (this.ttls[key] = +(new Date) + ttl * 1000);
    this.cnts[key] = this.options.cnts;
    
	('undefined' !== typeof exists) || this.stats.keys++;
	this.emit("set", key, val);

	return exists;
};
//////////////////////////////////////////////////////////////////
Cache.prototype.del = function (keys) {
	var c, key, val, i, len;

	if (!(keys instanceof Array)) {
		keys = slice.call(arguments);
	}

	c = 0;
	for (i = 0, len = keys.length; i < len; i++) {
		key = keys[i];
		val = fetch(this, key);
		if ('undefined' !== typeof val) {
			this.stats.keys--;
			c++;
			delete this.data[key];
			delete this.ttls[key];
            delete this.cnts[key];
			this.emit("del", key);
		}
	}
	return c;
};
//////////////////////////////////////////////////////////////////
Cache.prototype.ttl = function (key, ttl) {
	ttl || (ttl = this.options.ttl);
 
	if (!ttl || ttl <= 0) return this.del(key);

	if ('undefined' !== typeof fetch(this, key)) {
		this.ttls[key] = +(new Date) + ttl * 1000;
	}
};
//////////////////////////////////////////////////////////////////
Cache.prototype.flush = function () {
	stop(this);

	this.data = {};
	this.ttls = {};
    this.cnts = {};
	this.stats = {
		hits:   0,
		misses: 0,
		keys:   0
	};

	start(this);

	this.emit("flush");
};
//////////////////////////////////////////////////////////////////
Cache.prototype.clean = function () {
	stop(this);

	var data = this.data,
		now = +(new Date),
		key, ttl, c = 0;   

	for ( key in data ) {
		if ( data.hasOwnProperty(key) ) {
			ttl = this.ttls[key]

			if ( ttl && ttl < now ) {
				this.stats.keys--;
				var value = this.data[key];
                if(this.cnts[key] > 0)
                {
                    this.cnts[key]--;
                    this.ttls[key] = +(new Date) + this.options.ttl * 1000;
                }
                else
                {
                    delete this.data[key];
                    delete this.ttls[key];
                    delete this.cnts[key];
                    c++;
                }
                this.emit("expire", key, value );
			}
		}
	}

	this.emit("clean", c);

	start(this);
	return c;
};
//////////////////////////////////////////////////////////////////
module.exports = Cache;

