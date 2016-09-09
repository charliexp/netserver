var net   = require('net');
var xxtea = require('../lib/xxtea.js'); 

var HOST = '127.0.0.1';
var PORT = 5000;
var timerHandle;

function buildpacket( )
{
    var b = new Buffer(xxtea.encrypt('0123456789:920','4567')).toString('base64');        
    var info = 'ver: 1.0.0,type:EX-6CN,token:'+b+',did:115C269000,gid:0001';

    var head =new Buffer(10);
    var body =new Buffer(info);
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
    head[9] = 0x01;
    packet.push(head);
    packet.push(body);

    return Buffer.concat( packet, head.length+body.length);
}

var client = new net.Socket();
client.connect(PORT, HOST, function() {

    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
    var senddata = buildpacket();
    console.log(senddata);
    client.write( senddata );
    // �������Ӻ�������������������ݣ����������յ���Щ���� 
	//timerHandle = setInterval(timerCallBack, 3000);
    
});

// Ϊ�ͻ�����ӡ�data���¼�������
// data�Ƿ��������ص�����
client.on('data', function(data) {

   // console.log('DATA: ' + data);
   console.log('rev data: ',data);
});

// Ϊ�ͻ�����ӡ�close���¼�������
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
}

