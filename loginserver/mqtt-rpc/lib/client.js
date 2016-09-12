'use strict';
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
var crypto     = require('crypto');
var mqtt       = require('mqtt');
var mqttrouter = require('mqtt-router');
var codecs     = require('./codecs.js');
var debug      = require('debug')('mqtt-rpc:client');

var Client = function (mqttclient) {

    // default to JSON codec
    this.codec      = codecs.byName('json');
    this.mqttclient = mqttclient || mqtt.createClient();
    this.router     = mqttrouter.wrap(mqttclient);
    this.inFlight   = {};
    var self        = this;
    this._generator = function () 
    {
        return crypto.randomBytes(5).readUInt32BE(0).toString(16);
    };

    this._handleResponse = function(topic, message) {

        var msg = self.codec.decode(message);
        var id  = msg._correlationId;
        //console.log('handleResponse', topic, id, 'message', msg);
        //console.log('inflight', self.inFlight[id]);

        if ( id && self.inFlight[id] ) {
            self.inFlight[id].cb( msg.err, msg.data );
            delete self.inFlight[id];
        }
    };

    this._sendMessage = function(topic, message, cb) {

        var id = self._generator();
        //console.log('sendMessage', topic, id, message);
        self.inFlight[id]      = { cb: cb };
        message._correlationId = id;
      // console.log('sendMessage', topic, id, message);
        self.mqttclient.publish( topic, self.codec.encode(message) );
    };

    this.callRemote = function(prefix, name, args, cb){

        var replyTopic   = prefix + '/' + name + '/reply';
        var requestTopic = prefix + '/' + name + '/request';

        self.router.subscribe(replyTopic, self._handleResponse);
        //console.log('callRemote', 'subscribe', replyTopic);
        self._sendMessage(requestTopic, args, cb);
    };

    this.format = function(format){
        self.codec = codecs.byName(format);
    };
};

module.exports = Client;
