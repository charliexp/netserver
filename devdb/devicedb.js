/*************************************************************************\
 * File Name    : devicedb.js                                            *
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
'use strict';

var axon   = require('axon');
var rpc    = require('axon-rpc');
var debug  = require('debug')('ledmq:devdb');
var config = require('../config.js');

var rep    = axon.socket('rep');
var server = new rpc.Server(rep);

rep.bind(config.rpcserver.port);

server.expose( require('./dbapi.js') );
