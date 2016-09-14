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
var manager     = require('./src/manager.js');
var debug       = require('debug')('ledmq:app');

var netmanger   = manager.create();
//////////////////////////////////////////////////////////////////////////
var server = net.createServer( function (socket) {
    netmanger.accept(socket);
    netmanger.once('online', function(data) {
        debug('online: ',JSON.stringify(data));
    });
    netmanger.once('offline', function(data) {
        debug('offline: ',JSON.stringify(data)); 
    });
});

server.listen(5000);
console.log('ledmq server is start at port 5000');