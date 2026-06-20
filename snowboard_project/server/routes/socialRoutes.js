'use strict';
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend
} = require('../controllers/friendController');

const ANY = ['user', 'manager', 'admin'];

// POST   /friend-requests
router.post('/friend-requests', auth(ANY), sendFriendRequest);

// PUT    /friend-requests/:id/accept
router.put('/friend-requests/:id/accept', auth(ANY), acceptFriendRequest);

// PUT    /friend-requests/:id/reject
router.put('/friend-requests/:id/reject', auth(ANY), rejectFriendRequest);

// DELETE /friendships/:id
router.delete('/friendships/:id', auth(ANY), removeFriend);

module.exports = router;
