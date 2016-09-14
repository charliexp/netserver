'use strict';

var _      = require('lodash');
var fs     = require('fs');
var util   = require('util');
var path   = require('path');
var events = require('events');

var commands = require('../commands/command.js');
var sessions = require('./session.js');
var protocol = require('./protocol.js');
var config   = require('../../config.js');
var debug    = require('debug')('ledmq:manager');

/**
 * The network manager.
 *
 * @constructor
 * @extends events.EventEmitter
 */
function Manager() 
{
  events.EventEmitter.call(this);
  this.commands = {};
  this.sessions = sessions;
}

util.inherits(Manager, events.EventEmitter);


Manager.prototype.accept = function(socket) {

    var self     = this;
    // create a new session
    var identity = socket.remoteAddress + ':' + socket.remotePort;
    var session  = this.sessions.create( identity, socket );
  
    this.exceptionHandler( session );
    var proto = protocol.create(socket);

    proto.on('data', function(data) {
        var msg = protocol.decode( data );
        self.receive( msg, session );
    });
    proto.on('error', function(err) {
        debug('packet error: ',err.toString());
    }); 
}

Manager.prototype.send = function( did, msg ) {
    var session = this.sessions.getBydId(did);
    session._socket.write(msg);
}


Manager.prototype.sendToGroup = function(group, msg, except) {
    
    var self     = this;
    var sessions = this.sessions.inGroup(group, except);
    
    // send msg to all
    _.each(sessions, function(session) {
        self.send(session.deviceid, msg);
    });
}

Manager.prototype.receive = function(msg, session) {
    
    return this.command_callback(commands[msg.cmd-1], msg.data, session);
}

Manager.prototype.kickDevice = function( session )
{
    if(session.deviceid)
    {
       var offlinestr = {
            nodeid : config.nodeid,
            devid  : session.deviceid,
            ip     : session.id,
            ver    : session.settings.ver,
            type   : session.settings.type,
            stauts : 'offline',
            ts     : Date.now()
       };
       this.emit( 'offline', offlinestr );
       session.kick();
    } 
}

Manager.prototype.exceptionHandler = function( session )
{
    var self = this;
    session.socketErrorHandler(  function(data){
        session._socket.end();
    });
    session.socketCloseHandler(  function(data){ 
        self.kickDevice(session);
    });  
    session.socketTimoutHandler( function(data){ 
        session._socket.end();
    });
}

Manager.prototype.command_callback = function(action, msg, session) {
    
    var self      = this;
    var command   = self.getCommand(action);
    var commandCb = (!!command.callback);
    if (commandCb) {
        var ret = command.callback( msg, session, manager ); 
    }
    if( command === 'login' ){
        
        var onlinestr = {
            nodeid : config.nodeid,
            devid  : session.deviceid,
            ip     : session.id,
            ver    : session.settings.ver,
            type   : session.settings.type,
            stauts : 'online',
            ts     : Date.now()
        };
        this.emit( 'online', onlinestr );
    }
    return ret;
}

Manager.prototype.getCommand = function(action) {
    
    if (!action) 
        return this.commands;
    if (this.commands.hasOwnProperty(action)) {
        return this.commands[action];
    }
    return false;
}

Manager.prototype.registerCommand = function(name, command) {
    
    if (!name)    
        throw new Error('command name is required');
    if (!command) 
        throw new Error('command is required');
    if (!command.callback) 
        throw new Error(name + ' is missing a callback');

    this.commands[name] = command;
}

var manager = null;

/**
 * Creates a new  manager.
 *
 * @return {Manager}
 */
function create() {
    if (manager) {
        throw new Error('Manager already exists.');
    }

    manager = new Manager();

    // register all known commands
    _.each(commands, function(name) {
        var file = path.join(__dirname, '..', 'commands', name);
        
        if (fs.existsSync(file + '.js')) {
            debug('load commands file:',name +'.js');
            manager.registerCommand(name, require(file));
        }
    });

    return manager;
}

function get() {
    if (!manager) {
        throw new Error('No manager exists.');
    }
    return manager;
}

/**
 * @export
 * @type {Object}
 */
module.exports = {
    create : create,
    get    : get
};
