// api/register.js
const pool = require('./_utils/db');
const bcrypt = require('bcrypt');

const saltRounds = 10; // Standard security practice for bcrypt

module.exports = async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    try {
        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const result = await pool.query(
            'INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING email, name, created_at',
            [email.toLowerCase(), name, hashedPassword]
        );
        
        res.status(201).json(result.rows[0]);

    } catch (err) {
        // Check for the unique constraint violation error
        if (err.code === '23505') {
            return res.status(409).json({ error: 'A user with this email already exists.' });
        }
        console.error('Error during registration:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
