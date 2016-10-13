var axon   = require('axon');
var req    = axon.socket('req');
var rpc    = require('axon-rpc');
var client = new rpc.Client(req);
///////////////////////////////////////////////////////////////////////////
req.connect( 6000,'127.0.0.1' );  


///////////////////////////////////////////////////////////////////////////////
client.call('getAllDev',function(err, data){      
        
    if( data.index.length > 0 )
    {
        for( var i = 0; i < data.index.length; i++ )
        {
            console.log( 'KEYS:%s : DATA: ',data.index[i], JSON.stringify(data.items[data.index[i]]) );
        }
    }           
 });