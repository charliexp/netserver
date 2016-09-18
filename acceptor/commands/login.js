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
    if( session.deviceid )
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
        if( callback )
            callback( status, offlinestr ); 
    }
}

var callback = function(topic, string)
{
	debug(topic,JSON.stringify(string));
}

var addDeviceInfo = function( session, devobj )
{
    if( devobj.did ){                              
        session.setDeviceId(devobj.did);                 
    }
    if( devobj.gid ){               
        session.setGroup(devobj.gid);               
    }
    for(var p in devobj ){
        if( (p !== 'did')&&(p !== 'gid') ){
            session.set(p,devobj[p]);
        }
    }
    debug( 'add deviceId: ',devobj.did );
    if( devobj.heat ){
        session.setTimeout(devobj.heat*1000);  
        debug( 'set socket Timeout: ',devobj.heat,'sec' );            
    }
    else{
        session.setTimeout(240000);  
    } 
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
            
        debug( 'login is ok!' );
            
        oldsession = Manager.sessions.getBydId(loginobj.did);
       
        if( oldsession !== null )
		{
			oldsession.kick();
		}		
        addDeviceInfo(session,loginobj);
        
        session._socket.write('ok'); 
        process.nextTick( function(){
            devStatusNotify( 'online',session,callback );	
        });
        session.socketCloseHandler(  function(data){ 
            devStatusNotify( 'offline',session,callback );
            session._socket.destroy();
        });
        return {ret:'pass'};        
    }
    else
    {
        session.kick();
        return {ret:'fail'};   
    }
}

exports.callback = loginProcess;