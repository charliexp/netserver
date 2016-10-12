/*************************************************************************\
 * File Name    : spawn.js                                               *
 * --------------------------------------------------------------------- *
 * Title        :                                                        *
 * Revision     : V1.0                                                   *
 * Notes        :                                                        *
 * --------------------------------------------------------------------- *
 * Revision History:                                                     *
 *   When             Who         Revision       Description of change   *
 * -----------    -----------    ---------      ------------------------ *
 * 12-23-2015      charlie_weng     V1.0          Created the program     *
 *                                                                       *
\*************************************************************************/

var cp      = require('child_process');

var workers = [];

///////////////////////////////////////////////////////////////////////////
function spawn(server) { 
    //�����ػ�������IPCͨ����˫��ͨ��

    var worker = cp.spawn('node', [ server ], {
      stdio: [ 0, 1, 2, 'ipc']
    });
	
    //�����ӽ��̣��������ʱ����
    worker.on('exit', function(code) {
        if(code !== 0) {           
          console.log('worker is shut down, restarting...');
          spawn(server);//��������
        };
    });
    //�յ��ӽ�����Ϣ
    worker.on('message', function(msg) {
        console.log(msg);
    });
    workers.push(worker);
};

///////////////////////////////////////////////////////////////////////////
function exec(module) { 

    var execp = cp.exec( module, function(err, stdout, stderr) {
        console.log(stdout);
    });
    return execp;
}

/////////////////////////////////////////////////////////////////////////// 
function main() {
    
    spawn( './mqttserver/mqttsv.js' );
    spawn( './devdb/devicedb.js' );
    spawn( './acceptor/app.js' );
    spawn( './dispatch/dispatch.js' );
   
    process.on('SIGTERM', function() {
        for(var i = 0; i< workers.length;i++)
            workers[i].kill();
        process.exit(0);
    });
};

////////////////////////////////////////////////////////////////////////// 
main();

