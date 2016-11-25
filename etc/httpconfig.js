﻿/*************************************************************************\
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
    devicerpc  : {ip:'127.0.0.1',port:6000},
    port       : 9080,                         			    // 本服务端口
    user       : 'admin',
    passwd     : '123456',   
    whitelist  : ['0.0.0.0/0', '::ffff:127.0.0.1']            // ip白名单
};