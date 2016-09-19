var net   = require('net');
var xxtea = require('../acceptor/lib/xxtea.js'); 

var HOST = '127.0.0.1';
var PORT = 5000;
var timerHandle;

//var pending = new Buffer([0xaa,0Xbb,0xcc]);
//var buff    = new Buffer([]); 
//pending = Buffer.concat([ pending, buff ]);

//console.log('pending data: ',pending);
//pending = buff;
//console.log('pending data1: ',typeof pending === 'null');
var b = new Buffer(xxtea.encrypt('0123456789:920','4567')).toString('base64');        
var info = 'ver: 1.0.0,type:EX-6CN,token:'+b+',did:115C269000,gid:0001,heat:40';
    
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

var client = new net.Socket();
client.connect(PORT, HOST, function() {

    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
    var senddata = buildpacket(0x01,info);
    console.log(senddata);
    client.write( senddata );
    // 建立连接后立即向服务器发送数据，服务器将收到这些数据 
	timerHandle = setInterval(timerCallBack, 1);
    
});

// 为客户端添加“data”事件处理函数
// data是服务器发回的数据
client.on('data', function(data) {

   // console.log('DATA: ' + data);
   console.log('rev data: ',data);
});

// 为客户端添加“close”事件处理函数
client.on('close', function() {
    console.log('Connection closed');
	clearInterval(timerHandle);
});

client.on('error', function() {
    console.log('Connection error');
});

function timerCallBack()
{	
    var data = new Buffer([0x55,0xBB]);
    console.log('send data: ',data);
	client.write( data );
    var senddata = buildpacket(0x06,info);
    client.write( senddata );
}

