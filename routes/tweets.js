var express = require('express');
var router = express.Router();

const User = require('../models/users');
const Tweet = require('../models/tweets');
const { checkBody } = require('../modules/checkBody');

router.post('/', (req, res) => {
    if (!checkBody(req.body, ['username', 'content'])) {
      res.json({ result: false, error: 'Missing or empty fields' });
      return;
    }

User.findOne({ username: req.body.username })

  .then(user => {
  if (user === null) {
    res.json({ result: false, error: 'User not found' });
    return;
  }

  const newTweet = new Tweet({
    author: user._id,
    content: req.body.content,
    createdAt: new Date(),
  });

  newTweet.save().then(newDoc => {
    res.json({ result: true, tweet: newDoc });
  });
});
  });

  router.get('/all/:token', (req, res) => {
    User.findOne({ token: req.params.token }).then(user => {
      if (user === null) {
        res.json({ result: false, error: 'User not found' });
        return;
      }

  Tweet.find() // Populate and select specific fields to return (for security purposes)
    .populate('author', ['username', 'firstName'])
    .populate('likes', ['username'])
    .sort({ createdAt: 'desc' })
    .then(tweets => {
      res.json({ result: true, tweets });
    });
});
  });

  router.get('/trends/:token', (req, res) => {
    User.findOne({ token: req.params.token }).then(user => {
      if (user === null) {
        res.json({ result: false, error: 'User not found' });
        return;
      }

  Tweet.find({ content: { $regex: /#/ } })
    .then(tweets => {
      const hashtags = [];

      for (const tweet of tweets) {
        const filteredHashtags = tweet.content.split(' ').filter(word => word.startsWith('#') && word.length > 1);
        hashtags.push(...filteredHashtags);
      }

      const trends = [];
      for (const hashtag of hashtags) {
        const trendIndex = trends.findIndex(trend => trend.hashtag === hashtag);
        if (trendIndex === -1) {
          trends.push({ hashtag, count: 1 });
        } else {
          trends[trendIndex].count++;
        }
      }

      res.json({ result: true, trends: trends.sort((a, b) => b.count - a.count) });
    });
});
  });

  router.get('/hashtag/:token/:query', (req, res) => {
    User.findOne({ token: req.params.token }).then(user => {
      if (user === null) {
        res.json({ result: false, error: 'User not found' });
        return;
      }

  Tweet.find({ content: { $regex: new RegExp('#' + req.params.query, 'i') } }) // Populate and select specific fields to return (for security purposes)
    .populate('author', ['username', 'firstName'])
    .populate('likes', ['username'])
    .sort({ createdAt: 'desc' })
    .then(tweets => {
      res.json({ result: true, tweets });
    });
});
  });

  router.delete('delete/:id', (req, res) => {
    Tweet.findByIdAndDelete(req.params.id)
      .then(deletedDoc => {
        if (deletedDoc === null) {
          res.json({ result: false, error: 'Tweet not found' });
        } else {
          res.json({ result: true, message: 'Tweet deleted successfully' });
        }
      })
      .catch(error => {
        console.log(error);
        res.json({ result: false, error: 'An error occurred while deleting the tweet' });
      });
  });

  module.exports = router;

