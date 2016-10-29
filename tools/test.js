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