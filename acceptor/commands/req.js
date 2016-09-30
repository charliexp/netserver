'use strict';
/*************************************************************************\
 * File Name    : req.js                                                 *
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

var debug    = require('debug')('ledmq:req');
var protocol = require('../src/protocol.js');
var config   = require('../../config.js');

//////////////////////////////////////////////////////////////////////////
var reqProcess = function( msg, session, manager )
{
    //var obj = {};
    
    //var topic = config.mqserver.preTopic + '/' + manager.getServerId() + '/out/req/'+ session.getDeviceId();
    //manager.publish( topic, msg.data.toString(),{ qos:0, retain: true });
    
    var topic = config.mqserver.preTopic + '/req/dev/'+ session.getDeviceId();
    manager.publish( topic, msg.data,{ qos:0, retain: true });

 /*
    obj.head = msg.head;
    obj.addr = msg.addr;
    obj.sno  = msg.sno;
    obj.type = msg.type;
    obj.cmd  = msg.cmd|0x80;
    obj.data = new Buffer([0x00]);
    var p    = protocol.encode(obj);
    
    session.send(p);
    */
}

exports.callback = reqProcess;
