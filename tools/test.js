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
var loki    = require('lokijs'); 

//var db       = new loki('loki.json',{autosave:true}); 
var db       = new loki('loki.json'); 
var children = db.addCollection('children');

var login266 = new Buffer([0xA5,0x01,0x7B,0x23,0x00,0x68,0x03,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x48,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x47,0x50,0x52,0x53,0x33,0x30,0x30,0x32,0x36,0x36,0x64,0x04,0xAE]);
children.insert({name:'charlie', legs:8});
children.insert({name:'charlie', legs:5});
children.insert({name:'charlie', legs:6});
children.insert({name:'wang', legs:0});
children.insert({name:'zhang', legs:8});

var  v = children.get(1); 

console.log('get first item: '+v.name);
 
var v = children.find( {'name':'charlie'} );
//for(var i =0; i< v.length;i++)
//    console.log('item: '+v[i].name,v[i].legs);
console.log('get '+v[0].legs);

var v = children.findOne( {'name':'charlie'} );
console.log('get '+v.name);

console.log('--------item-----------');
var v = children.find( { legs: { '$gte' : 0 } } ); 
for(var i =0; i< v.length;i++)
    console.log('item: '+v[i].name,v[i].legs);
//console.log('get '+JSON.stringify(v));

console.log('--------addDynamicView-----------');
var legs = children.addDynamicView('legs'); 
legs.applyFind( { legs: { '$gt' : 0 } } ); 
legs.applySimpleSort('legs'); 
var v =legs.data(); 
for(var i =0; i< v.length;i++)
    console.log('item: '+v[i].name,v[i].legs);
console.log(legs.count());
legs.applyWhere(function(obj) { return obj.name === 'charlie'; });
var results = legs.data();
for(var i =0; i< results.length;i++)
    console.log('item: '+results[i].name,results[i].legs);

console.log('--------item-1111111----------');

children.findAndUpdate(
    function(obj) {
        return obj.name == 'zhang' && obj.legs >= 5;
    }, 
    function(obj) {
        return obj.legs = 4;
    }
 );
 var v = children.find( ); 
for(var i =0; i< v.length;i++)
    console.log('item: '+v[i].name,v[i].legs);

var v = children.findOne( {'name':'zhang'} );
console.log('get '+v.name,v.legs);


console.log('--------item-222222----------');

filterFunction = function(obj)
{
    return obj.legs >= 4; 
}

updateFunction = function(obj)
{
     return obj.legs = 2;
}
children.findAndUpdate( filterFunction,updateFunction );
var v = children.findOne( {'name':'charlie'} );
console.log('get '+v.name,v.legs);

console.log('--------item-33333----------');
children.removeWhere( {'name':'zhang'})
children.removeWhere( {'legs':5})
var v = children.find( );  
for(var i =0; i< v.length;i++)
    console.log('item: '+v[i].name,v[i].legs);

console.log('--------item-4444----------');
var doc = children.findOne({'name':'wang'});
//var doc = children.by('name','wang');
doc.name = "Peter";
//doc.age = 32;
//doc.gender = "male";

children.update(doc); // This line can be safely removed.
var v = children.find();
for(var i =0; i< v.length;i++)
    console.log('item: '+v[i].name);
 