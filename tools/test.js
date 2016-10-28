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
var tlv    = require('../acceptor/lib/tlv.js');

//var db       = new loki('loki.json',{autosave:true}); 
var db       = new loki('loki.json'); 
var children = db.addCollection('children');

var login266 = new Buffer([0xA5,0x01,0x7B,0x23,0x00,0x68,0x03,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x48,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x47,0x50,0x52,0x53,0x33,0x30,0x30,0x32,0x36,0x36,0x64,0x04,0xAE]);

var t = login266.toString('hex');
console.log('+++++++++++++++++++++++++++ ',t);

// hex string to bin 
var tab =[];
for(var i =0; i< t.length;i+=2)
{
    tab.push(parseInt(t.slice(i,i+2),16));
}
console.log('+++++++++++++++++++++++++++ ',new Buffer(tab));


 var reqdata = new Buffer(26); 
        
        
        var serverType = 0;
        var taskId     = 0x00;
        var resourceId = '12345678e10adc3949ba59abbe56e057f20f883e';
        var pktId      = 0x00;
        var pktCnt     = 0x04;
        var tab =[];
        for(var i =0; i< resourceId.length;i+=2)
        {
            tab.push(parseInt(resourceId.slice(i,i+2),16));
        }
        var rid = new Buffer(tab);
        
        reqdata.writeUInt8( serverType  ,0 );
        reqdata.writeUInt16LE( taskId  ,1 );
        rid.copy( reqdata, 3 );
        reqdata.writeUInt16LE( pktId  ,23 );
        reqdata.writeUInt8( pktCnt  ,25 );
        var TLV = tlv.TLV;
        console.log('=====================',reqdata);
        var timeData    = new TLV( 0x23, reqdata );
        var dataEncoded = timeData.encode();
        
        console.log('*****************',dataEncoded);
        result = tlv.parseAll(dataEncoded);
        console.log('+++++++++++++++',result[0].tag,result[0].value,result[0].constructed );
        

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
 