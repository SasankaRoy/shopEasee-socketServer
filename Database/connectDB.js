const mongoose = require('mongoose');

mongoose.connect("mongodb://babu-E-comm:McHoTA00JN6goxAr@ac-f6afw5g-shard-00-00.ydg5kjg.mongodb.net:27017,ac-f6afw5g-shard-00-01.ydg5kjg.mongodb.net:27017,ac-f6afw5g-shard-00-02.ydg5kjg.mongodb.net:27017/?ssl=true&replicaSet=atlas-fn09mn-shard-0&authSource=admin&retryWrites=true&w=majority"
).then(() => {
    console.log('database connection established');
}).catch((error) => {
    console.error(error);
})