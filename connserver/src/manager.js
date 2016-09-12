'use strict';
/*************************************************************************\
 * File Name    : manager.js                                             *
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
var sessions = require('./session.js');
var commands = require('./const/command.js');
var debug    = require('debug')('ledmq:manager');
var xxtea    = require('../lib/xxtea.js');  
var mqtt     = require('mqtt');
var mqttrpc  = require('../mqtt-rpc');

///////////////////////////////////////////////////////////////////////////
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
// build a new RPC client
var client     = mqttrpc.client(mqttclient);
client.format('msgpack');


/////////////////////////////////////////////////////////////////////////
function string2Object( data )
{
    var array = data.toString().split(',');
    var obj   = {};
    var kv    = [];
    
    for( var i = 0; i < array.length; i++ )
    {
        kv = array[i].split(':');
        obj[kv[0]] = kv[1];
    }
    return obj;
}
////////////////////////////////////////////////////////////////////
var devLoginProcess = function( msg, session)
{
    var loginobj = string2Object( msg );
    var isPass = false;
              
    if( loginobj )
    {
        if( loginobj.token ){
            var token = new Buffer(loginobj.token, 'base64').toString();
            var str   = xxtea.decrypt(token,'4567');
            debug( 'token decrypt: ',str );
            client.callRemote('proto/login', 'check',{token:str}, function(err, data){
                if(err) 
                    console.log('error: ',err);
                else{
                    console.log( 'check', data );
                    isPass = true;
                }
                if( isPass === false )
                {
                    session.kick();
                    return;
                }
                if( loginobj.did ){                  
                    session.setDeviceId(loginobj.did);                 
                }
                if( loginobj.gid ){               
                    session.setGroup(loginobj.gid);               
                }
                for(var p in loginobj )
                {
                    if( (p !== 'did')&&(p !== 'gid') )
                    {
                        session.set(p,loginobj[p]);
                    }
                }
                debug( 'add deviceId: ',loginobj.did );
                if( loginobj.heat )
                {
                    session.setTimeout(loginobj.heat*1000);  
                    debug( 'set socket Timeout: ',loginobj.heat,'sec' );            
                }
                else
                {
                    session.setTimeout(240000);  
                }                 
            }); 
        }                  
    }
}
//////////////////////////////////////////////////////////////////////////
function process( msg, session ) {
    
    switch( msg.cmd )
    {
        case commands.LOGIN:
            debug( 'commands.LOGIN' );
            devLoginProcess( msg.data, session );
            
            break;
        case commands.SET:
            debug( 'commands.SET' );  
            
            break;
        case commands.GET:
            debug( 'commands.GET' );
            
            break;  
        case commands.UPDATE:
            debug( 'commands.UPDATE' );
            
            break;
        case commands.RESET:
            debug( 'commands.RESET' );
            
            break;
        case commands.REQ:
            debug( 'commands.REQ' );
            
            break;  
        default:
            debug( 'cmd: ', msg.cmd,'\n' );
            
            break;        
    }
    debug( 'process data: ', msg,'\nsession id: ',session.id );
    session._socket.write('ack bye! \r\n');
}

/**
 * @export
 * @type {Object}
 */
module.exports = {
    process: process
};
