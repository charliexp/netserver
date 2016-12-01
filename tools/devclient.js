var net      = require('net');
var util     = require('util');
var events   = require('events');
var sync     = require('simplesync');
var crypto   = require('crypto'); 
var tlv      = require('../lib/tlv.js');
var protocol = require('../lib/protocol.js');

var TLV         = tlv.TLV;
var HOST        = '114.215.236.92';
var PORT        = 9090;
var timerHandle = [];
var pending     = null;
var pktlength   = 0;


var prefixInteger = function (num, n) 
{
    return (Array(n).join(0) + num).slice(-n);
}

    
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

//////////////////////////////////////////////////////////////////////////
function p( callback ) {
       
    sync.block(function() {
           
        devid = prefixInteger(1,10);
        console.log('dev connected ok, id: ',devid);
        var result = sync.wait( callback( devid, sync.cb("user") ) );
        var dly    = sync.wait( delay( 1, sync.cb("delay") ) );
    });
}

///////////////////////////////////////////////////////////////////////////    
function buildpacket(sno, cmd,data)
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
    //head[6] = getSno();         //0x00;
    //head[7] = (getSno()>>8);    //0x00;
    head[6] = sno;         //0x00;
    head[7] = (sno>>8);    //0x00;
    head[8] = 0x01;
    head[9] = cmd;
    packet.push(head);
    packet.push(body);

    return Buffer.concat( packet, head.length+body.length);
}

///////////////////////////////////////////////////////////////////////////////////
function buildpacketAck(sno,cmd,ret)
{
    var head =new Buffer(10);
    var body =new Buffer([ret]);
    var packet = [];

    head[0] = 0xAA;
    head[1] = 0x55;
    head[2] = 0xFF;
    head[3] = 0xFF;
    head[4] = 5;
    head[5] = 0;
    head[6] = sno; //getSno();         //0x00;
    head[7] = sno>>8; //(getSno()>>8);    //0x00;
    head[8] = 0x01;
    head[9] = cmd;
    packet.push(head);
    packet.push(body);

    return Buffer.concat( packet, head.length+body.length);
}

//////////////////////////////////////////////////////////////////////////////////
var delay = function(t,callback)
{
     setTimeout(function(){
        callback('ok');
        },t);
}
/////////////////////////////////////////////////////////////////////
function StreamParse(client) {
    this.pending = null;
     events.EventEmitter.call(this);
     var self = this;
     client.on('data', function(data) {
        self.parse( data );
     });
     
}
util.inherits(StreamParse, events.EventEmitter);

////////////////////////////////////////////////////////////////////
StreamParse.prototype.parse = function( buff )
{
    if ( this.pending === null ) {
		this.pending = buff;
	} else {
		this.pending = Buffer.concat([ this.pending, buff ]);
	}
    if( this.pending === null )
        return;
    
    if( this.pending.length >= 2 )
    {
        if( 0x55BB === this.pending.readUInt16LE(0) ){
          
            this.pending = this.pending.slice( 2 );
            if( this.pending.length === 0 ){         
                this.pending = null;
                return;
            }                
        }
    }
    
    if( (this.pending === null) || (this.pending.length < 10) ){
        return;
    }  
    do{   
            if( 0x55AA !== this.pending.readUInt16LE(0) ){
                this.pending = this.pending.slice( 2 );
            }
            else{
                break;
            }
            if(this.pending.length < 10)
                return;                
    }while(1);  

    var pktlength = this.pending.readUInt16LE(0 + 4); 
    
    pktlength += 6; 
        
    if( pktlength < 10  ) 
    {
        this.pending = null; 
        return;
    }
    if (this.pending.length >= pktlength) {
        var tmp = this.pending.slice( 0, pktlength );
        this.pending = this.pending.slice( pktlength );
        this.emit('data', tmp );
        
        if (this.pending.length > 0){ 
            this.parse( new Buffer([]) );
        }
        else{
            this.pending = null;
        }
    }
}
///////////////////////////////////////////////////////////////////////
var sendloginPacket =function( client, devid, rid )
{
    b = makeMD5encrypt( devid+':0123456789:'+rid );    
    info  = 'ver:1.0.0,type:EX-6CN,token:'+b+',did:'+devid+',gid:0,heat:120,tzone:+8';
    var loginData    = new TLV( 0x02, new Buffer(info) );
    var loginEncode  = loginData.encode();
        
    var senddata = buildpacket(getSno(),0x01,loginEncode);
    console.log('sendloginPacket',senddata);
    client.write( senddata );
}
//////////////////////////////////////////////////////////////////////
function reqPacket( sno,tid, rid, spid, pcnt )
{
    var reqdata    = new Buffer(28); 
    var serverType = 0;
    var tab        = [];     
        
    for( var i =0; i< rid.length; i+=2 )
    {
        tab.push(parseInt(rid.slice(i,i+2),16));
    }
    var rid = new Buffer(tab);
    reqdata.writeUInt8( serverType,0 );
    reqdata.writeUInt32LE( tid,1 );
    rid.copy( reqdata, 5 );
    reqdata.writeUInt16LE( spid,25 );
    reqdata.writeUInt8( pcnt,27 );
    var timeData    = new TLV( 0x23, reqdata );
    var dataEncoded = timeData.encode();
    var senddata    = buildpacket( sno,0x03, dataEncoded );
    return senddata;    
   // client.write( senddata );
}
    
var clientProcess = function( devid, callback)
{
    this.timer      = null;
    self            = this;
    this.devdwObj   = null;
    var client      = new net.Socket();
    this.streamParse = new StreamParse(client);
    
    client.connect(PORT, HOST, function() {

        console.log('CONNECTED TO: ' + HOST + ':' + PORT);
        var data         = new Buffer([]);
        var tlvGetRid    = new TLV( 0x01, data );
        var GetRidEncode = tlvGetRid.encode();
    
        var senddata = buildpacket(getSno(),0x01,GetRidEncode);
        console.log(senddata);
        client.write( senddata );
       
        setTimeout(function(){
            self.timer    = setInterval(sendHeatPacket, 30000);
        },2000);
        
        callback(client);
    });
    self.streamParse.on('data',function( msg ){

            var msgObj = protocol.decode( msg );

            if(msgObj.cmd === 0x81){
                var body = protocol.getbody(msg);
                if(body.length >= 2){
                    var rid = protocol.getbody(msg).readUInt16LE(2).toString();
                    console.log('rid-->: ',rid);
                    sendloginPacket(client,devid,rid);
                }
            }
            else if(msgObj.cmd === 0x83)
            {
                if( self.devdwObj === null ){
                    console.log('************************',msg.length,msg );
                }
                if( (self.devdwObj)&&(msgObj.sno === self.devdwObj.sno) )
                {
                   // console.log('devid: %s length: %d rev data: ',devid,msg.length,msg );
                   console.log('req Ack->devid:%s,len:%s,sno:%s,cnt:%s ',devid ,msg.length, self.devdwObj.sno,self.devdwObj.spid+self.devdwObj.indx);
                    self.devdwObj.indx++;
                    if( (self.devdwObj.indx >= self.devdwObj.pcnt)||(self.devdwObj.maxpkts < self.devdwObj.pcnt) ){
                        self.devdwObj.sno++;
                        self.devdwObj.indx = 0;
                        self.devdwObj.spid += self.devdwObj.pcnt;
                        if( self.devdwObj.spid >= self.devdwObj.maxpkts )
                        {
                        
                            console.log('&&&&&&&=========================&&&&&&');
                            var sendmsg = reqPacket( self.devdwObj.sno++, 
                                         self.devdwObj.tid, 
                                         self.devdwObj.rid, 
                                         self.devdwObj.spid+1, 
                                         1 );
                            client.write( sendmsg );  
                        
                            self.devdwObj = null;
                        }
                        else
                        {
                            if( self.devdwObj )
                            {
                                console.log('req: ',devid ,self.devdwObj.sno,self.devdwObj.spid);
                                var sendmsg = reqPacket( self.devdwObj.sno, 
                                                    self.devdwObj.tid, 
                                                    self.devdwObj.rid, 
                                                    self.devdwObj.spid, 
                                                    self.devdwObj.pcnt );
                                client.write( sendmsg );        
                            }
                        }
                    }    
                }
            }
            else  if(msgObj.cmd < 0x80 )
            {               
                var body   = protocol.getbody(msg);
                var result = tlv.parseAll( body );
   
                console.log('tlv decode data: ',result[0].tag,result[0].value ); 
                if( result[0].tag === 0x22 )
                {
                    var resData = result[0];
                    if( resData.value.length < 28 ) return null;
    
                    var requstType = resData.value.readUInt8(0);
                    
                    if( requstType === 1 )
                    {
                        var taskId     = resData.value.readUInt32LE(1);
                        var resourceId = resData.value.slice( 5, 25 ).toString('hex');
                        var maxpkts    = resData.value.readUInt16LE(25);
                        var pktid      = resData.value.readUInt8(27);
                        self.devdwObj = {
                               tid    : taskId,
                               rid    : resourceId,
                               maxpkts: maxpkts,
                               pid    : pktid,
                               sno    : 0,
                               spid   : 0,
                               pcnt   : 4,
                               indx   : 0                               
                        };
                        console.log('&&&&&&&=========================&&&&&&');
                        console.log('rid: %s,maxpkts: %d,programid: %d ', resourceId, maxpkts, pktid); 
                        
                        var senddata = buildpacketAck(msgObj.sno, msgObj.cmd|0x80,0 );
                        client.write( senddata ); 
                
                        if( self.devdwObj )
                        {
                            console.log('req: ',devid ,self.devdwObj.sno,self.devdwObj.spid);
                            var sendmsg = reqPacket( self.devdwObj.sno, 
                                                    self.devdwObj.tid, 
                                                    self.devdwObj.rid, 
                                                    self.devdwObj.spid, 
                                                    self.devdwObj.pcnt );
                            client.write( sendmsg );        
                        }                                                                                 
                    }
                }
                else
                {
                    var senddata = buildpacketAck(msgObj.sno, msgObj.cmd|0x80,0 );
                    client.write( senddata );  
                }    
            }
            
    });
    client.on('close', function() {
        console.log('Connection closed');
        clearInterval(self.timer);
    });

    client.on('error', function(e) {
        console.log('Connection error',e);
        process.exit(0);
    });
    function sendHeatPacket()
    {	
        var data = new Buffer([0xBB,0x55]);
        console.log('[%s] send data: ',devid,data);
        client.write( data );
    }
}

////////////////////////////////////////////////////////////////////////////////
console.log('+++++++++++++++++++++++++++++++++++++++++');
console.log('                                         '); 

read( 'input>',clientProcess );

//p(clientProcess);

