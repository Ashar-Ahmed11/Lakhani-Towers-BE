const jwt = require('jsonwebtoken')
const JWT_SECRET = 'ashar.2day@karachi'

const fetchAdmin = (req, res, next) => {
    try {
        const token = req.header('auth-token')
        if (!token) return res.status(401).send('Access denied')
        const data = jwt.verify(token, JWT_SECRET)
        // Backward compatible: keep req.user; also provide role info
        req.user = data.user
        req.entityType = data.entityType || 'admin'
        next()
    } catch {
        return res.status(401).send('Invalid token')
    }
}

module.exports = fetchAdmin