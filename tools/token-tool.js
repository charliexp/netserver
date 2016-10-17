
var conf   = require('./tokenConfig.js');
var mqtt   = require('mqtt');
var axon   = require('axon');
var rpc    = require('axon-rpc');
var req    = axon.socket('req');

var client = new rpc.Client(req);
///////////////////////////////////////////////////////////////////////////
req.connect( 6000,'127.0.0.1' );  

var url = 'mqtt://test1:test1@127.0.0.1:1883';   
var cnt = 0;
var settings = {
    keepalive       : 10,
    protocolId      : 'MQTT',
    protocolVersion : 4,
    reconnectPeriod : 1000,
    connectTimeout  : 60 * 1000,
    clean: true
};
    
var mqttclient = mqtt.connect(url,settings);  

mqttclient.on('connect', function(topic, message){
    
    for( var i=0; i< conf.length; i++ )
    {
        client.call('setDevToken', conf[i].gid,conf[i].token,function(err, data){       
            console.log( data );          
        });
    }
    mqttclient.publish( 'CONFIG/update/token', '' );
    mqttclient.end();
});
	
///////////////////////////////////////////////////////////////////////////
