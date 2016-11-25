/*************************************************************************\
 * File Name    : config.js                                              *
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
module.exports = {
    version   : 'V1.0.0',
    debug     : false,
    sysType   : 'standalone',      // multimach 
    nodeType  : 'master' ,         // slave 
    server    : { port: 9090 },
    mqserver  : { url:'mqtt://admin:123456@127.0.0.1:2883', preTopic:'ledmq' },
    rpcserver : { ip : '127.0.0.1', port  : 6000 },
    nodeid    : 'node01', 
    ssdb      : { ip : '127.0.0.1', port  : 8888 },   	// 使用ssdb数据库
    socketMaxTimeout : 240000,
    commToken : '0123456789' 
};
