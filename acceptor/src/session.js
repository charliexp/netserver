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
var _        = require('lodash');
var debug    = require('debug')('ledmq:session');
var config   = require('../../config.js'); 

//////////////////////////////////////////////////////////////////////////
var _sessions    = {};
var _did2session = {};

function create(sid, socket) {
    var session = new Session(sid, socket);
    _sessions[session.id] = session;
   // debug( 'new client,session: ',session );
    return session;
}

function destroy(sid) {

    if(_sessions[sid]){
        var did = _sessions[sid].deviceid;
        if(did){
            delete _did2session[did];
        }
        _sessions[sid]._socket.destroy();
        delete _sessions[sid];
    }
}

function get(sid) {
    return _sessions[sid];
}

function getAll() { 
    return _sessions;
}

function getBydId(did) {
    var session = _did2session[did];  
    if( session ){
        return session;
    }
    else
        return null;
}

function inGroup(group, except) {
    return _.filter( _sessions, function(session) {
        var sGroup = session.getGroup();
        return sGroup && sGroup.name === group && session.id !== except;
    });
}

module.exports = {
    create   : create,
    destroy  : destroy,
    get      : get,
    getBydId : getBydId,
    getAll   : getAll,
    inGroup  : inGroup
};

///////////////////////////////////////////////////////////////
function Session(sid, socket) {
    this.id       = sid;
    this.deviceid = null;
    this.group    = null;
    this.settings = {};
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
    debug( 'kick session: ', this );
    this._socket.destroy();
    if(this.deviceid){
        delete _did2session[this.deviceid];
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
    _did2session[did] = this;
};

Session.prototype.getDeviceId = function() {
    return this.deviceid;
};

Session.prototype.setTimeout = function(timeout) {
    this._socket.setTimeout(timeout);
};

Session.prototype.statusNotify =function( manager, status, callback )
{
    if( this.deviceid )
    {
       	var str = {
            nodeid : manager.serverId,
            devid  : this.deviceid,
            ip     : this.id,
            ver    : this.settings.ver,
            type   : this.settings.type,
            stauts : status,
            ts     : Date.now()
        };
        if( callback )
            callback( manager,status, str ); 
    }
}

Session.prototype.addDeviceInfo = function( manager, session, devobj, callback )
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
    debug( 'add deviceId: ',devobj.did );
    if( devobj.heat ){
        this.setTimeout(devobj.heat*1000);  
        debug( 'set socket Timeout: ',devobj.heat,'sec' );            
    }
    else{
        this.setTimeout(240000);  
    }
    process.nextTick( function(){
        self.statusNotify( manager,'online',callback );	
    });
    this.socketCloseHandler(  function(data){ 
        self.statusNotify( manager,'offline',callback );
        self._socket.destroy();
    }); 
    return {stats:'ok'};    
} 

Session.prototype.send = function(data) {
    this._socket.write(data);  
};
