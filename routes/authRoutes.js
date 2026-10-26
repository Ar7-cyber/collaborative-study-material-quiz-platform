const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { requireAuth } = require('../middleware/auth');

router.post(’/register’, (req, res) => {
   try {
        const { username, password } = req.body;

         // Public registration must never grant elevated privileges.
         const user = authService.register(
             username,
             password,
             'Student/User',
             req.ip
          );

          res.status(201).json({
              message: 'User registered successfully',
              user
           });
    } catch (err) {
         res.status(400).json({ error: err.message });
    }

});

router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const result = authService.login(username, password, req.ip);

        // Set secure HTTP-only session cookie
        res.cookie('csqp_session', result.token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
            message: 'Authentication successful',
            token: result.token,
            user: result.user
        });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

router.post('/logout', (req, res) => {
    try {
        const token = req.cookies?.csqp_session || (req.headers.authorization && req.headers.authorization.substring(7));
        authService.logout(token, req.ip);

        res.clearCookie('csqp_session');
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/me', requireAuth, (req, res) => {
    res.json({
        user: req.user
    });
});

module.exports = router;
