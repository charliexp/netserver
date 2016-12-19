/*************************************************************************\
 * File Name    : centdb.js                                              *
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
var debug   = require('debug')('ledmq:centdb');
var SSDB    = require('../lib/SSDB.js');
var loader  = require('../lib/conf-loader.js');
var config  = loader.readConfigFile('./etc/config.yml');
var ssdb    = SSDB.connect(config.storage.ip, config.storage.port, connectCallBack); 

/////////////////////////////////////////////////////////////////////
function connectCallBack(err){	
	if(err){
		console.log( 'ssdb state : ' + err );
		return;
	}
	debug('ssdb connected');
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
function checkResExists( resmd5, fn )
{
    ssdb.hsize( resmd5, function (err,size) {
		fn( err, size );    // if size === 0  resource no exists 
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
    putdata       : putdata,
    getdata       : getdata,
    deldata       : deldata,
    checkResExists: checkResExists,
    getResIdMD5   : getResIdMD5,
    setResIdMD5   : setResIdMD5
};


    