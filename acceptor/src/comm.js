'use strict';
/*************************************************************************\
 * File Name    : command.js                                             *
 * --------------------------------------------------------------------- *
 * Title        :                                                        *
 * Revision     : V1.0                                                   *
 * Notes        :                                                        *
 * --------------------------------------------------------------------- *
 * Revision History:                                                     *
 *   When             Who         Revision       Description of change   *
 * -----------    -----------    ---------      ------------------------ *
 * 9-07-2016      charlie_weng     V1.0          Created the program     *
 *                                                                       *
\*************************************************************************/
module.exports = {
    
    timestamp : function(){
        return parseInt( Date.now()/1000 );
    },
    
    makeTopic : function( type, nodeid, cmd, did ){
        
        if( !type ) 
            return null;
        if( type === 'ID' )
            return 'ID/'+ nodeid + '/in/'+ cmd +'/dev/'+ did;
        if( type === 'SYSTEM' )  //SYSTEM/nodeid/notify/kick
            return 'SYSTEM/'+ nodeid + '/notify'+ cmd;
    },
    
    splitTopic : function( topic ){
        //ID/nodeid/in/cmd/dev/${devId}
       var  msgroute = topic.split('/');
       if( !msgroute ) return null;
       
       if( msgroute[0] === 'ID' ){
            return {
                type   : msgroute[0],
                nodeid : msgroute[1],
                cmd    : msgroute[3],
                did    : msgroute[5]
            }; 
       }
       else if( msgroute[0] === 'ledmq')  //ledmq/cmd/dev/${devId}
       {
           return {
                type   : msgroute[0],
                chan   : msgroute[1],
                did    : msgroute[3]
            }; 
       }
       else if( msgroute[0] === 'CONFIG')
       {
            return {
                type   : msgroute[0],
                cmd    : msgroute[1],
                param  : msgroute[3]
            }; 
       }
       return null;
    },
    
    getTopicItems : function( topic ){
         var  items = topic.split('/');
         if( !items )
            return null;
         else
            return { 
                len   : items.length, 
                items : items 
            };
    },
    
    getLvPacketData:function( lvpacket )
    {
        if( !Buffer.isBuffer(lvpacket) ){
            return null; 
        }	
        var headlen  = lvpacket.readUInt32LE( 0 );	
        var headdata = lvpacket.slice( 4, 4 + headlen );
        var bodydata = lvpacket.slice( 4 + headlen );
        var bodylen  = bodydata.readUInt32LE( 0 );	
	
        return { len:bodylen, data:bodydata }; 	
    },
    
    makeLvPacket:function( ids, lvData )
    {
        if( !Buffer.isBuffer(lvData) ){
            return null; 
        }	    
        var devlen = new Buffer(4);  
        var head   = new Buffer(ids);
    
        devlen[0]=  (ids.length)&0x000000FF;
        devlen[1]= ((ids.length)&0x0000FF00)>> 8;
        devlen[2]= ((ids.length)&0x00FF0000)>>16;
        devlen[3]= ((ids.length)&0xFF000000)>>24;
   
        return Buffer.concat([devlen,head,lvData]); 	
    }
};

