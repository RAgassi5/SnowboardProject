'use strict';
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { approveMember, rejectMember, removeMember } = require('../controllers/tripMemberController');

const ANY = ['user', 'manager', 'admin'];

// PUT  /trip-members/:id/approve
router.put('/:id/approve', auth(ANY), approveMember);

// PUT  /trip-members/:id/reject
router.put('/:id/reject', auth(ANY), rejectMember);

// DELETE /trip-members/:id  (creator kicks member, or member leaves)
router.delete('/:id', auth(ANY), removeMember);

module.exports = router;
