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

var debug    = require('debug')('ledmq:set');
var protocol = require('../src/protocol.js');
var config   = require('../../config.js');
var comm     = require('../src/comm.js');

//{
//    sno   : xxxx    
//    status: 'ok'|'error' 
//    ts: 1435549576
//}
//////////////////////////////////////////////////////////////////////////
var setProcess = function( msg, session, manager )
{
    var topic = config.mqserver.preTopic + '/state/dev/'+ session.getDeviceId();
    
    if( protocol.getbody(msg.data)[0] === 0 ){
        var json = {
            sno   : msg.sno, 
            status: "ok",
            ts    : comm.timestamp()
        };
    }else{
        var json = {
            sno    : msg.sno, 
            status : "error",
            errcode: protocol.getbody(msg.data)[0],
            ts     : comm.timestamp() 
        };
    }
    manager.publish( topic, JSON.stringify(json), { qos:0, retain: true } );
    return true;
}

exports.callback = setProcess;
