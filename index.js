const express = require('express')
const app = express()
const port = process.env.PORT || 8000
const cors = require('cors')
const connectToMongo = require('./db')
const bcrypt = require('bcryptjs')
const Admin = require('./models/admin')
connectToMongo()
const fileupload = require("express-fileupload");
app.use(fileupload({
    useTempFiles: true
}));
app.use(express.json())
app.use(cors({ origin: true }))

// Seed default admin if not exists
const seedDefaultAdmin = async () => {
    try {
        const email = 'admin@lakhanitowers.com';
        const username = 'Lakhani Admin';
        const password = 'Karachi2020@';
        const exists = await Admin.findOne({ email: email.toLowerCase() });
        if (!exists) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            await Admin.create({ username, email: email.toLowerCase(), password: hash });
            console.log('Default admin created');
        }
    } catch (e) {
        console.error('Admin seed error', e.message);
    }
};

seedDefaultAdmin();


// Routes
app.use('/api/admin', require('./routes/adminAuth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/employees', require('./routes/employees'))
app.use('/api/flats', require('./routes/flats'))
app.use('/api/salaries', require('./routes/salaries'))
app.use('/api/maintenance', require('./routes/maintenance'))
app.use('/api/custom-headers', require('./routes/customHeaders'))
app.use('/api/custom-header-records', require('./routes/customHeaderRecords'))


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})