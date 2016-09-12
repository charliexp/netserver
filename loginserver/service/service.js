/*************************************************************************\
 * File Name    : client.js                                              *
 * --------------------------------------------------------------------- *
 * Title        :                                                        *
 * Revision     : V1.0                                                   *
 * Notes        :                                                        *
 * --------------------------------------------------------------------- *
 * Revision History:                                                     *
 *   When             Who         Revision       Description of change   *
 * -----------    -----------    ---------      ------------------------ *
 * 04-18-2014      Mark Wolfe       V0.1.5        create this program    * 
 * 08-27-2016      charlie_weng     V1.0          fix this program       *
 *                                                                       *
\*************************************************************************/
var mqtt    = require('mqtt');
var mqttrpc = require('../mqtt-rpc');
var debug   = require('debug')('ledmq:service');

var settings = {
    keepalive       : 10,
    protocolId      : 'MQTT',
    protocolVersion : 4,
    reconnectPeriod : 1000,
    connectTimeout  : 60 * 1000,
    clean: true
}

// client connection
var mqttclient = mqtt.connect('mqtt://test1:test1@127.0.0.1:1883', settings);

// build a mqtt new RPC server
var server = mqttrpc.server(mqttclient);

//server.format('json');
server.format('msgpack');

// provide a new method
server.provide('proto/login', 'check', function (args, cb) {
  var token = args.token.split(':');
  if(token[0]&&token[0] === '0123456789')
  {
      debug('login check pass');
      cb(null, 'pass');
  }      
  else
  {
      debug('login check fail');
      cb(null, 'fail');
  }
});
