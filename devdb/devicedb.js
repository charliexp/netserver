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
var debug  = require('debug')('ledmq:devdb');
var rep    = axon.socket('rep');
var config = require('../config.js');

var devStats = {};
var devToken = {};

rep.bind(config.rpcserver.port);

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
              
            case 'putDevice':
            
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