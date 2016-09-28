var net   = require('net');
var xxtea = require('../acceptor/lib/xxtea.js'); 
var sync  = require('simplesync');

var HOST = '127.0.0.1';
var PORT = 5000;
var timerHandle = [];

var devid = '115C269000';
var b = new Buffer(xxtea.encrypt('0123456789:920','4567')).toString('base64');        
var info = 'ver: 1.0.0,type:EX-6CN,token:'+b+',did:'+devid+',gid:0001,heat:40';

//////////////////////////////////////////////////////////////////////////
function prefixInteger(num, n) 
{
	return (Array(n).join(0) + num).slice(-n);
}

//////////////////////////////////////////////////////////////////////////
function read( prompt, callback ) {
    
    process.stdout.write( prompt + ':' );
    process.stdin.resume();
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', function(chunk) {
        
       // process.stdin.pause();
       sync.block(function() {
           
            var inp    = chunk.split(/\s+/);
            console.log('input device id :',inp[0]);
            for( var i = 1; i<= inp[0];i++ )
            {
                devid = prefixInteger(i,10);
                console.log('dev connected ok, id: ',devid);
                var result = sync.wait( callback( devid, sync.cb("user") ) );
                var dly    = sync.wait( delay( 20, sync.cb("delay") ) );
            }
            process.stdout.write( prompt + ':' );
       });
    });
}
    
function buildpacket(cmd,data)
{


    var head =new Buffer(10);
    var body =new Buffer(data);
    var packet = [];

    head[0] = 0x55;
    head[1] = 0xAA;
    head[2] = 0xFF;
    head[3] = 0xFF;
    head[4] = info.length+4;
    head[5] = ((info.length+4)>>8)
    head[6] = 0x00;
    head[7] = 0x00;
    head[8] = 0x01;
    head[9] = cmd;
    packet.push(head);
    packet.push(body);

    return Buffer.concat( packet, head.length+body.length);
}
var delay = function(t,callback)
{
     setTimeout(function(){
        callback('ok');
        },t);
}
var clientProcess = function( devid, callback)
{
    this.timer = null;
    this.reqtimer = null;
    var client = new net.Socket();
    client.connect(PORT, HOST, function() {

        console.log('CONNECTED TO: ' + HOST + ':' + PORT);
       
        b = new Buffer(xxtea.encrypt('0123456789:920','4567')).toString('base64');        
        info = 'ver: 1.0.0,type:EX-6CN,token:'+b+',did:'+devid+',gid:0001,heat:120';
        var senddata = buildpacket(0x01,info);
        console.log(senddata);
        client.write( senddata );
  
        setTimeout(function(){
            this.timer = setInterval(timerCallBack, 30000);
            this.reqtimer = setInterval(reqPacketCallBack, 20000);
        },2000);
        
        callback(client);
    });

    client.on('data', function(data) {
        console.log('rev data: ',data);
    });

    client.on('close', function() {
        console.log('Connection closed');
        clearInterval(this.timer);
    });

    client.on('error', function() {
        console.log('Connection error');
    });
    function timerCallBack()
    {	
        var data = new Buffer([0x55,0xBB]);
        console.log('[%s] send data: ',devid,data);
        client.write( data );
    }
    function reqPacketCallBack()
    {	
       var senddata = buildpacket(0x06,info);
       client.write( senddata );
    }
}


////////////////////////////////////////////////////////////////////////////////
console.log('+++++++++++++++++++++++++++++++++++++++++');
console.log('                                         '); 

read( 'input>',clientProcess );