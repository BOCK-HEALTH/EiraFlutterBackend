// api/_utils/authMiddleware.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('CRITICAL SERVER ERROR: JWT_SECRET is not defined!');
        return res.sendStatus(500);
    }

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            console.error('JWT Verification Failed:', err.message);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
}
module.exports = authenticateToken;
