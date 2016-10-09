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

var net     = require('net');
var manager = require('./src/manager.js');
var debug   = require('debug')('ledmq:app');
var config  = require('../config.js');
var cluster = require('cluster');
var storage = require('./lib/storage.js');

var netmanger   = manager.create();
//////////////////////////////////////////////////////////////////////////
var serverStart = function( id )
{
    netmanger.setServerId( id );

    netmanger.on('message', function( topic, message ){
        //var device = { cmd:'kick',did:loginInfo.did };
        var msgroute = topic.split('/');
        if( !msgroute ) return;
        if( msgroute[0]=== 'SYSTEM' ){
            
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
            // ID/nodeid/in/ledmq/cmd/dev/${devId}
            // ID/nodeid/in/ledmq/msgdw/dev/${devId}
            // ID/nodeid/in/ledmq/res/dev/${devId}
           if( msgroute.length >= 7 )
           {
                if( msgroute[3] === 'ledmq' ){
                    var deviceId = msgroute[6];
                    var cmd      = msgroute[4];
                    switch( cmd )
                    {
                        case 'res':
                        case 'msgdw':
                        case 'cmd':
                            netmanger.send( deviceId, message );
                            debug(' send data to dev -> %s ', deviceId ); 
                            break;                    
                    }
                }                     
           }
        }     
    });
    netmanger.on('connect', function(){
        var topic     = 'ID/'+id + '/in/#';
        var systopic  = 'SYSTEM/' + id + '/notify';
        
        netmanger.subscribe( topic );
        netmanger.subscribe( systopic );
    });
    netmanger.on('error', function(err){

    });
    
    netmanger.devInfoClear();
    
    var server = net.createServer( function (socket) {

        netmanger.accept(socket);
    });
    server.listen( config.server.port );
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

