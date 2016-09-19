/*************************************************************************\
 * File Name    : manager.js                                             *
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
var fs       = require('fs');
var util     = require('util');
var path     = require('path');
var events   = require('events');
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


Manager.prototype.accept = function(socket) 
{
    var self     = this;
    // create a new session
    var identity = socket.remoteAddress + ':' + socket.remotePort;
    var session  = this.sessions.create( identity, socket );
  
    var proto = protocol.create(socket);

    proto.on('data', function(data) {
        var msg = protocol.decode( data );
        self.receive( msg, session );
    });
    proto.on('error', function(err) {
        debug('packet error: ',err.toString());
    }); 
    session.socketErrorHandler(  function(data){
        session._socket.end();
    });
    session.socketTimoutHandler( function(data){ 
        session._socket.end();
    });
}

Manager.prototype.send = function( did, msg ) 
{
    var session = this.sessions.getBydId(did);
	if(sesson){
		session._socket.write(msg);
	}
}


Manager.prototype.sendToGroup = function(group, msg, except) 
{    
    var self     = this;
    var sessions = this.sessions.inGroup(group, except);
    
    // send msg to all
    _.each(sessions, function(session) {
        self.send(session.deviceid, msg);
    });
}

Manager.prototype.receive = function(msg, session) 
{	
    if(msg.cmd){
        var cmdId = parseInt(msg.cmd);
        if( cmdId > 0 )
            return this.command_callback(commands[cmdId-1], msg, session);
    }
    return null;    
}

Manager.prototype.command_callback = function(action, msg, session) 
{
    var command   = this.getCommand(action);
    var commandCb = (!!command.callback);
    if (commandCb) {
        return command.callback( msg, session, manager ); 
    }
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
