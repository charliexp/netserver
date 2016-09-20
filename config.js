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
    debug     : true,
    server    :{port: 5000},
    nodeid    :'acceptor001', 
    ssdb      :{ip : '127.0.0.1', port  : 8888 },   	// 使用ssdb数据库
    onlineTab :'devonline',
    commToken :'0123456789' 
};