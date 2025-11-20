const jwt = require('jsonwebtoken')
const JWT_SECRET = 'ashar.2day@karachi'

const fetchAdmin = (req, res, next) => {
    try {
        const token = req.header('auth-token')
        if (!token) return res.status(401).send('Access denied')
        const data = jwt.verify(token, JWT_SECRET)
        req.user = data.user
        next()
    } catch {
        return res.status(401).send('Invalid token')
    }
}

module.exports = fetchAdmin