var net   = require('net');
//var xxtea = require('../acceptor/lib/xxtea.js'); 
var sync  = require('simplesync');
var crypto   = require('crypto'); 

var HOST = '127.0.0.1';
var PORT = 5000;
var timerHandle = [];

var getRid = function(){
    return prefixInteger(crypto.randomBytes(2).readUIntLE(0, 2),4); 
}

var getSno = function(){
    return crypto.randomBytes(2).readUIntLE(0, 2); 
}


var makeMD5encrypt = function( str )
{				
    var md5     = crypto.createHash('md5');
    var string  = md5.update( str ).digest('hex');
    return string;
}

var devid = '115C269000';
var rid;   
var b;           
var info;  

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
                var dly    = sync.wait( delay( 1, sync.cb("delay") ) );
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
    head[4] = data.length+4;
    head[5] = ((data.length+4)>>8)
    head[6] = getSno();         //0x00;
    head[7] = (getSno()>>8);    //0x00;
    head[8] = 0x01;
    head[9] = cmd;
    packet.push(head);
    packet.push(body);

    return Buffer.concat( packet, head.length+body.length);
}

function buildpacketAck(cmd,ret)
{


    var head =new Buffer(10);
    var body =new Buffer([ret]);
    var packet = [];

    head[0] = 0x55;
    head[1] = 0xAA;
    head[2] = 0xFF;
    head[3] = 0xFF;
    head[4] = 5;
    head[5] = 0
    head[6] = getSno();         //0x00;
    head[7] = (getSno()>>8);    //0x00;
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
    this.settimer = null;
    self = this;
    var client = new net.Socket();
    client.connect(PORT, HOST, function() {

        console.log('CONNECTED TO: ' + HOST + ':' + PORT);
          
        rid   = getRid();
        b     = new Buffer( makeMD5encrypt( '0123456789:'+rid ) );        
        info  = 'ver: 1.0.0,type:EX-6CN,token:'+b+',did:'+devid+',rid:'+rid+',gid:0000,heat:120';

        var senddata = buildpacket(0x01,info);
        console.log(senddata);
        client.write( senddata );
  
        setTimeout(function(){
            self.timer    = setInterval(timerCallBack, 30000);
            self.reqtimer = setInterval(reqPacketCallBack, 10000);
            self.settimer = setInterval(setPacketCallBack, 5000);
        },2000);
        
        callback(client);
    });

    client.on('data', function(data) {
        console.log('devid: %s rev data: ',devid,data );
    });

    client.on('close', function() {
        console.log('Connection closed');
        clearInterval(self.timer);
         clearInterval(self.reqtimer);
          clearInterval(self.settimer);
    });

    client.on('error', function() {
        console.log('Connection error');
        process.exit(0);
    });
    function timerCallBack()
    {	
        var data = new Buffer([0x55,0xBB]);
        console.log('[%s] send data: ',devid,data);
        client.write( data );
    }
    function reqPacketCallBack()
    {	
       var senddata = buildpacket(0x83,info);
      // console.log('[%s] set ',devid);
       client.write( senddata );
    }
    
    function setPacketCallBack()
    {
        var senddata = buildpacketAck(0x82,0);
        client.write( senddata );
    } 
}


////////////////////////////////////////////////////////////////////////////////
console.log('+++++++++++++++++++++++++++++++++++++++++');
console.log('                                         '); 

read( 'input>',clientProcess );
