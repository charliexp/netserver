/*************************************************************************\
 * File Name    : login.js                                              *
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
var crypto = require('crypto'); 
var zlib   = require('zlib');


var userInfo = {  
    user     : 'admin',
    password : '123456',
 }


var time = new Date().getTime();
//console.log(time);
 
var md5    = crypto.createHash('md5');
var pwdmd5 = md5.update(userInfo.password).digest('hex');
var md5    = crypto.createHash('md5');
var pwdval = md5.update(pwdmd5+':'+time).digest('hex');
var ukey;
//console.log(pwdval);


var post_data = {  
    user	: userInfo.user,   //'root',
    token 	: pwdval,
	ts		: time,
    qrytype : 'proc',
    sql     : 'web_get_list_dev',
    params  : [{name:'username',type: 1, val: 'ys0101' }]
 }
 
 /*
 var post_data = {  
    user	: userInfo.user,   //'root',
    token 	: pwdval,
	ts		: time,
    qrytype : 'proc',
    sql     : 'web_get_list_dev',
    params  : {name:'username',type: 1, val: 'ys01' }
 }
 */
 
var content = JSON.stringify(post_data);

var options = {  
    hostname: '114.215.236.92', //'114.215.236.92', //'127.0.0.1',  
    port	: 8088, //8080,  //8088,
    path	: '/api/dbsqlquery',  
    method	: 'POST',  
    headers	: {  
        'Content-Type': 'application/json' ,
        'Accept-encoding':'gzip'        
    }  
};  
	
var num = 0;
var buf = [];
var len = 0;
////////////////////////////////////////////////////////////////////// 
httpGet = function () {
    
	var req = http.request(options, function (res) {    
		console.log('STATUS: ' + res.statusCode+'\r\n');  
		console.log('HEADERS: \r\n' + JSON.stringify(res.headers)+'\r\n');   
		res.on('data', function (chunk) {  
            buf.push( chunk );
            len += chunk.length;
        });
        res.on('end', function () {  

            var packet = Buffer.concat( buf,len );
            if( options.headers['Accept-encoding'] && options.headers['Accept-encoding'] == 'gzip'){
                console.log( 'content encodeing is gzip ,unzip ...' ); 
                zlib.unzip( packet , function(err,res){  
                    console.log( 'content is: ' ); 
                    console.log(res.toString()); 
                }); 
            }else{
                console.log( packet.toString() ); 
            }
            buf =[];
            len = 0;            
        });
    });  
  
	req.on('error', function (e) {  
        console.log( 'problem with request: ' + e.message );  
	});  
  
    // write data to request body  
	req.write(content); 
	console.log( 'login token : ((user password).md5:ts).md5' ); 
	console.log( 'login: ' + content );     
	req.end();  
}

httpGet();
