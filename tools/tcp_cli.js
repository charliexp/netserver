var net      = require('net');
var sync     = require('simplesync');
var crypto   = require('crypto'); 
var tlv      = require('../acceptor/lib/tlv.js');
var protocol = require('../acceptor/src/protocol.js');

var TLV    = tlv.TLV;
var HOST = '127.0.0.1';
var PORT = 9090;
var timerHandle = [];
var pending     = null;
var pktlength   = 0;
 
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

    head[0] = 0xAA;
    head[1] = 0x55;
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

    head[0] = 0xAA;
    head[1] = 0x55;
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

var streamParse = function( buff,callback )
{
    if ( pending === null ) {
		pending = buff;
	} else {
		pending = Buffer.concat([ pending, buff ]);
	}
    if( pending === null )
        return;
    
    if( pending.length >= 2 )
    {
        if( 0x55BB === pending.readUInt16BE(0) ){
          
            pending = pending.slice( 2 );
            if( pending.length === 0 ){         
                pending = null;
                return;
            }                
        }
    }
    
    if( (pending === null) || (pending.length < 2 + 4) ){
        return;
    }  
    do{   
            if( 0x55AA !== pending.readUInt16BE(0) ){
                pending = pending.slice( 2 );
            }
            else{
                break;
            }
            if(pending.length < 2 + 4)
                return;                
    }while(1);  

    pktlength = pending.readUInt16LE(0 + 4); 
    
    pktlength += 6; 
        
    if( pktlength < 2 + 4  ) 
    {
        pending = null; 
        return;
    }
    if (pending.length >= pktlength) {
        var tmp = pending.slice( 0, pktlength );
        pending = pending.slice( pktlength );
        callback(tmp);
        if (pending.length > 0){ 
            streamParse( new Buffer([]), callback );
        }
        else{
            pending = null;
        }
    }
}

var clientProcess = function( devid, callback)
{
    this.timer = null;
    this.reqtimer = null;
    this.settimer = null;
    this.gettimer = null;
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
            self.gettimer = setInterval(getPacketCallBack, 15000);
            
        },2000);
        
        callback(client);
    });

    client.on('data', function(data) {
        console.log('devid: %s length: %d rev data: ',devid,data.length,data );
        streamParse( data, function( msg ){
            
            var msgObj = protocol.decode( msg );
            if(msgObj.cmd < 0x80 ){
                var senddata = buildpacketAck( msgObj.cmd|0x80,0 );
                client.write( senddata );
            }
        });

    });

    client.on('close', function() {
        console.log('Connection closed');
        clearInterval(self.timer);
        clearInterval(self.reqtimer);
        clearInterval(self.settimer);
        clearInterval(self.gettimer);  
    });

    client.on('error', function() {
        console.log('Connection error');
        process.exit(0);
    });
    function timerCallBack()
    {	
        var data = new Buffer([0xBB,0x55]);
        console.log('[%s] send data: ',devid,data);
        client.write( data );
    }
    function reqPacketCallBack()
    {
        var reqdata = new Buffer(26); 
        
        var serverType = 0;
        var taskId     = 0x00;
        var resourceId = '12345678e10adc3949ba59abbe56e057f20f883e';
        var pktId      = 0x00;
        var pktCnt     = 0x04;
        var tab =[];
        for(var i =0; i< resourceId.length;i+=2)
        {
            tab.push(parseInt(resourceId.slice(i,i+2),16));
        }
        var rid = new Buffer(tab);
        
        reqdata.writeUInt8( serverType,0 );
        reqdata.writeUInt16LE( taskId,1 );
        rid.copy( reqdata, 3 );
        reqdata.writeUInt16LE( pktId,23 );
        reqdata.writeUInt8( pktCnt,25 );
        
        var timeData    = new TLV( 0x23, reqdata );
        var dataEncoded = timeData.encode();
       //var senddata = buildpacket(0x03,new Buffer([0x23,0x0B,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0,0,4]));
        var senddata = buildpacket( 0x03, dataEncoded );
       // console.log('[%s] set ',devid);
        client.write( senddata );
    }
    
    function setPacketCallBack()
    {
       // var senddata = buildpacketAck(0x82,0);
       // client.write( senddata );
    } 
    function getPacketCallBack()
    {	
       var senddata = buildpacket(0x83,info);
      // console.log('[%s] set ',devid);
       client.write( senddata );
    }
}


////////////////////////////////////////////////////////////////////////////////
console.log('+++++++++++++++++++++++++++++++++++++++++');
console.log('                                         '); 

read( 'input>',clientProcess );
