/*************************************************************************\
 * File Name    : conf-loader.js                                         *
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
const yaml  = require('js-yaml');
const fs    = require('fs');
const path  = require('path')
const debug = require('debug')('ledmq:loader');

//////////////////////////////////////////////////////////////////////////
module.exports.readConfigFile = function ( filePath, item ) {
   
    const extension = path.extname( filePath );
    var   config    = null;
    
    if (extension === '.yml' || extension === '.yaml') {
        try {
            config = yaml.safeLoad( fs.readFileSync( path.resolve(filePath), 'utf8' )  );
            debug( config );
        } catch (e) {
            console.log( 'error: '+e );
        }
    }
    else if (extension === '.js'|| extension === '.json') {
        config = require( path.resolve(filePath) );
    } else {
        throw new Error(`${extension} is not supported as configuration file`);
    }
    if( config && item )
        return config[item]||null;
    else
        return config;
}
