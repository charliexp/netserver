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
    netmanger.connectMqttServer( id,'mqtt://test1:test1@127.0.0.1:1883' );
    netmanger.on('message', function(topic, message){
         debug('===============mqtt rev msg -> %s:%s ',topic,message);
    });
    netmanger.on('connect', function(){
        var topic = 'ledmq/' + id + '/out/#';
        netmanger.mqttcli.subscribe( topic );
    });
    netmanger.on('error', function(err){

    });
    
    storage.startServerClear( id );
    
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

