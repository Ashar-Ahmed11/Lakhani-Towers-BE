const express = require('express')
const router = express.Router()
const Admin = require('../models/admin')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const JWT_SECRET = 'ashar.2day@karachi'


router.post('/createuser', async(req, res) => {

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(req.body.password, salt)
    const data = {
        username: req.body.username,
        password: hash,
    }

    const admin = await Admin.create(data)
    admin.save()

    res.send(data)



})

router.post('/login', async(req, res) => {
    const username = req.body.username
    const user = await Admin.findOne({ username: username })
    if (!user) {
        return res.status(404).send("Please enter correct credentials")
    }
    const pass = await bcrypt.compare(req.body.password, user.password)
    if (!pass) {
        return res.status(404).send("Please enter correct credentials")
    }
    const data = {
        user: user._id
    }
    const authToken = jwt.sign(data, JWT_SECRET)
    res.json({ authToken })

})



module.exports = router