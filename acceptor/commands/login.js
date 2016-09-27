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
var SSDB     = require('../lib/ssdb.js');
var config   = require('../../config.js');
var storage  = require('../lib/storage.js');

var devTokenMap = {};
var commToken   = '0123456789';

///////////////////////////////////////////////////////////////////////////
var ssdb = storage.connect(config.ssdb.ip, config.ssdb.port);
       
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

/////////////////////////////////////////////////////////////////////////
var callback = function( manager,status, string )
{
    storage.putDevStatsInfo( ssdb, string.nodeid, status, string );
    var topic = 'ledmq/' + manager.serverId + '/out/status';
    manager.mqttPublish( topic, JSON.stringify(string),{ qos:0, retain: true } );
}

////////////////////////////////////////////////////////////////////
var loginProcess = function( msg, session, manager )
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
        else if( token[0] === config.commToken ){
            isPass = true;
        }else{
            debug('token check error ');
            return {ret:'fail'};
        }    
        if( isPass !== true ) return {ret:'fail'};
            
        debug( 'login is ok!' );
            
        oldsession = manager.sessions.getBydId(loginobj.did);
       
        if( oldsession !== null ){
			oldsession.kick();
		}		
        var ret = session.addDeviceInfo( manager,session, loginobj, callback );
        
        var obj  = {};
        obj.head = msg.head;
        obj.addr = msg.addr;
        obj.sno  = msg.sno;
        obj.type = msg.type;
        obj.cmd  = msg.cmd|0x80;
    
        if(ret.stats === 'ok')
            obj.data = new Buffer([0x00]);
        else
            obj.data = new Buffer([0x01]); 
        
        var p = protocol.encode(obj);
        session.send(p);
        
        return {ret:'pass'};        
    }
    else
    {
        session.kick();
        return {ret:'fail'};   
    }
}

exports.callback = loginProcess;