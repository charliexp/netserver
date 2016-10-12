var axon   = require('axon');
var req    = axon.socket('req');


///////////////////////////////////////////////////////////////////////////
req.connect( 6000,'127.0.0.1' );  


///////////////////////////////////////////////////////////////////////////////
req.send({ cmd: 'getAllDev' }, function(data){
        
        if( data.index.length > 0 )
        {
            for( var i = 0; i < data.index.length; i++ )
            {
                console.log( 'KEYS:%s : DATA: ',data.index[i], JSON.stringify(data.items[data.index[i]]) );
            }
        }           
 });