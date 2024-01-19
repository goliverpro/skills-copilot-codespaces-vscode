// Create web server



// Import modules
const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { route } = require('./posts');

// @route   POST api/comments
// @desc    Create a comment
// @access  Private
router.post('/', [auth, [
    check('text', 'Text is required').not().isEmpty(),
    check('post', 'Post is required').not().isEmpty()
]], async (req, res) => {
    // Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Return errors
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Get user
        const user = await User.findById(req.user.id).select('-password');

        // Create comment
        const comment = new Comment({
            text: req.body.text,
            post: req.body.post,
            user: user.id
        });

        // Save comment
        await comment.save();

        // Return comment
        res.json(comment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/comments
// @desc    Get all comments
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        // Get comments
        const comments = await Comment.find().sort({ date: -1 });

        // Return comments
        res.json(comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/comments/:id
// @desc    Get comment by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        // Get comment
        const comment = await Comment.findById(req.params.id);

        // Check if comment exists
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        // Return comment
        res.json(comment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/comments/:id
// @desc    Update comment
// @access  Private

router.put('/:id', auth, async (req, res) => {
    try {
        // Get comment
        const comment = await Comment.findById(req.params.id);

        // Check if comment exists
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        // Check if user is comment owner
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Update comment
        comment.text = req.body.text;

        // Save comment
        await comment.save();

        // Return comment
        res.json(comment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
}
);

// @route   DELETE api/comments/:id
// @desc    Delete comment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        // Get comment
        const comment = await Comment.findById(req.params.id);

        // Check if comment exists
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        // Check if user is comment owner
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Delete comment
        await comment.remove();

        // Return message
        res.json({ msg: 'Comment removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
}
);

// @route   PUT api/comments/like/:id
// @desc    Like comment
// @access  Private

router.put('/like/:id', auth, async (req, res) => {
    try {
        // Get comment
        const comment = await Comment.findById(req.params.id);

        // Check if comment exists
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        // Check if comment has already been liked
        if (comment.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ msg: 'Comment already liked' });
        }

        // Add like
        comment.likes.unshift({ user: req.user.id });

        // Save comment
        await comment.save();

        // Return likes
        res.json(comment.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
}
);

// @route   PUT api/comments/unlike/:id
// @desc    Unlike comment
// @access  Private
