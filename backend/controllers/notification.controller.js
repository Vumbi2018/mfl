const pool = require('../db');

// GET /api/notifications - Get unread & recent notifications for logged in user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const tenantCode = req.tenantCode || 'png';


    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE (user_id = $1 OR user_id IS NULL) AND tenant_code = $2 
       ORDER BY created_at DESC LIMIT 30`,
      [userId, tenantCode]
    );

    const unreadCount = result.rows.filter(n => !n.is_read).length;

    res.status(200).json({
      success: true,
      unreadCount,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, message: 'Server error fetching notifications.' });
  }
};

// PUT /api/notifications/:id/read - Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [id, userId]
    );

    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Error marking notification read:', err);
    res.status(500).json({ success: false, message: 'Server error updating notification.' });
  }
};

// PUT /api/notifications/read-all - Mark all user notifications as read
exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantCode = req.tenantCode || 'png';

    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE (user_id = $1 OR user_id IS NULL) AND tenant_code = $2`,
      [userId, tenantCode]
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Error marking all notifications read:', err);
    res.status(500).json({ success: false, message: 'Server error updating notifications.' });
  }
};

// Helper: Create internal system notification
exports.createNotification = async ({ userId, tenantCode = 'png', title, message, type = 'info', link = '' }) => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, tenant_code, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId || null, tenantCode, title, message, type, link]
    );
  } catch (err) {
    console.error('Failed to create background notification:', err);
  }
};
