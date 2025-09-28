// api/changeName.js
const pool = require('./_utils/db');

module.exports = async (req, res) => {
    const { newName } = req.body;
    if (!newName || newName.trim().length === 0) {
        return res.status(400).json({ error: 'New name cannot be empty.' });
    }

    try {
        const userEmail = req.user.email; // Get email securely from the auth middleware

        const result = await pool.query(
            'UPDATE users SET name = $1 WHERE email = $2 RETURNING name, email',
            [newName.trim(), userEmail]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.status(200).json({
            message: 'Username updated successfully.',
            user: result.rows[0]
        });

    } catch (err) {
        console.error('Error changing username:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
