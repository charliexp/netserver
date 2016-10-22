/*************************************************************************\
 * File Name    : func.js                                                *
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
var crypto    = require('crypto'); 

password_md5 = function( password )
{
    var md5 = crypto.createHash('md5');
    var ret = md5.update( password).digest('hex');
    return ret;
}

check_auth = function( md5pwd, ts )
{
    var md5 = crypto.createHash('md5');
	var ret = md5.update( md5pwd+':'+ts ).digest('hex');
        
    return ret;
}

check_token = function( password, ts )
{
    return check_auth(password_md5(password),ts);
}

exports.password_md5 = password_md5;
exports.check_auth   = check_auth;
exports.check_token  = check_token;