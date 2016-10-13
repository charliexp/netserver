
var conf   = require('./tokenConfig.js');
var axon   = require('axon');
var rpc    = require('axon-rpc');
var req    = axon.socket('req');

var client = new rpc.Client(req);
///////////////////////////////////////////////////////////////////////////
req.connect( 6000,'127.0.0.1' );  

///////////////////////////////////////////////////////////////////////////
for( var i=0; i< conf.length; i++ )
{
    client.call('setDevToken', gid,token,function(err, data){       
        console.log( data );          
    });
}