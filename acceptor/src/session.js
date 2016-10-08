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
'use strict';

var _        = require('lodash');
var debug    = require('debug')('ledmq:session');
var config   = require('../../config.js'); 

//////////////////////////////////////////////////////////////////////////
var _session = {};

function create(sid, socket) {
    var session = new Session(sid, socket);
    return session;
}

function destroy(did) {
    
    var s = _session[did];
    if( s ){        
        delete _session[did];
        s._socket.destroy(); 
    }
}

function get(did) {
    return _session[did];
}

function getAll() { 
    return _session;
}

function inGroup(group, except) {
    return _.filter( _session, function(session) {
        var sGroup = session.getGroup();
        return sGroup && sGroup.name === group && session.deviceid !== except;
    });
}

module.exports = {
    create   : create,
    destroy  : destroy,
    get      : get,
    getAll   : getAll,
    inGroup  : inGroup
};

///////////////////////////////////////////////////////////////
function Session(sid, socket) {
    this.id       = sid;
    this.deviceid = null;
    this.group    = null;
    this.settings = {};
    this.on_ts    = null;
    this.nodeid   = null;
    this.callback = null;
    // private
    Object.defineProperty(this, '_socket', { value: socket });
}

Session.prototype.set = function(setting, value) {
    this.settings[setting] = value;
};

Session.prototype.get = function(setting) {
    return this.settings[setting];
};

Session.prototype.kick = function(msg) {
    if( msg ) {
        this._socket.write(msg);
    }
    debug( 'kick device %s ', this.deviceid );
    this._socket.destroy();
    if(this.deviceid){
        delete _session[this.deviceid];
    }
};

Session.prototype.setGroup = function(group) {
    this.group = group;
};

Session.prototype.getGroup = function() {
    return this.group;
};

Session.prototype.socketErrorHandler = function(callback) {
    this._socket.on('error', callback);
};

Session.prototype.socketCloseHandler = function(callback) {
    this._socket.on('close', callback);
};

Session.prototype.socketTimoutHandler = function(callback) {
    this._socket.on('timeout', callback);
};

Session.prototype.setDeviceId = function(did) {
    this.deviceid     = did;
    _session[did] = this;
};

Session.prototype.getDeviceId = function() {
    return this.deviceid;
};

Session.prototype.add = function( nodeid, devobj )
{
    var self = this;
    
    if((!devobj)||(!devobj.did)){
        this.kick();
        return {stats:'err'};
    }                               
    this.setDeviceId(devobj.did);                 
    if( devobj.gid ){               
        this.setGroup(devobj.gid);               
    }
    else{
        this.setGroup('0001');   
    }
    for(var p in devobj ){
        if( (p !== 'did')&&(p !== 'gid') ){
            this.set(p,devobj[p]);
        }
    }
    if( devobj.heat ){
        this._socket.setTimeout( devobj.heat*1000 );             
    }
    else{
        this._socket.setTimeout( 240000 );  
    }
    
    this.nodeid = nodeid;
    process.nextTick( function(){
        if( self.callback ){
            self.callback( 'online', self );
        }
    });
    this.socketCloseHandler(  function(data){ 
        if( self.callback ){
            self.callback( 'offline', self );
        }
        self._socket.destroy();
        if( self.deviceid ){
            delete _session[self.deviceid];
        }
    }); 
    return {stats:'ok'};    
} 

Session.prototype.send = function(data) {
    this._socket.write(data);  
};
