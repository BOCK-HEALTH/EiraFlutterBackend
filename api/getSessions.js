// api/getSessions.js (FINAL PATH-CHECKED VERSION)

// Utils are in the _utils/ sub-directory, relative to this file.
const pool = require('./_utils/db');

module.exports = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const result = await pool.query(
      'SELECT * FROM chat_sessions WHERE user_email = $1 ORDER BY created_at DESC',
      [userEmail]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error in getSessions:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
