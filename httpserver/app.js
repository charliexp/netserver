/*************************************************************************\
 * File Name    : app.js                                                 *
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

var express    = require('express');
var bodyParser = require('body-parser');
var config     = require('../etc/httpconfig.js');
var basicAuth  = require("basic-auth");
var app        = express();

///////////////////////////////////////////////////////////////////////////
var auth = function(req, resp, next) {
    
    function unauthorized(resp) { 
        console.log("basic auth...")
        resp.set('WWW-Authenticate', 'Basic realm=Input User&Password');
        return resp.sendStatus(401);
    }

    var user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
        return unauthorized(resp);
    }

    if (user.name === config.user && user.pass === config.passwd ) {
        return next();
    } else {
        console.log("not login.")
        return unauthorized(resp);
    }
};

///////////////////////////////////////////////////////////////////////////
function defaultContentTypeMiddleware(req, res, next) {
    req.headers['content-type'] = req.headers['content-type'] || 'application/json';
    next();
}

app.use( defaultContentTypeMiddleware );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({ extended: false }) );

///////////////////////////////////////////////////////////////////////////
app.all('*', auth, function (req, res, next) {
    
    if (!req.get('Origin'))  return next();
    
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.set('Access-Control-Allow-Headers', 'U-ApiKey, Content-Type');
  //res.set('Access-Control-Allow-Max-Age', 3600);
    
    if ('OPTIONS' == req.method) 
		return res.status(200).end();
    next();
});

if (config.whitelist[0] != '0.0.0.0/0') {
    
    var ipfilter = require('express-ipfilter');
    var setting  = { mode: 'allow', log: false, errorCode: 403, errorMessage: '' };
    app.use(ipfilter(config.whitelist, setting));
}

var device = require('./device.js');
app.use('/devices', device );

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err    = new Error('Not Found');
    err.status = 404;
    next(err);
});

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({ ok: 0, n: 0, err: err.message });
});

module.exports = app;
