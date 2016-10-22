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
    port     : 8080,  
    db_url   : { 
                    user    : 'sa',
                    pwd     : '123456',
                    ip      : '115.29.240.71', 
                    port    : 19990,
                    database: 'gprs_mqtt' 
                },                                         // 设备服务器地址  
    mindbpool: 2,
    maxdbpool: 100,
    poollog  : true,     
    debug    : true,                         			   // 生产环境下需设置为false
    v        :'1.0.0',                                     // version 
    appName  :'dbAPIServer',                               // app name
    httpuser : 'admin', 
    httppwd  : '123456',     
    whitelist:['0.0.0.0/0', '::ffff:127.0.0.1']            // ip白名单
};