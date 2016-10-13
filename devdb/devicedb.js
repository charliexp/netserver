/*************************************************************************\
 * File Name    : devicedb.js                                            *
 * --------------------------------------------------------------------- *
 * Title        :                                                        *
 * Revision     : V1.0                                                   *
 * Notes        :                                                        *
 * --------------------------------------------------------------------- *
 * Revision History:                                                     *
 *   When             Who         Revision       Description of change   *
 * -----------    -----------    ---------      ------------------------ *
 * 2-15-2016      charlie_weng     V1.0          Created the program     *
 *                                                                       *
\*************************************************************************/
'use strict';

var axon   = require('axon');
var rpc    = require('axon-rpc');
var debug  = require('debug')('ledmq:devdb');
var rep    = axon.socket('rep');
var config = require('../config.js');

var devStats = {};
var devToken = {};

var server = new rpc.Server(rep);

rep.bind(config.rpcserver.port);


server.expose({
  getNodeId:function( did, fn ){ 

              var nodeid = '';
              
              if( devStats[ did ] )
              {   
                 nodeid = devStats[ did ].nodeid;           
              }
              fn( null, nodeid );
   },
  putDevice: function( did, devInfo, fn ){ 
              devStats[ did ] = devInfo;
              fn( null, 'ok' );
  },
  delDevice: function( did, fn ){ 
              delete  devStats[ did ];
              fn( null, 'ok' );
  },
  getDevToken: function( fn ){ 
              var data = {index: [], items: {}};
				      for( var p in devToken ){
					          data.index.push(p);
					          data.items[i] = devToken[p];
				      }
              fn( null, data );
  },
  setDevToken: function( gid, token, fn ){ 
          
               debug('set Device token',gid,token);
               if( gid && token ){ 
                    devToken[ gid ] = token;
                    fn( null, 'ok' );
               }
               else
               {
                    fn( 'err', null );
               }
  },
  getAllDev: function( fn ){ 
              var data = {index: [], items: {}};
				      for( var p in devStats ){
					          data.index.push(p);
					          data.items[p] = devStats[p];
				      }
              fn( null, data );
  }
});

/*
rep.on('message', function(msg, reply){
  
    if( msg  ){
        switch( msg.cmd )
        {
            case 'getNodeId':
             
              var nodeid = '';
              
              if( devStats[ msg.did ] )
              {   
                 nodeid = devStats[ msg.did ].nodeid;           
              }
              reply( { nodeid:nodeid} );
              break;
              
            case 'setDevice':
            
              devStats[ msg.did ] = msg.data;
              reply({ cmd: 'ok' });
              break;    
              
            case 'delDevice':
            
              delete  devStats[ msg.did ];
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

            case 'setDevToken':
            
               debug('set Device token',msg.gid,msg.token);
               if( msg.gid && msg.token ){ 
                    devToken[ msg.gid ] = msg.token;
                    reply({ cmd: 'ok' }); 
               }
               else
               {
                    reply({ cmd: 'fail' }); 
               }
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
*/