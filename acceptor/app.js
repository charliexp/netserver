'use strict';
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
var net     = require('net');
var manager = require('./src/manager.js');
var debug   = require('debug')('ledmq:app');
var config  = require('../config.js');
var cluster = require('cluster');
var storage = require('./lib/storage.js');

var netmanger   = manager.create();
//////////////////////////////////////////////////////////////////////////
var serverStart = function(id)
{
    netmanger.setServerId( id );
    netmanger.connectMqttServer( config.mqserver.url );
    
    netmanger.on('message', function( topic, message ){
        //var device = { cmd:'kick',did:loginInfo.did };
        var t = topic.split('/');
       // debug('+++++++mqtt rev msg -> %s:%s ', topic, message ); 
        
        if( t&&t[0]=== 'SYSTEM' ){
            
            try{
                var obj = JSON.parse(message);
            }catch(e){
                return;
            }
            switch( obj.cmd )
            {
                case 'kick':
                    netmanger.sessions.destroy( obj.did );
                    break;
            }          
        }
        else
        {
            // ledmq/cmd/dev/${devId}
            // ledmq/cmdack/dev/${devId}
            // ledmq/msgup/dev/${devId}
            // ledmq/msgdw/dev/${devId}
            // ledmq/req/dev/${devId}
            // ledmq/res/dev/${devId}
           if((t[1] === 'in')&&(t[3] === 'res'))
           {
               netmanger.send( t[5], message );
           }               
           debug('--mqtt rev msg -> %s:%s ', topic, message ); 
        }
         
    });
    netmanger.on('connect', function(){
        var topic     = id + '/in/#';
        var systopic  = 'SYSTEM/' + id + '/notify';
        
        netmanger.subscribe( topic );
        netmanger.subscribe( systopic );
    });
    netmanger.on('error', function(err){

    });
    
    storage.startServerClear( id, netmanger );
    
    var server = net.createServer( function (socket) {

        netmanger.accept(socket);
    });
    server.listen(config.server.port);
}

////////////////////////////////////////////////////////////////////////////
if (config.debug) {
    var id = config.nodeid+':1';
	serverStart(id);
	console.log('ledmq server is start at port: ',config.server.port );
} 
else 
{
    if (cluster.isMaster) 
	{	
        console.log("main process running: pid=" + process.pid);
        var cpus = require('os').cpus().length
        var procs = Math.ceil(0.8 * cpus)
		
        for (var i = 0; i < procs; i++) 
			cluster.fork();
        
		cluster.on("exit", function (worker, code) {
            if (code != 0) {
                console.log('Worker %d died :(', worker.id);
                cluster.fork();
            }
        });		
    } 
	else 
	{
		var id = config.nodeid+':'+cluster.worker.id;
		serverStart(id);
        console.log('ledmq server is start at port: ',config.server.port,'worker pid ' + cluster.worker.id  );
    }
}

