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
var sessions = require('./session.js');
var cmdmaps  = require('../const/cmdmaps.js');
var constval = require('../const/const.js');
var debug    = require('debug')('ledmq:manager');
var mqtt     = require('mqtt');
var rpcApi   = require('../devdb/rpcapi.js');
var comm     = require('../lib/comm.js');
var os       = require('os');
var logger   = require('../lib/log.js');
var loader   = require('../lib/conf-loader.js');
var config   = loader.readConfigFile('./etc/config.yml');

var mqurl    = config.mqserver.type+ '://'+
               config.mqserver.user+':'+config.mqserver.passwd+'@'+
               config.mqserver.host+':'+config.mqserver.port;
              
/**
 * The network manager.
 *
 * @constructor
 * @extends events.EventEmitter
 */
function Manager( protocol ) 
{
    events.EventEmitter.call(this);
    this.commands  = {};
    this.sessions  = sessions;
    this.localId   = null;
    this.mqttcli   = this.connectMqttServer( mqurl );
    rpcApi.connect( config.rpcserver.ip, config.rpcserver.port );
    this.token     = {};
    this.getAllDevToken();
    this.socketCnt = 0;
    this.protocol  = protocol;
}

util.inherits(Manager, events.EventEmitter);

////////////////////////////////////////////////////////////////
Manager.prototype.accept = function(socket) 
{
    var self     = this;
    // create a new session
    var identity = socket.remoteAddress.split(':').pop() + ':' + socket.remotePort;
    var session  = this.sessions.create( identity, socket );
    
    var proto = this.protocol.create(socket);

    proto.on('data', function(data) {
        var msg = self.protocol.decode( data );
        self.receive( msg, session );
    });
    proto.on('ping', function(data) {
        if( session.getDeviceId() !== null ){
            session.send( self.protocol.pongData() );
        }
    });
    proto.on('error', function(err) {
        debug('packet error: ',err.toString());
        logger.error('packet error: ',err.toString());
    }); 
}

Manager.prototype.send = function( did, msg ) 
{
    var session = this.sessions.get(did);
	if(session){
		session.send(msg);
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

Manager.prototype.receive = function( msg, session ) 
{	
    if( msg.cmd )
    {
        var cmdId = parseInt( msg.cmd )&0x7F;
        if( cmdId > 0 ){
            if( cmdId > constval.LOGIN ){
                if( !session.getDeviceId() ){
                    session._socket.destroy();
                    return null;
                }
            }
            return this.command_callback( cmdmaps['CMD_'+cmdId], msg, session );
        }
    }
    return null;    
}

Manager.prototype.command_callback = function(action, msg, session) 
{
    var command   = this.getCommand(action);
    var commandCb = (!!command.callback);
    if (commandCb) {
        return command.callback( msg, session, this ); 
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

Manager.prototype.setLocalId = function(id) {
    this.localId = id;
}

Manager.prototype.getLocalId = function() {
    return this.localId;
}

Manager.prototype.connectMqttServer = function( url, opts ) {
    
    var settings = {
        keepalive       : 10,
        protocolId      : 'MQTT',
        protocolVersion : 4,
        reconnectPeriod : 1000,
        connectTimeout  : 60 * 1000,
        clean: true
    };
    if( opts ){
        settings = opts;
    }
    this.mqttcli = mqtt.connect(url, settings); 
   
    this.mqttcli.on('message', this.emit.bind(this, 'message'));
    this.mqttcli.on('connect', this.emit.bind(this, 'connect'));
    this.mqttcli.on('error'  , this.emit.bind(this, 'error')  );
    
    return  this.mqttcli;
}


Manager.prototype.publish = function( topic, msg, opts ) {
    
    if( this.mqttcli ){
        this.mqttcli.publish( topic, msg, opts );
    }
}

Manager.prototype.subscribe = function( topic ) {
    
    if( this.mqttcli )
        this.mqttcli.subscribe(topic);
}

Manager.prototype.kick = function( nodeid, session, did ) {
  
    if( nodeid === this.localId ){
        var oldsession = this.sessions.get( did );
        if( oldsession &&( session.id != oldsession.id ) ){
            oldsession.kick();
        }
    }
    else
    {
        var topic  = 'SYSTEM/' + nodeid + '/notify/kick';
        this.publish( topic, did, { qos:1, retain: true } );
    }
}

Manager.prototype.devStateUpdate = function( status, session ){
    
    //var self = get();
    var self = this;
    if( session.deviceid )
    {
        if( status === 'online' ){
            session.on_ts = comm.timestamp();
            self.socketCnt++;
        }else{
            if( self.socketCnt )
                self.socketCnt--;
        }
       	var str = {
            nodeid : self.localId,
            devid  : session.deviceid,
            ip     : session.id,
            ver    : session.settings.ver,
            type   : session.settings.type,
            stauts : status,
            on_ts  : session.on_ts,
            ts     : comm.timestamp()
        };
        rpcApi.putDevStatsInfo( status, str );
        delete str.nodeid;
        var topic = config.mqserver.preTopic+'/devstate/'+ session.getDeviceId(); //ledmq/devstate/${devId}     
        self.publish( topic, JSON.stringify(str), { qos:0, retain: true } );
    }
}
Manager.prototype.add = function( session, devobj ){
    
    var self = this;
    var ret  = false;

    ret = session.add( devobj );
    process.nextTick( function(){
        self.devStateUpdate( 'online', session );
    });
    session.socketCloseHandler(  function(data){ 
        self.devStateUpdate( 'offline', session );  
        session.kick();
    }); 
    return ret;    
}

Manager.prototype.registerSession = function( session, devobj, callback ){
    
    var self = this;
    
    if( !devobj.did ) return false;
    
    this.getNodeId( devobj.did, function(nodeId){
            
        if( nodeId ){   
            self.kick( nodeId, session, devobj.did );
        }           
        var ret = self.add( session, devobj );
        callback( ret );
    });
}

Manager.prototype.getNodeId = function( did, callback ){
    rpcApi.getNodeId( did, callback );
}

Manager.prototype.devInfoClear = function(){
    rpcApi.serverClearInfo( this.localId, function(data){} ); 
}

Manager.prototype.getAllDevToken = function(){
    
    var self = this;
    rpcApi.getAllDevToken( function(data){
        
        if( data && data.index.length !== 0 ){
            for( var i = 0; i < data.index.length; i++ ){
                self.token[data.index[i]] = data.items[data.index[i]];  // gid --> token;
            } 
        }else{
            self.token['0000'] = config.permission.commToken;
        }            
    });
}

Manager.prototype.getDevAuthToken = function( gid, callback ){
    
    rpcApi.getDevAuthToken( gid, function(err, data){
   
            if((!err) && data) 
                callback(data); 
            else
                callback(null);                
    });
}

Manager.prototype.getDevtoken = function(gid,callback){
    
    var self = this;
    
    if( this.token[gid] )
        callback( this.token[gid] );
    else
    {
        rpcApi.getDevtoken( gid, function(data){
            
            if(data) self.token[gid] = data;
            callback(data);               
        });
    }
}

Manager.prototype.nodeidRegister = function( id ){

    var self = this;
    var info = {
        system   : {
            arch     : process.arch,
            platform : process.platform,
            cpus     : os.cpus().length,
            hostname : os.hostname(),
            freemem  : os.freemem(),
            totalmem : os.totalmem(),
            load     : os.loadavg()
        },        
        node     : {
            nodeid   : id,
            pid      : process.pid,
            status   : 'running',
            memory   : process.memoryUsage(),
            uptime   : process.uptime()
        }
    };
    rpcApi.serverRegister( self.localId, info , function(err, data){});
    setInterval(function(){
        info.node.memory = process.memoryUsage();
        info.node.uptime = process.uptime();
        rpcApi.serverRegister( self.localId, info , function(err, data){});
    },5000);    
}

/* 
var manager = null;

function create(protocol) {
    
    if (manager) {
        throw new Error('Manager already exists.');
    }
    if(!protocol){
        throw new Error('No protocol exists.');
    }
    manager = new Manager(protocol);
    // register all known commands
    var commands = config.plugin.modules || [];
    _.each(commands, function(name) {
        
        //var file = path.join(__dirname, '..', 'commands', name);
        var file = path.join(__dirname, 'commands', name);
        if (fs.existsSync(file + '.js')) {
            debug('load commands file:',name +'.js');
            manager.registerCommand(name, require(file));
        }
    });
    return manager;
}

*/

/**
 * Creates a new  manager.
 *
 * @return {Manager}
 */
function create(protocol) {
    
    if(!protocol){
        throw new Error('No protocol exists.');
    }
    var manager = new Manager(protocol);
    // register all known commands
    var commands = config.plugin.modules || [];
    _.each(commands, function(name) {
        
        //var file = path.join(__dirname, '..', 'commands', name);
        var file = path.join(__dirname, 'commands', name);
        if (fs.existsSync(file + '.js')) {
            debug('load commands file:',name +'.js');
            manager.registerCommand(name, require(file));
        }
    });
    return manager;
}

/*
function get() {
    
    if (!manager) {
        throw new Error('No manager exists.');
    }
    return manager;
}
*/

/**
 * @export
 * @type {Object}
 */
module.exports = {
    create : create //,
   // get    : get
};
