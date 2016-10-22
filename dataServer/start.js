/*************************************************************************\
 * File Name    : start.js                                               *
 * --------------------------------------------------------------------- *
 * Title        :                                                        *
 * Revision     : V1.0                                                   *
 * Notes        :                                                        *
 * --------------------------------------------------------------------- *
 * Revision History:                                                     *
 *   When             Who         Revision       Description of change   *
 * -----------    -----------    ---------      ------------------------ *
 * 2-15-2016      charlie_weng     V1.0          Created the program     *
 *                                                                       *
\*************************************************************************/
var cluster = require('cluster');
var config  = require('./config.js');
var app     = require('./app.js');

var ready = false;

if (config.debug) {
	console.log( '****************************************' );
	console.log( ' DB API SERVER VERSION: ' + config.v );
	console.log( '****************************************' );
    app.listen(config.port);
    console.log( config.appName + ' is start with port ' + config.port);
} 
else 
{
    if (cluster.isMaster) 
	{	
	    console.log( '****************************************' );
		console.log( ' YANSE LED SERVER VERSION: ' + config.v   );
		console.log( '****************************************' );
        
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
        app.listen(config.port);
        console.log(config.appName + ' is start with port ' + config.port + '  cluster worker pid ' + cluster.worker.id);
    }
}
