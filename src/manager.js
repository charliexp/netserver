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
var HashMap  = require('hashmap');  
var xxtea    = require('../lib/xxtea.js');  

var devidSession  = new HashMap();
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
//////////////////////////////////////////////////////////////////////////
function process( msg, session ) {
    
    switch( msg.cmd )
    {
        case commands.LOGIN:
            debug( 'commands.LOGIN' );
            var obj = string2Object( msg.data );
            
            debug( 'prase obj: ',obj );
            
            if( obj )
            {
                if( obj.token ){
                    var str2 = new Buffer(obj.token, 'base64').toString();
                    var str1 = xxtea.decrypt(str2,'4567');
                    debug( 'token decrypt: ',str1 );
                }
                if( obj.did ){                  
                    devidSession.set( obj.did, session );
                    session.setName(obj.did);                 
                }
                if( obj.gid ){               
                    session.setGroup(obj.gid);               
                }
                for(var p in obj )
                {
                    if( (p !== 'did')&&(p !== 'gid') )
                    {
                        session.set(p,obj[p]);
                    }
                }
                debug( 'add did to table: ',obj.did );
                debug( 'session: ',devidSession.get(obj.did) );                
            }
            
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
            
            //var str = xxtea.encrypt('0123456789:920','4567');
            //var b   = new Buffer(str).toString('base64');
            //debug( 'encrypt data: ',b.length,b );
            //var str2 = new Buffer(b, 'base64').toString();
            //var str1 = xxtea.decrypt(str2,'4567');
            //debug( 'decrypt data: ',str1 );
            
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
