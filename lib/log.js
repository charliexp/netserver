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
var config = require("../etc/logconf.js");

//////////////////////////////////////////////////////////////////////////
log4js.configure(config);
var loger = log4js.getLogger('log');

//loger.trace('This is a Log4js-Test');
//loger.debug('We Write Logs with log4js');
//loger.info('You can find logs-files in the log-dir');
//loger.warn('log-dir is a configuration-item in the log4js.json');
//loger.error('In This Test log-dir is : \'./logs/log_test/\'');

module.exports = loger;

