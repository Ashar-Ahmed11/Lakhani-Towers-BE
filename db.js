const mongoose = require('mongoose')

const URI = 'mongodb+srv://ashar2day:karachi2020@cluster0.vqvccxu.mongodb.net/lakhani-towers'
// const URI = 'mongodb://localhost:27017/lakhani-towers'
// 
mongoose.set("strictQuery", false);
const connectToMongo = () => mongoose.connect(URI, () => {
    console.log("Connected to Mongo Successfully")
})

module.exports = connectToMongo