
var axon   = require('axon');
var debug  = require('debug')('ledmq:devdb');
var rep    = axon.socket('rep');
var config = require('../config.js');

var devStats = {};
var devToken = {};

rep.bind(config.rpcserver.port);

rep.on('message', function(msg, reply){
   
    console.log('requested: %j', msg);
    var obj = msg;
    
    if( obj  ){
        switch( obj.cmd )
        {
            case 'getNodeId':
             
              var nodeid = '';
              
              if( devStats[ obj.did ] )
              {   
                 nodeid = devStats[ obj.did ].nodeid;           
              }
              reply( { nodeid:nodeid} );
              break;
              
            case 'putDevice':
            
              devStats[ obj.did ] = obj.data;
              reply({ cmd: 'ok' });
              break;    
              
            case 'delDevice':
            
              delete  devStats[ obj.did ];
              reply({ cmd: 'ok' });
              break;  
              
            case 'getDevToken':
               var data = {index: [], items: {}};
				for( var p in devToken ){
					data.index.push(p);
					data.items[i] = devToken[p];
				}
                reply(data); 
              break;    
              
            case 'getAllDev':
            
                var data = {index: [], items: {}};
				for( var p in devStats ){
					data.index.push(p);
					data.items[p] = devStats[p];
				}
                reply(data);
              break;              
        }   
    } 
});