var t = new Date();
var d = Date();
var mytime=t.toLocaleString()
console.log('time is: ', t,d,mytime );
//console.log('time is: ', t,new Date(x), new Date(time));

function calcTime(city, offset) { 
    d = new Date(); 
    utc = d.getTime() + (d.getTimezoneOffset() * 60000); 
    nd = new Date(utc + (3600000*offset)); 
    return "The local time in " + city + " is " + nd.toLocaleString(); 
} 
var zone = '-1';
console.log('time is: ', calcTime('beijing',0) );
console.log('time is: ', calcTime('beijing',zone) );


var obj ={
    0xA0:'dwsdfwdfwerfwe',
    0xB0:'cfsafsdfsdfgsdfgsd'
}
var data = new Buffer([0xA0,0x00,0x00]);

console.log('obj is',obj[data[0]]);


var string = 'get:rid';

var array = string.split(',');
console.log('test is',array);

console.log('--------------------------------------');
const buf1 = Buffer.alloc(10);
const buf2 = Buffer.alloc(14);
const buf3 = Buffer.alloc(18);
const totalLength = buf1.length + buf2.length + buf3.length;

// Prints: 42
console.log(totalLength);

const bufA = Buffer.concat([buf1, buf2, buf3], totalLength);
const bufB = Buffer.concat([buf1, buf2, buf3]);
console.log('~~~~~~~~: '+bufB.length);
