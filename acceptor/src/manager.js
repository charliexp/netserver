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

var commands = require('./const/command.js');
var debug    = require('debug')('ledmq:manager');
var xxtea    = require('../lib/xxtea.js');  
var mqtt     = require('mqtt');
var SSDB     = require('../lib/ssdb.js');
var sync     = require('simplesync');
var config   = require('../../config.js');

var devTokenMap ={};
var commToken   = '0123456789';

var ssdb  = SSDB.connect(config.ssdb.ip, config.ssdb.port, function(err){
    if(err){
        debug('ssdb state : ' + err);
        return;
    }
    debug('ssdb is connected');
}); 
           
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
var devLoginProcess = function( msg, session, Sessions )
{
    var loginobj = string2Object( msg );
    var isPass   = false;
              
    if( loginobj&&loginobj.token )
    {
        var token = new Buffer(loginobj.token, 'base64').toString();
        var str   = xxtea.decrypt(token,'4567');
        debug( 'token decrypt: ',str );
        var token = str.split(':');
         
        if( !token[0]||(!loginobj.did) )
        {
            session.kick(); 
            return;
        }
        var tokenstr = devTokenMap[loginobj.did]; 
        if( tokenstr ){
            if( token[0] === tokenstr ){
                isPass = true;
            }else{
                debug('token check error ');
                session.kick();
                return;
            }
        }
        else if( token[0] === commToken ){
            isPass = true;
        }else{
            debug('token check error ');
            session.kick();
            return;
        }    
        if( isPass !== true ) return;
            
        debug( 'token check pass' );
            
        var oldsesion = Sessions.getBydId(loginobj.did);
        debug( ' oldsesion: ',oldsesion );
             
        if( oldsesion&&(oldsesion.id !== session.id)) {
            debug( 'kick deviceId: ',loginobj.did );
            oldsesion.kick();          
        }
        if( loginobj.did ){                              
            session.setDeviceId(loginobj.did);                 
        }
        if( loginobj.gid ){               
            session.setGroup(loginobj.gid);               
        }
        for(var p in loginobj ){
            if( (p !== 'did')&&(p !== 'gid') ){
                session.set(p,loginobj[p]);
            }
        }
        debug( 'add deviceId: ',loginobj.did );
        if( loginobj.heat ){
            session.setTimeout(loginobj.heat*1000);  
            debug( 'set socket Timeout: ',loginobj.heat,'sec' );            
        }
        else{
            session.setTimeout(240000);  
        }
            
        var onlinestr = {
            nodeid : config.nodeid,
            devid  : session.deviceid,
            ip     : session.id,
            ver    : session.settings.ver,
            type   : session.settings.type,
            stauts : 'online',
            ts     : Date.now()
        };
        ssdb.hset( config.onlineTab,loginobj.did,JSON.stringify(onlinestr), function(err){
            if(err)
            {
                debug( 'add ssdb fail' );
                return;
			}
            debug( loginobj.did,'add to ssdb ' );
        });                                     
    }
}

var kickdevice = function( session )
{
    if(session.deviceid)
    {
        ssdb.hdel(config.onlineTab, session.deviceid, function(err){
            if(err)
            {
                debug( 'add ssdb fail' );
                return;
            }
            debug( session.deviceid,'del to ssdb ' );
            
        });
        session.kick();
    } 
}     
              
//////////////////////////////////////////////////////////////////////////
function process( msg, session,Sessions ) {
    
    switch( msg.cmd )
    {
        case commands.LOGIN:
            debug( 'commands.LOGIN' );
            devLoginProcess( msg.data, session, Sessions );
            
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
    process    : process,
    kickdevice : kickdevice
};
