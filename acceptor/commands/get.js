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

var debug    = require('debug')('ledmq:get');
var protocol = require('../src/protocol.js');
var config   = require('../../config.js');
var cmdconst = require('../src/const/const.js');
var comm     = require('../src/comm.js');
var tlv      = require('../lib/tlv.js');
var tag      = require('../src/const/tag.js');

//////////////////////////////////////////////////////////////////////////
var getProcess = function( msg, session, manager )
{
    var result = tlv.parseAll( protocol.getbody(msg.data) );
    
    if( ( msg.cmd === cmdconst.GET )&&
        ( result.tag === tag.TAG_TMRING ) )
    {
        comm.sendTimingPacket( session, false );
    }
    else
    {
        var topic = config.mqserver.preTopic + '/cmdack/dev/'+ session.getDeviceId();
        manager.publish( topic, msg.data,{ qos:0, retain: true } );
    }
    return true;
}

exports.callback = getProcess;
