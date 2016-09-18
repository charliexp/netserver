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
var protocol = require('../src/protocol.js');

var devTokenMap = {};
var commToken   = '0123456789';
 
/////////////////////////////////////////////////////////////////////////
function string2Object( data )
{
    var array = data.toString().split(',');
    var obj   = {};
    var kv    = [];
    
    for( var i = 0; i < array.length; i++ )
    {
        kv         = array[i].split(':');
        obj[kv[0]] = kv[1];
    }
    return obj;
}

var callback = function(topic, string)
{
	debug(topic,JSON.stringify(string));
}

////////////////////////////////////////////////////////////////////
var loginProcess = function( msg, session, Manager )
{
    var loginobj   ={};
    var isPass     = false;
	var oldsession = null;
    
    if( msg&&msg.data ){
        loginobj   = string2Object( msg.data );
    }
    else{
        session.kick();
        return {ret:'fail'};  
    }        
    if( loginobj && loginobj.token )
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
       
        if( oldsession !== null ){
			oldsession.kick();
		}		
        var ret = session.addDeviceInfo( session, loginobj, callback );
        if(ret.stats === 'ok')
            session.send('ok');
        else
            session.send('err');           
        
        return {ret:'pass'};        
    }
    else
    {
        session.kick();
        return {ret:'fail'};   
    }
}

exports.callback = loginProcess;