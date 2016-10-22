/*************************************************************************\
 * File Name    : lvFrames.js                                            *
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
var debug    = require('debug')('ledmq:frames');


/*************************************************************************\
 *                                                                       *
 *                  Function name   : lv protocol                        *
 *                                                                       * 
\*************************************************************************/
function prase( data )
{
	if( !Buffer.isBuffer(data) ){
		return null; 
	}	
	var len  = data.readUInt32LE(0);	
	var head = data.slice( 4, 4+len );
	var ids  = head.toString().split(',');
    debug( "ids: "+ids );
    
	var body = data.slice( 4+len );
	    len  = body.readUInt32LE( 0 );	
	debug( "body len : "+len );
    
	var  offset  = 0;	
	var  packets = [];
	
	do{	
		var lvlen  = body.readUInt16LE( offset+4 );
		debug( "lv len : "+lvlen );
		var packet   = body.slice( 6+offset, lvlen+6+offset );
		debug( "lv packet : "+packet.toString('hex') );
		packets.push( packet );
		offset = offset + lvlen + 2;
        
	}while( len > offset );
	
	return { ids:ids, data:packets }; 	
}

/////////////////////////////////////////////////////////////////////////////
exports.prase  = prase;


