const mongoose = require('mongoose')

function connectToDb() {

    mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Database is connected successfully!")
    })
    .catch(err => {
        console.log(err)
        console.log("Error connecting to DB")
        process.exit(1)
    })
}

module.exports = connectToDb