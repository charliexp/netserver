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
var req      = require('./reqdata.js');

//////////////////////////////////////////////////////////////////////////
var getProcess = function( msg, session, manager )
{
    var result = tlv.parseAll( protocol.getbody( msg.data ) );
    var isProcess = false;
    
    for( var i = 0; i< result.length; i++ )
    {    
        debug('tlv decode data: ',result[i].tag,result[i].value ); 
        if( result[i].tag === tag.TAG_RESID )
        {
            var p = req.parseResourceData( result[i] );
            if( p )
            {
                req.reqdataProcess( p, msg, session );
            }
            isProcess = true;
        }
        else if( result[i].tag === tag.TAG_TMRING )
        {
            comm.sendTimingPacket( session, false );
            isProcess = true;
        }  
    }
    if( !isProcess )
    {
        var topic = config.mqserver.preTopic + '/cmdack/dev/'+ session.getDeviceId();
        manager.publish( topic, msg.data,{ qos:0, retain: true } ); 
    }
}

exports.callback = getProcess;
