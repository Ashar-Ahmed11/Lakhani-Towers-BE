const mongoose = require('mongoose')


const { Schema } = mongoose;

const adminSchema = new Schema({
    username: {
        type: 'String',
        required: 'True'
    },
    password: {
        type: 'String',
        required: 'True'
    }
});

module.exports = mongoose.model('admin', adminSchema)