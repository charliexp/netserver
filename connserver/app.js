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

///////////////////////////////////////////////////////////////////////////
var setSocketExceptionHandler = function( session )
{
    session.socketErrorHandler(  function(data){ session._socket.end();});
    session.socketCloseHandler(  function(data){ session.kick(); }); 
    session.socketTimoutHandler( function(data){ session._socket.end();});  
}
//////////////////////////////////////////////////////////////////////////
var server = net.createServer( function (socket) {
    
    var id      = socket.remoteAddress + ':' + socket.remotePort;
    var session = Sessions.create( id, socket );
    
    setSocketExceptionHandler( session );
    debug( 'new client,id: ',id );
    var proto = protocol.create(socket);

    proto.on('data', function(data) {
        
        var msg = protocol.decode( data );
        manager.process( msg, session );
    });
    proto.on('error', function(err) {
        debug('packet error: ',err.toString());
    });        
});

server.listen(5000);
console.log('ledmq server is start at port 5000');