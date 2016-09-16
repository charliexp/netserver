'use strict';
/*************************************************************************\
 * File Name    : login.js                                               *
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

var debug    = require('debug')('ledmq:login');
var xxtea    = require('../lib/xxtea.js');
var config   = require('../../config.js');  

var devTokenMap ={};
var commToken   = '0123456789';

           
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

var devStatusNotify =function(status,session,callback)
{
	var offlinestr = {
		nodeid : config.nodeid,
		devid  : session.deviceid,
		ip     : session.id,
		ver    : session.settings.ver,
		type   : session.settings.type,
		stauts : status,
		ts     : Date.now()
	};
	debug('======================'); 
	if(callback)
		callback(status,offlinestr);
	debug('======================'); 
}

var callback = function(topic, string)
{
	debug(topic,JSON.stringify(string));
}

	
////////////////////////////////////////////////////////////////////
var loginProcess = function( msg, session, Manager )
{
    var loginobj = string2Object( msg );
    var isPass   = false;
	var oldsession = null;
              
    if( loginobj&&loginobj.token )
    {
        var token = new Buffer(loginobj.token, 'base64').toString();
        var str   = xxtea.decrypt(token,'4567');
        debug( 'token decrypt: ',str );
        var token = str.split(':');
         
        if( !token[0]||(!loginobj.did) )
        {
            return {ret:'fail'};
        }
        var tokenstr = devTokenMap[loginobj.did]; 
        if( tokenstr ){
            if( token[0] === tokenstr ){
                isPass = true;
            }else{
                debug('token check error ');
				return {ret:'fail'};
            }
        }
        else if( token[0] === commToken ){
            isPass = true;
        }else{
            debug('token check error ');
            return {ret:'fail'};
        }    
        if( isPass !== true ) return {ret:'fail'};
            
        debug( 'token check pass' );
            
        oldsession = Manager.sessions.getBydId(loginobj.did);
        debug( ' oldsesion: ',oldsession );
        
        if(oldsession !== null)
		{
            devStatusNotify( 'offline',oldsession,callback );
			oldsession.kick();
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
        session._socket.write('ok'); 
		devStatusNotify( 'online',session,callback );				
    }
	return {ret:'pass'};
}

exports.callback = loginProcess;