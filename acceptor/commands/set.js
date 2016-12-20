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
var comm     = require('../../lib/comm.js');
var loader   = require('../../lib/conf-loader.js');
var config   = loader.readConfigFile('./etc/config.yml');

//{
//    sno   : xxxx    
//    status: 'ok'|'error' 
//    ts: 1435549576
//}
//////////////////////////////////////////////////////////////////////////
var setProcess = function( msg, session, manager )
{
    var topic = config.mqserver.preTopic + '/state/dev/'+ session.getDeviceId();

       
    if( manager.protocol.getbody(msg.data)[0] === 0 ){
        //{"ack":{"cmd":"ok"},"id_dev":"115C040008","sno":65538}
        var json = {
            ack    : {cmd:'ok'},
            id_dev : session.getDeviceId(),
            sno    : msg.sno, 
        };

    }else{
        var json = {
            ack    : {cmd:'error',errcode : manager.protocol.getbody(msg.data)[0]},
            id_dev : session.getDeviceId(),
            sno    : msg.sno, 
        };
    }
    manager.publish( topic, JSON.stringify(json), { qos:0, retain: true } );
    return true;
}

exports.callback = setProcess;
