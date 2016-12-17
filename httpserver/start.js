/*************************************************************************\
 * File Name    : start.js                                               *
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

var app    = require('./app.js');
var loader = require('../lib/conf-loader.js');
var config = loader.readConfigFile('./etc/config.yml','httpserver');

app.listen(config.port);
console.log( 'http server is start with port ' + config.port);
