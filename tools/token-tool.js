
var conf   = require('./tokenConfig.js');
var axon   = require('axon');
var req    = axon.socket('req');


///////////////////////////////////////////////////////////////////////////
req.connect( 6000,'127.0.0.1' );  

///////////////////////////////////////////////////////////////////////////
for( var i=0; i< conf.length; i++ )
{
    req.send({ cmd: 'setDevToken',gid:conf[i].gid,token:conf[i].token }, function(data){    
        console.log( data );          
    });
}