// api/changePassword.js
const pool = require('./_utils/db');
const bcrypt = require('bcrypt');

const saltRounds = 10;

module.exports = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Old password and new password are required.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    try {
        const userEmail = req.user.email;

        // 1. Fetch the current user to get their stored password hash
        const userResult = await pool.query('SELECT password FROM users WHERE email = $1', [userEmail]);
        if (userResult.rowCount === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const storedHash = userResult.rows[0].password;

        // 2. Compare the provided old password with the stored hash
        const isMatch = await bcrypt.compare(oldPassword, storedHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect old password.' });
        }

        // 3. If they match, hash the new password
        const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // 4. Update the user's password in the database
        await pool.query('UPDATE users SET password = $1 WHERE email = $2', [newHashedPassword, userEmail]);

        res.status(200).json({ message: 'Password updated successfully.' });

    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
