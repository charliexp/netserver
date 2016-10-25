
var debug   = require('debug')('ledmq:centdb');
var SSDB    = require('../acceptor/lib/SSDB.js');
var config  = require('../config.js');

var ssdb = SSDB.connect(config.ssdb.ip, config.ssdb.port, connectCallBack); 

/////////////////////////////////////////////////////////////////////
function connectCallBack(err){	
	if(err){
		console.log('ssdb state : ' + err);
		return;
	}
	console.log('ssdb connected');
}
////////////////////////////////////////////////////////////////////
function getResIdMD5( key, fn )
{
    ssdb.get( key, function (err,data) {
		fn(err,data);    
	});
}
////////////////////////////////////////////////////////////////////
function setResIdMD5( key, md5, ttl, fn )
{
    ssdb.setx( key,md5,ttl, function (err,data) {
		fn(err,data);    
	});
}

////////////////////////////////////////////////////////////////////
function putdata( name, key, data, fn )
{
    ssdb.hset( name, key, data, function (err) {
		fn(err);    
	});
}
////////////////////////////////////////////////////////////////////
function getdata( name, key, fn )
{
    ssdb.hget( name, key, function ( err,data ) {
							
        if (err) {
			fn( err, null );        
		} else {
			fn( null, data );
		}
	});
}
////////////////////////////////////////////////////////////////////
function deldata( name )
{
    ssdb.hclear( name, function (err) {			
        fn(err);
	});
}

module.exports ={
    putdata    : putdata,
    getdata    : getdata,
    deldata    : deldata,
    getResIdMD5: getResIdMD5,
    setResIdMD5: setResIdMD5
};


    