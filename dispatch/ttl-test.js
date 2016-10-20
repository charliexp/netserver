 var Cache = require('./cache.js');
 var cache = new Cache({
                    ttl:      4, // Default TTL 5 minutes.
                    interval: 1,   // Clean every minute.
                    cnts:     3
                });
                
var data      = new Buffer([0,1,2,3,4,5,6,7,8]);    
var old_value = cache.set('123456', data); // Set a value (returns old)
var new_value = cache.get('123456');       // Get a value

console.log(new_value);
cache.on('expire',function(key,data){
    console.log('expire key:',key,data);
    console.log('get data:',cache.get(key));
})

cache.on('clean',function(key){
    console.log('clean key:',key);
})
    
   // values = cache.mget(key1, key2); // Get multiple values at once
   // cache.set(key, value, ttl); // Set a value, override default ttl
   // cache.del(key1, key2); // Delete one or more values at once
  //  cache.ttl(key, 3); // Change the ttl of a value (in seconds)
  //  cache.flush(); // Wipe the lot
setInterval(function(){
   //  cache.del('123456'); 
},2000);    
    