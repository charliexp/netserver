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
var _      = require('lodash');
var debug  = require('debug')('ledmq:session');

//////////////////////////////////////////////////////////////////////////
var _sessions = {};

function create(sid, socket) {
    
    var session = new Session(sid, socket);
    _sessions[session.id] = session;
    debug( 'new client,session: ',session );
    return session;
}

function destroy(sid) {
    
    debug( 'del session: ', _sessions[sid] );
    delete _sessions[sid];
}

function get(sid) {
    
    return _sessions[sid];
}

function getAll() {
    
    return _sessions;
}

function getByName(devicename) {
    
    return _.find( _sessions, function(session) {
        return session.devicename === devicename;
    });
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
    getByName: getByName,
    getAll   : getAll,
    inGroup  : inGroup
};

function Session(sid, socket) {
    this.id         = sid;
    this.deviceid   = null;
    this.devicename = null;
    this.group      = null;
    this.settings   = {};
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
        this._socket.write(msg + '\n');
    }
    this._socket.destroy();
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

Session.prototype.setName = function(name) {
    this.devicename = this.deviceid = name;
};

Session.prototype.getDeviceId = function() {
    return this.deviceid;
};

Session.prototype.getDeviceName = function() {
    return this.devicename;
};

Session.prototype.setTimeout = function(timeout) {
    return this._socket.setTimeout(timeout);
};

