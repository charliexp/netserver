/*************************************************************************\
 * File Name    : app.js                                                 *
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
'use strict';

var net       = require('net');
var cluster   = require('cluster');
var manager   = require('./manager.js');
var debug     = require('debug')('ledmq:app');
var loader    = require('../lib/conf-loader.js');
var comm      = require('../lib/comm.js');
var cmdconst  = require('../const/const.js');
var logger    = require('../lib/log.js');
var colors    = require('colors'); 

var config    = loader.readConfigFile('./etc/config.yml');
var colorsTab = ['cyan','green','yellow','blue','red','rainbow','grey'];
//////////////////////////////////////////////////////////////////////////
var serverStart = function( id, protocol, port )
{
    var netmanger = manager.create(protocol);
    
    netmanger.setLocalId( id );
    netmanger.nodeidRegister( id );

    netmanger.on('message', function( topic, message ){

        var msgroute = topic.split('/');
        if( !msgroute ) return;
        
        if( (msgroute[0]=== 'SYSTEM') && (msgroute.length >= 4) )
        {
            // 'SYSTEM/nodeid/notify/${cmd}'
            // 'SYSTEM/nodeid/notify/kick' msg == did
            switch( msgroute[3] )
            {
                case 'kick':
                
                    if( msgroute[1] === netmanger.localId )
                        netmanger.kick( netmanger.localId, message.toString() );
                    break;
                    
                case 'heat':
                    
                    break;                                 
            }          
        }
        else if( (msgroute[0] === 'ID') && (msgroute.length >= 6) )
        {
            // ID/nodeid/in/cmd/dev/${devId}
            // ID/nodeid/in/msgdw/dev/${devId}
            // ID/nodeid/in/res/dev/${devId}
            // ID/nodeid/in/timing/dev/${devId}
            
            var deviceId = msgroute[5];
            var cmd      = msgroute[3];
            switch( cmd )
            {
                case 'res':
                case 'msgdw':
                case 'cmd':
                
                    netmanger.send( deviceId, message );
                    debug(' send data to dev -> %s ', deviceId ); 
                    
                    break;
                    
                case 'timing':
                
                    var tdata = comm.jsonParse(message.toString());
                    if( tdata && tdata.sno ){                    
                        comm.sendTimingPacket( netmanger, netmanger.sessions.get(deviceId), tdata.sno, cmdconst.SET, true );
                    }
                    break;                
            }                  
        }
        else if( (msgroute[0] === 'CONFIG') && (msgroute.length >= 3) )   
        {
            //CONFIG/update/token
            if( msgroute[1] === 'update' ){
                switch( msgroute[2] )
                {
                    case 'token':                  
                        netmanger.getAllDevToken();
                        console.log( 'update server node[id: %s ] token db finish!',id );
                        break;
                }
            }
        } 
        
    });
    netmanger.on('connect', function(){
        var topic     = 'ID/'+id + '/in/#';
        var systopic  = 'SYSTEM/' + id + '/notify/#';
        var conftopic = 'CONFIG/#';
        
        netmanger.subscribe( topic );
        netmanger.subscribe( systopic );
        netmanger.subscribe( conftopic );
    });
    netmanger.on('error', function(err){
        debug(' net error -> %s ', err ); 
        logger.error(' net error -> %s ', err );        
    });
    
    netmanger.devInfoClear();
    
    var server = net.createServer( function (socket) {

        netmanger.accept(socket);
    });
    server.listen( port );
}

////////////////////////////////////////////////////////////////////////////
if( config.debug ) {
    var id = config.nodeid+':1';
    
    var protocol = config.plugin.protocol;
    if( protocol instanceof Array )
    {
        for( var i =0; i< protocol.length; i++ )
        {   
            var proto = comm.installProtocol( protocol[i] );    
            serverStart( id+':'+proto.port, proto.protocol, proto.port );
            console.log( 'server| PROTOCOL[%d]-> "%s" is start at port: %s '[colorsTab[i]], 
                         i, proto.name, proto.port );
        }
    } 
    else
    {      
        var proto = comm.installProtocol( protocol ); 
        serverStart( id, proto.protocol, proto.port );
        console.log( 'server| PROTOCOL: "%s" is start at port: %s '[colorsTab[0]], 
                     proto.name, proto.port );
    }
} 
else 
{
    if ( cluster.isMaster ) 
	{	
        console.log( "main process running: pid=" + process.pid );
        var cpus  = require('os').cpus().length
        var procs = Math.ceil(0.8 * cpus)
      
        for (var i = 0; i < procs; i++) 
			cluster.fork();
        
		cluster.on("exit", function (worker, code) {
            if (code != 0) {
                console.log('Worker %d died :(', worker.id);
                logger.error('Worker %d died :(', worker.id ); 
                cluster.fork();
            }
        });		
    } 
	else 
	{
		var id = config.nodeid+':'+cluster.worker.id;
        
        var protocol = config.plugin.protocol;
        if( protocol instanceof Array )
        {
            for( var i =0; i< protocol.length; i++ )
            {   
                var proto = comm.installProtocol( protocol[i] );    
                serverStart( id+':'+proto.port, proto.protocol, proto.port );
                console.log( 'server| PROTOCOL [%d]-> "%s" is start at port: %s  [WORKER ID: %s]'[colorsTab[i]], 
                             i,proto.name, proto.port, cluster.worker.id );                        
            }
        } 
        else
        {   
            var proto = comm.installProtocol( protocol );     
            serverStart( id, proto.protocol, proto.port );
            console.log( 'server| PROTOCOL: "%s" is start at port: %s  [WORKER ID: %s]'[colorsTab[0]], 
                         proto.name, proto.port, cluster.worker.id );
        }
    }
}

