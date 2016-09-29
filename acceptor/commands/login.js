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
var devStatusCallback =function( manager, status, session )
{
    if( session.deviceid )
    {
        if( status === 'online' ){
            session.on_ts = Date.now();
        }
       	var str = {
            nodeid : manager.serverId,
            devid  : session.deviceid,
            ip     : session.id,
            ver    : session.settings.ver,
            type   : session.settings.type,
            stauts : status,
            on_ts  : session.on_ts,
            ts     : Date.now()
        };
        storage.putDevStatsInfo( ssdb, str.nodeid, status, str );
        var topic = config.mqserver.preTopic+'/' + manager.serverId + '/out/status';
        manager.publish( topic, JSON.stringify(str),{ qos:0, retain: true } );
    }
}

////////////////////////////////////////////////////////////////////
var loginProcess = function( msg, session, manager )
{
    var loginInfo   ={};
    var isPass     = false;
	var oldsession = null;
    
    if( msg&&msg.data ){
        loginInfo   = string2Object( msg.data );
    }
    else{
        session.kick();
        return {ret:'fail'};  
    }        
    if( loginInfo && loginInfo.token )
    {
        var token = new Buffer(loginInfo.token, 'base64').toString();
        var str   = xxtea.decrypt(token,'4567');
        //debug( 'token decrypt: ',str );
        var token = str.split(':');
         
        if( !token[0]||(!loginInfo.did) )
        {
            return {ret:'fail'};
        }
        var tokenstr = devTokenMap[loginInfo.did]; 
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
              
        oldsession = manager.sessions.get( loginInfo.did );
        
        var topic  = 'SYSTEM/' + manager.serverId + '/notify';
        var device = { did:loginInfo.did };
        manager.publish( topic, JSON.stringify(device),{ qos:0, retain: true } );
        
        if( oldsession ){
			oldsession.kick();
		}
        loginInfo.manager  = manager;
        loginInfo.callback = devStatusCallback;		
        var ret = session.add( loginInfo );
        
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
