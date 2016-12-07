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
var protocol = require('../../lib/protocol.js');
var config   = require('../../etc/appconfig.js');
var comm     = require('../../lib/comm.js');
var tlv      = require('../../lib/tlv.js');
var tag      = require('../../const/tag.js');
var constval = require('../../const/const.js');
var req      = require('./reqdata.js');
var cmdconst = require('../../const/const.js');

var dataMsk = [0,10,20,30,40,50,60,70,80,90,100];
//////////////////////////////////////////////////////////////////////////
var getProcess = function( msg, session, manager )
{
    if( msg.cmd === constval.GET )
    {   
        var result = tlv.parseAll( protocol.getbody( msg.data ) );

        for( var i = 0; i< result.length; i++ )
        {    
            debug('tlv decode data: ',result[i].tag,result[i].value ); 
           
            if( result[i].tag === tag.TAG_RESID )
            {
                var p = req.parseResourceData( result[i] );
                if( p )
                {
                    req.reqdataProcess( p, msg, session, function( err, info ){
                        if( err )
                        {
                            return;
                        }
                        if(info)
                        {
                            //{"ack":{"cmd":"info","val":60},"id_dev":"115C040008","sno":65580}
                            var topic = config.mqserver.preTopic + '/state/dev/'+ session.getDeviceId();
                            var data = {
                                ack   : { cmd:'info', val: info.val },
                                id_dev: session.getDeviceId(),
                                sno   : p.tid
                            };                            
                            manager.publish( topic, JSON.stringify(data),{ qos:0, retain: true } ); 
                            debug(topic, JSON.stringify(data));
                        }
                    });
                }  
            }
            else if( result[i].tag === tag.TAG_TMRING )
            {
                comm.sendTimingPacket( session,msg.sno,(cmdconst.GET|0x80), false );
            }  
        }
    }
    else 
    {       
        var topic = config.mqserver.preTopic + '/cmdack/dev/'+ session.getDeviceId();
        manager.publish( topic, msg.data,{ qos:0, retain: true } ); 
        debug(topic, msg.data);
    }
}

exports.callback = getProcess;
