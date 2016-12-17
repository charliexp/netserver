/*************************************************************************\
 * File Name    : log.js                                                 *
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
var log4js = require("log4js");
var loader = require('../lib/conf-loader.js');
var config = loader.readConfigFile('./etc/config.yml','logger');

//////////////////////////////////////////////////////////////////////////
log4js.configure(config);
var logger = log4js.getLogger('log');

// api
// logger.trace(str);
// logger.debug(str);
// logger.info(str);
// logger.warn(str);
// logger.error(str);

module.exports = logger;

