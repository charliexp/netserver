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

var debug    = require('debug')('ledmq:login');
var xxtea    = require('../lib/xxtea.js');  

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
////////////////////////////////////////////////////////////////////
var devLoginProcess = function( msg, session, Manager )
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
            
        var oldsesion = Manager.sessions.getBydId(loginobj.did);
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
        session._socket.write('ok');          
    }
}

exports.callback = devLoginProcess;