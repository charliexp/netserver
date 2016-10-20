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
    }
};

