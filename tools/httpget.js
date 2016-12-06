/*************************************************************************\
 * File Name    : httpget.js                                             *
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
var http   = require('http');  
var zlib   = require('zlib');

/*************************************************************************\
 *                                                                       *
 *                  Function name   : httpGet                            *
 *                                                                       * 
\*************************************************************************/
httpGet = function (options,callback) {
    
    var buf = [];
    var len = 0;
	
    var req = http.request(options, function (res) {    
    
		res.on('data', function (chunk) {  
            buf.push( chunk );
            len += chunk.length;
        });
        res.on('end', function () {  
            var packet = Buffer.concat( buf,len );
            console.log( 'data size:', packet.length );
            if( options.headers['Accept-encoding'] && options.headers['Accept-encoding'] == 'gzip'){
                console.log( 'content encodeing is gzip ,unzip ...' ); 
                zlib.unzip( packet , function(err,res){               
                    callback(res);
                }); 
            }else{               
                callback(packet);
            }
            buf =[];
            len = 0;                  
        });
    });  
  
	req.on('error', function (e) {  
        console.log( 'problem with request: ' + e.message );  
	});  
	req.end();  
}
/*************************************************************************\
 *                                                                       *
 *                  Function name   : onlineDeviceGet                    *
 *                                                                       * 
\*************************************************************************/

onlineDeviceGet = function( ip,port,callback ) {
    
    var online_ids = [];
    var ids  = [];

    var options = {  
        hostname: ip, 
        port	: port, 
        path	: '/ledmq/devices',  
        method	: 'GET',  
        headers	: {  
            'Content-Type': 'application/json' ,
            'Accept-encoding':'gzip'            
        }, 
        auth : 'admin:123456'    
    };
    console.log( 'get broker online devices ...' ); 
    httpGet( options, function(data){
   
        try{
            ids = JSON.parse(data); 
            for(var p in ids)
            {
                online_ids.push( ids[p].devid );
            }
        }
        catch(e)
        {
            console.log( e ); 
        }
        callback( null,online_ids );
    });
}

/////////////////////////////////////////////////////////////////////////
onlineDeviceGet( '127.0.0.1', 9080, function(err,data){
    console.log( 'devids: ',data );
});

/////////////////////////////////////////////////////////////////////////
            
