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
var net         = require('net');
var protocol    = require('./src/protocol.js');
var Sessions    = require('./src/session.js');
var manager     = require('./src/manager.js');
var debug       = require('debug')('ledmq:app');

//////////////////////////////////////////////////////////////////////////
var server = net.createServer( function (socket) {
    
    var id      = socket.remoteAddress + ':' + socket.remotePort;
    var session = Sessions.create( id, socket );
    debug( 'new client,id: ',id );
    socket.setTimeout( 60000 ); 
    var proto = protocol.create(socket);

    proto.on('data', function(data) {
        
        var msg = protocol.decode( data );
        manager.process( msg, session );
    });
    proto.on('error', function(err) {
        debug('packet error: ',err);
    });     
    session.socketErrorHandler(function(data){
        session._socket.destroy();
        Sessions.destroy(id);
    });
    session.socketCloseHandler(function(data){
        session._socket.destroy();
        Sessions.destroy(id);
    }); 
    session.socketTimoutHandler(function(data){
        debug('timeout: ',data);
        session._socket.destroy();
    });     
});

server.listen(5000);
console.log('ledmq server is start at port 5000');