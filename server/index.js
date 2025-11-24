const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const server = jsonServer.create();
const path = require('path');
const router = jsonServer.router(path.join(__dirname, '../db.json'));
const middlewares = jsonServer.defaults();


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';


server.use(middlewares);
server.use(jsonServer.bodyParser);


function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}


function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}


function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}


function requireOwnerOrAdmin(req, res, next) {
  const resourceId = parseInt(req.params.id);
  if (req.user.role !== 'admin' && req.user.id !== resourceId) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
}


function getCurrentUser(db, userId) {
  return db.get('users').find({ id: userId }).value();
}

// Helper function to automatically set best answer based on upvotes
function updateBestAnswerForPost(db, postId) {
  const post = db.get('posts').find({ id: postId }).value();
  if (!post) return;
  
  console.log(`[Best Answer] Recalculating for post ${postId}`);

  // Get all comments for this post
  const comments = db.get('comments').filter({ postId }).value();
  
  // Calculate upvote and downvote counts for each comment and update scores
  const commentsWithUpvotes = comments.map(comment => {
    const allVotes = db.get('votes')
      .filter({ commentId: comment.id })
      .value();
    
    const upvotes = allVotes.filter(v => v.type === 'upvote').length;
    const downvotes = allVotes.filter(v => v.type === 'downvote').length;
    const calculatedScore = upvotes - downvotes;
    
    // Update comment score to match actual votes
    if (comment.score !== calculatedScore) {
      db.get('comments')
        .find({ id: comment.id })
        .assign({ score: calculatedScore })
        .write();
    }
    
    return {
      ...comment,
      score: calculatedScore,
      upvoteCount: upvotes,
      downvoteCount: downvotes,
    };
  });

  // Check if there's a current best answer and if it has >= 10 upvotes
  const currentBestAnswer = post.bestAnswerId 
    ? commentsWithUpvotes.find(c => c.id === post.bestAnswerId)
    : null;
  
  const currentBestHasEnoughUpvotes = currentBestAnswer && currentBestAnswer.upvoteCount >= 10;
  
  // Find the comment with maximum upvotes that has at least 10 upvotes
  const eligibleComments = commentsWithUpvotes.filter(c => c.upvoteCount >= 10);
  
  console.log(`[Best Answer] Comments with upvotes:`, commentsWithUpvotes.map(c => ({ id: c.id, upvotes: c.upvoteCount, score: c.score })));
  console.log(`[Best Answer] Eligible comments (>=10 upvotes):`, eligibleComments.map(c => ({ id: c.id, upvotes: c.upvoteCount })));
  console.log(`[Best Answer] Current best answer:`, currentBestAnswer ? { id: currentBestAnswer.id, upvotes: currentBestAnswer.upvoteCount } : 'none');
  
  let bestAnswerId = post.bestAnswerId; // Preserve current by default
  
  // Only auto-update if:
  // 1. There's no current best answer, OR
  // 2. Current best answer has >= 10 upvotes (was auto-set, can be replaced)
  if (!currentBestAnswer || currentBestHasEnoughUpvotes) {
    if (eligibleComments.length > 0) {
      // Sort by upvote count (descending), then by score (descending) as tiebreaker
      eligibleComments.sort((a, b) => {
        if (b.upvoteCount !== a.upvoteCount) {
          return b.upvoteCount - a.upvoteCount;
        }
        return b.score - a.score;
      });
      
      bestAnswerId = eligibleComments[0].id;
      console.log(`[Best Answer] Setting best answer to comment ${bestAnswerId} with ${eligibleComments[0].upvoteCount} upvotes`);
    } else {
      // No eligible comments, but if current best has < 10 upvotes, preserve it (manual selection)
      if (currentBestAnswer && !currentBestHasEnoughUpvotes) {
        console.log(`[Best Answer] Preserving manual best answer (${currentBestAnswer.id}) with ${currentBestAnswer.upvoteCount} upvotes`);
        bestAnswerId = currentBestAnswer.id;
      } else {
        console.log(`[Best Answer] No eligible comments found (need >=10 upvotes)`);
        bestAnswerId = null;
      }
    }
  } else {
    // Current best answer has < 10 upvotes (manual selection), preserve it
    console.log(`[Best Answer] Preserving manual best answer (${currentBestAnswer.id}) with ${currentBestAnswer.upvoteCount} upvotes`);
  }

  // Update post with best answer
  db.get('posts')
    .find({ id: postId })
    .assign({ bestAnswerId })
    .write();
    
  console.log(`[Best Answer] Updated post ${postId} with bestAnswerId: ${bestAnswerId}`);
}

// Authentication Routes

// Register new user
server.post('/auth/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required' });
  }

  const db = router.db;
  const existingUser = db.get('users').find({ email }).value();

  if (existingUser) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const newUser = {
    id: Date.now(), 
    username,
    email,
    password,
    role: 'user',
    profileImageUrl: '',
    blocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.get('users').push(newUser).write();

  // Remove password from response
  const { password: _, ...userWithoutPassword } = newUser;
  const access_token = generateToken(newUser);

  res.json({
    access_token,
    user: userWithoutPassword,
  });
});

// Login user
server.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const db = router.db;
  const user = db.get('users').find({ email, password }).value();

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Check if user is blocked
  if (user.blocked) {
    return res.status(403).json({ message: 'Your account has been blocked. Please contact an administrator.' });
  }

  const { password: _, ...userWithoutPassword } = user;
  const access_token = generateToken(user);

  res.json({
    access_token,
    user: userWithoutPassword,
  });
});

// Protected Routes - Users

// Get all users (protected)
server.get('/users', authenticateToken, (req, res) => {
  const db = router.db;
  const users = db.get('users').value().map(({ password, ...user }) => user);
  res.json(users);
});

// Get user by ID (protected)
server.get('/users/:id', authenticateToken, (req, res) => {
  const db = router.db;
  const user = db.get('users').find({ id: parseInt(req.params.id) }).value();

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Update user (protected - only owner or admin)
server.put('/users/:id', authenticateToken, requireOwnerOrAdmin, (req, res) => {
  const db = router.db;
  const userId = parseInt(req.params.id);
  const user = db.get('users').find({ id: userId }).value();

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { password, role, id, blocked, ...updateData } = req.body;
  
  // Only admins can change blocked status
  const updatedUser = {
    ...user,
    ...updateData,
    updatedAt: new Date().toISOString(),
  };
  
  // Allow blocked field update only if user is admin
  if (req.user.role === 'admin' && blocked !== undefined) {
    updatedUser.blocked = blocked;
  }

  db.get('users').find({ id: userId }).assign(updatedUser).write();

  const { password: _, ...userWithoutPassword } = updatedUser;
  res.json(userWithoutPassword);
});

// Block user (protected - admin only)
server.post('/users/:id/block', authenticateToken, requireAdmin, (req, res) => {
  const db = router.db;
  const userId = parseInt(req.params.id);
  const user = db.get('users').find({ id: userId }).value();

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Prevent blocking admins
  if (user.role === 'admin') {
    return res.status(403).json({ message: 'Cannot block admin users' });
  }

  // Prevent blocking yourself
  if (req.user.id === userId) {
    return res.status(403).json({ message: 'Cannot block yourself' });
  }

  const updatedUser = {
    ...user,
    blocked: true,
    updatedAt: new Date().toISOString(),
  };

  db.get('users').find({ id: userId }).assign(updatedUser).write();

  const { password, ...userWithoutPassword } = updatedUser;
  res.json(userWithoutPassword);
});

// Unblock user (protected - admin only)
server.post('/users/:id/unblock', authenticateToken, requireAdmin, (req, res) => {
  const db = router.db;
  const userId = parseInt(req.params.id);
  const user = db.get('users').find({ id: userId }).value();

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const updatedUser = {
    ...user,
    blocked: false,
    updatedAt: new Date().toISOString(),
  };

  db.get('users').find({ id: userId }).assign(updatedUser).write();

  const { password, ...userWithoutPassword } = updatedUser;
  res.json(userWithoutPassword);
});

// Delete user (protected - owner or admin)
server.delete('/users/:id', authenticateToken, requireOwnerOrAdmin, (req, res) => {
  const db = router.db;
  const userId = parseInt(req.params.id);
  const user = db.get('users').find({ id: userId }).value();

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Cleanup: Remove all user-related data
  // Delete user's posts and related data
  const userPosts = db.get('posts').filter({ authorId: userId }).value();
  userPosts.forEach(post => {
    db.get('comments').remove({ postId: post.id }).write();
    db.get('post_tags').remove({ postId: post.id }).write();
    // Remove votes on comments in these posts
    const postComments = db.get('comments').filter({ postId: post.id }).value();
    postComments.forEach(comment => {
      db.get('votes').remove({ commentId: comment.id }).write();
    });
  });
  db.get('posts').remove({ authorId: userId }).write();

  // Delete user's comments and votes
  const userComments = db.get('comments').filter({ authorId: userId }).value();
  userComments.forEach(comment => {
    db.get('votes').remove({ commentId: comment.id }).write();
    // Recalculate best answer for posts that had this user's comments
    updateBestAnswerForPost(db, comment.postId);
  });
  db.get('comments').remove({ authorId: userId }).write();

  // Delete user's votes
  db.get('votes').remove({ userId }).write();

  // Finally, delete the user
  db.get('users').remove({ id: userId }).write();
  res.status(204).send();
});

// Protected Routes - Posts

// Get all posts with pagination, search, and filtering
server.get('/posts', (req, res) => {
  const db = router.db;
  let posts = db.get('posts').value();

  // Apply search filter
  if (req.query.search) {
    const searchTerm = req.query.search.toLowerCase();
    posts = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(searchTerm) ||
        post.body.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by author
  if (req.query.authorId) {
    posts = posts.filter((post) => post.authorId === parseInt(req.query.authorId));
  }

  // Filter by tag (server-side)
  if (req.query.tagId) {
    const tagId = parseInt(req.query.tagId);
    const postTags = db.get('post_tags').filter({ tagId }).value();
    const postIdsWithTag = new Set(postTags.map(pt => pt.postId));
    posts = posts.filter((post) => postIdsWithTag.has(post.id));
  }

  // Apply sorting
  const sortBy = req.query.sortBy || 'createdAt';
  const order = req.query.order || 'DESC';
  posts.sort((a, b) => {
    if (order === 'ASC') {
      return a[sortBy] > b[sortBy] ? 1 : -1;
    } else {
      return a[sortBy] < b[sortBy] ? 1 : -1;
    }
  });

  // Apply pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginatedPosts = posts.slice(startIndex, endIndex);

  // Enrich posts with author, tags, and comments count
  const enrichedPosts = paginatedPosts.map((post) => {
    const author = db.get('users').find({ id: post.authorId }).value();
    const postTags = db
      .get('post_tags')
      .filter({ postId: post.id })
      .value();
    const tags = postTags.map((pt) =>
      db.get('tags').find({ id: pt.tagId }).value()
    );
    const commentsCount = db
      .get('comments')
      .filter({ postId: post.id })
      .value().length;

    return {
      ...post,
      author: author ? { id: author.id, username: author.username } : null,
      tags: tags || [],
      commentsCount: commentsCount || 0,
      bestAnswerId: post.bestAnswerId || null,
    };
  });

  const total = posts.length;
  const totalPages = Math.ceil(total / limit);

  res.json({
    data: enrichedPosts,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  });
});

// Get post by ID
server.get('/posts/:id', (req, res) => {
  const db = router.db;
  const post = db.get('posts').find({ id: parseInt(req.params.id) }).value();

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  // Recalculate best answer automatically based on current votes
  updateBestAnswerForPost(db, post.id);
  
  // Get updated post with best answer, then increment views
  const updatedPost = db.get('posts').find({ id: post.id }).value();
  
  // Increment views (preserving bestAnswerId)
  const viewsIncremented = updatedPost.views + 1;
  db.get('posts')
    .find({ id: updatedPost.id })
    .assign({ views: viewsIncremented })
    .write();
  
  // Get final post with incremented views and bestAnswerId
  const finalPost = db.get('posts').find({ id: post.id }).value();

  // Enrich with author, tags, and comments
  const author = db.get('users').find({ id: finalPost.authorId }).value();
  const postTags = db.get('post_tags').filter({ postId: finalPost.id }).value();
  const tags = postTags.map((pt) => db.get('tags').find({ id: pt.tagId }).value());
  const comments = db.get('comments').filter({ postId: finalPost.id }).value();
  const enrichedComments = comments.map((comment) => {
    const commentAuthor = db.get('users').find({ id: comment.authorId }).value();
    return {
      ...comment,
      author: commentAuthor ? { id: commentAuthor.id, username: commentAuthor.username } : null,
      isBestAnswer: finalPost.bestAnswerId === comment.id,
    };
  });

  res.json({
    ...finalPost,
    author: author ? { id: author.id, username: author.username } : null,
    tags: tags || [],
    comments: enrichedComments || [],
    commentsCount: comments.length,
    bestAnswerId: finalPost.bestAnswerId || null,
  });
});

// Create post (protected)
server.post('/posts', authenticateToken, (req, res) => {
  const { title, body, tags } = req.body;

  if (!title || !body) {
    return res.status(400).json({ message: 'Title and body are required' });
  }

  const db = router.db;
  const newPost = {
    id: Date.now(),
    title,
    body,
    views: 0,
    excerpt: body.substring(0, 150) + (body.length > 150 ? '...' : ''),
    createdAt: new Date().toISOString(),
    authorId: req.user.id,
  };

  db.get('posts').push(newPost).write();

  // Add tags if provided
  if (tags && Array.isArray(tags)) {
    tags.forEach((tagId) => {
      db.get('post_tags')
        .push({ postId: newPost.id, tagId: parseInt(tagId) })
        .write();
    });
  }

  // Enrich with author and tags
  const author = db.get('users').find({ id: req.user.id }).value();
  const postTags = db.get('post_tags').filter({ postId: newPost.id }).value();
  const postTagsData = postTags.map((pt) => db.get('tags').find({ id: pt.tagId }).value());

  res.status(201).json({
    ...newPost,
    author: author ? { id: author.id, username: author.username } : null,
    tags: postTagsData || [],
    commentsCount: 0,
    bestAnswerId: null,
  });
});

// Update post (protected - only author or admin)
server.patch('/posts/:id', authenticateToken, (req, res) => {
  const db = router.db;
  const postId = parseInt(req.params.id);
  const post = db.get('posts').find({ id: postId }).value();

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  if (req.user.role !== 'admin' && post.authorId !== req.user.id) {
    return res.status(403).json({ message: 'You can only update your own posts' });
  }

  const { tags, ...updateData } = req.body;
  const updatedPost = { ...post, ...updateData };

  // Update excerpt if body changed
  if (updateData.body) {
    updatedPost.excerpt = updateData.body.substring(0, 150) + (updateData.body.length > 150 ? '...' : '');
  }

  db.get('posts').find({ id: postId }).assign(updatedPost).write();

  // Update tags if provided
  if (tags && Array.isArray(tags)) {
    db.get('post_tags').remove({ postId }).write();
    tags.forEach((tagId) => {
      db.get('post_tags').push({ postId, tagId: parseInt(tagId) }).write();
    });
  }

  // Enrich with author, tags, and comments count
  const author = db.get('users').find({ id: post.authorId }).value();
  const postTags = db.get('post_tags').filter({ postId }).value();
  const enrichedTags = postTags.map((pt) => db.get('tags').find({ id: pt.tagId }).value());
  const commentsCount = db.get('comments').filter({ postId }).value().length;

  res.json({
    ...updatedPost,
    author: author ? { id: author.id, username: author.username } : null,
    tags: enrichedTags || [],
    commentsCount: commentsCount || 0,
    bestAnswerId: updatedPost.bestAnswerId || null,
  });
});

// Delete post (protected - only author or admin)
server.delete('/posts/:id', authenticateToken, (req, res) => {
  const db = router.db;
  const postId = parseInt(req.params.id);
  const post = db.get('posts').find({ id: postId }).value();

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  if (req.user.role !== 'admin' && post.authorId !== req.user.id) {
    return res.status(403).json({ message: 'You can only delete your own posts' });
  }

  db.get('posts').remove({ id: postId }).write();
  db.get('comments').remove({ postId }).write();
  db.get('post_tags').remove({ postId }).write();

  res.status(204).send();
});

// ============================================
// Protected Routes - Comments
// ============================================

// Get comments by post ID
server.get('/comments/post/:postId', (req, res) => {
  const db = router.db;
  const postId = parseInt(req.params.postId);
  
  // Recalculate best answer automatically based on current votes
  updateBestAnswerForPost(db, postId);
  
  // Get updated post with best answer
  const post = db.get('posts').find({ id: postId }).value();
  const bestAnswerId = post ? (post.bestAnswerId || null) : null;
  
  const comments = db.get('comments').filter({ postId }).value();

  const enrichedComments = comments.map((comment) => {
    const author = db.get('users').find({ id: comment.authorId }).value();
    return {
      ...comment,
      author: author ? { id: author.id, username: author.username } : null,
      isBestAnswer: bestAnswerId === comment.id,
    };
  });

  res.json(enrichedComments);
});

// Create comment (protected)
server.post('/comments', authenticateToken, (req, res) => {
  const { content, postId } = req.body;

  if (!content || !postId) {
    return res.status(400).json({ message: 'Content and postId are required' });
  }

  const db = router.db;
  const post = db.get('posts').find({ id: parseInt(postId) }).value();

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const newComment = {
    id: Date.now(),
    content,
    score: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    postId: parseInt(postId),
    authorId: req.user.id,
  };

  db.get('comments').push(newComment).write();

  const author = db.get('users').find({ id: req.user.id }).value();
  res.status(201).json({
    ...newComment,
    author: author ? { id: author.id, username: author.username } : null,
  });
});

// Update comment (protected - only author or admin)
server.patch('/comments/:id', authenticateToken, (req, res) => {
  const db = router.db;
  const commentId = parseInt(req.params.id);
  const comment = db.get('comments').find({ id: commentId }).value();

  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  if (req.user.role !== 'admin' && comment.authorId !== req.user.id) {
    return res.status(403).json({ message: 'You can only update your own comments' });
  }

  const updatedComment = {
    ...comment,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  db.get('comments').find({ id: commentId }).assign(updatedComment).write();

  const author = db.get('users').find({ id: comment.authorId }).value();
  res.json({
    ...updatedComment,
    author: author ? { id: author.id, username: author.username } : null,
  });
});

// Delete comment (protected - only author or admin)
server.delete('/comments/:id', authenticateToken, (req, res) => {
  const db = router.db;
  const commentId = parseInt(req.params.id);
  const comment = db.get('comments').find({ id: commentId }).value();

  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  if (req.user.role !== 'admin' && comment.authorId !== req.user.id) {
    return res.status(403).json({ message: 'You can only delete your own comments' });
  }

  const postId = comment.postId;
  
  db.get('comments').remove({ id: commentId }).write();
  db.get('votes').remove({ commentId }).write();

  // Recalculate best answer if the deleted comment was the best answer
  updateBestAnswerForPost(db, postId);

  res.status(204).send();
});

// Vote on comment (protected)
server.post('/comments/:id/vote', authenticateToken, (req, res) => {
  const db = router.db;
  const commentId = parseInt(req.params.id);
  const { type } = req.body;

  if (!type || !['upvote', 'downvote'].includes(type)) {
    return res.status(400).json({ message: 'Valid vote type (upvote/downvote) is required' });
  }

  const comment = db.get('comments').find({ id: commentId }).value();
  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  // Check if user already voted
  const existingVote = db
    .get('votes')
    .find({ userId: req.user.id, commentId })
    .value();

  let updatedScore = comment.score;

  if (existingVote) {
    if (existingVote.type === type) {
      // Same vote, remove it
      db.get('votes').remove({ id: existingVote.id }).write();
      updatedScore = type === 'upvote' ? comment.score - 1 : comment.score + 1;
    } else {
      // Different vote, update it
      db.get('votes').find({ id: existingVote.id }).assign({ type }).write();
      updatedScore = type === 'upvote' ? comment.score + 2 : comment.score - 2;
    }
  } else {
    // New vote
    db.get('votes')
      .push({
        id: Date.now(),
        type,
        createdAt: new Date().toISOString(),
        userId: req.user.id,
        commentId,
      })
      .write();
    updatedScore = type === 'upvote' ? comment.score + 1 : comment.score - 1;
  }

  const updatedComment = {
    ...comment,
    score: updatedScore,
  };

  db.get('comments').find({ id: commentId }).assign(updatedComment).write();

  // Automatically update best answer for this post
  updateBestAnswerForPost(db, comment.postId);

  const author = db.get('users').find({ id: comment.authorId }).value();
  res.json({
    ...updatedComment,
    author: author ? { id: author.id, username: author.username } : null,
  });
});

// Remove vote from comment (protected)
server.delete('/comments/:id/vote', authenticateToken, (req, res) => {
  const db = router.db;
  const commentId = parseInt(req.params.id);

  const comment = db.get('comments').find({ id: commentId }).value();
  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  const existingVote = db
    .get('votes')
    .find({ userId: req.user.id, commentId })
    .value();

  if (!existingVote) {
    return res.status(404).json({ message: 'No vote found to remove' });
  }

  db.get('votes').remove({ id: existingVote.id }).write();

  const updatedScore =
    existingVote.type === 'upvote' ? comment.score - 1 : comment.score + 1;
  const updatedComment = {
    ...comment,
    score: updatedScore,
  };

  db.get('comments').find({ id: commentId }).assign(updatedComment).write();

  // Automatically update best answer for this post
  updateBestAnswerForPost(db, comment.postId);

  const author = db.get('users').find({ id: comment.authorId }).value();
  res.json({
    ...updatedComment,
    author: author ? { id: author.id, username: author.username } : null,
  });
});

// ============================================
// Best Answer Routes
// ============================================

// Set best answer for a post (protected - only post author or admin)
// Note: Manual selections with < 10 upvotes will be preserved by the automatic system
server.post('/posts/:id/best-answer', authenticateToken, (req, res) => {
  const db = router.db;
  const postId = parseInt(req.params.id);
  const { commentId } = req.body;

  if (!commentId) {
    return res.status(400).json({ message: 'commentId is required' });
  }

  const post = db.get('posts').find({ id: postId }).value();
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  // Check if user is post author or admin
  if (req.user.role !== 'admin' && post.authorId !== req.user.id) {
    return res.status(403).json({ message: 'Only the post author can set the best answer' });
  }

  // Verify comment exists and belongs to this post
  const comment = db.get('comments').find({ id: parseInt(commentId), postId }).value();
  if (!comment) {
    return res.status(404).json({ message: 'Comment not found or does not belong to this post' });
  }

  // Update post with best answer
  const updatedPost = {
    ...post,
    bestAnswerId: parseInt(commentId),
  };

  db.get('posts').find({ id: postId }).assign(updatedPost).write();

  // Enrich post response
  const author = db.get('users').find({ id: post.authorId }).value();
  const postTags = db.get('post_tags').filter({ postId }).value();
  const tags = postTags.map((pt) => db.get('tags').find({ id: pt.tagId }).value());
  const comments = db.get('comments').filter({ postId }).value();
  const enrichedComments = comments.map((c) => {
    const commentAuthor = db.get('users').find({ id: c.authorId }).value();
    return {
      ...c,
      author: commentAuthor ? { id: commentAuthor.id, username: commentAuthor.username } : null,
      isBestAnswer: c.id === parseInt(commentId),
    };
  });

  res.json({
    ...updatedPost,
    author: author ? { id: author.id, username: author.username } : null,
    tags: tags || [],
    comments: enrichedComments || [],
    commentsCount: comments.length,
    bestAnswerId: updatedPost.bestAnswerId,
  });
});

// Remove best answer from a post (protected - only post author or admin)
// Note: The automatic system may set a new best answer on the next vote if eligible
server.delete('/posts/:id/best-answer', authenticateToken, (req, res) => {
  const db = router.db;
  const postId = parseInt(req.params.id);

  const post = db.get('posts').find({ id: postId }).value();
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  // Check if user is post author or admin
  if (req.user.role !== 'admin' && post.authorId !== req.user.id) {
    return res.status(403).json({ message: 'Only the post author can remove the best answer' });
  }

  // Remove best answer
  const updatedPost = {
    ...post,
    bestAnswerId: null,
  };

  db.get('posts').find({ id: postId }).assign(updatedPost).write();

  // Enrich post response
  const author = db.get('users').find({ id: post.authorId }).value();
  const postTags = db.get('post_tags').filter({ postId }).value();
  const tags = postTags.map((pt) => db.get('tags').find({ id: pt.tagId }).value());
  const comments = db.get('comments').filter({ postId }).value();
  const enrichedComments = comments.map((c) => {
    const commentAuthor = db.get('users').find({ id: c.authorId }).value();
    return {
      ...c,
      author: commentAuthor ? { id: commentAuthor.id, username: commentAuthor.username } : null,
      isBestAnswer: false,
    };
  });

  res.json({
    ...updatedPost,
    author: author ? { id: author.id, username: author.username } : null,
    tags: tags || [],
    comments: enrichedComments || [],
    commentsCount: comments.length,
    bestAnswerId: null,
  });
});

// ============================================
// Products Routes
// ============================================

// Get all products
server.get('/products', (req, res) => {
  const db = router.db;
  const products = db.get('products').value();
  res.json(products);
});

// Get product by ID
server.get('/products/:id', (req, res) => {
  const db = router.db;
  const product = db.get('products').find({ id: parseInt(req.params.id) }).value();

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(product);
});

// Create product (protected - admin only)
server.post('/products', authenticateToken, requireAdmin, (req, res) => {
  const { name, description, price, stock } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ message: 'Name and price are required' });
  }

  const db = router.db;
  const newProduct = {
    id: Date.now(),
    name,
    description: description || '',
    price: parseFloat(price),
    stock: stock !== undefined ? parseInt(stock) : 0,
    createdAt: new Date().toISOString(),
  };

  db.get('products').push(newProduct).write();
  res.status(201).json(newProduct);
});

// Update product (protected - admin only)
server.put('/products/:id', authenticateToken, requireAdmin, (req, res) => {
  const db = router.db;
  const productId = parseInt(req.params.id);
  const product = db.get('products').find({ id: productId }).value();

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const updatedProduct = {
    ...product,
    ...req.body,
  };

  db.get('products').find({ id: productId }).assign(updatedProduct).write();
  res.json(updatedProduct);
});

// Delete product (protected - admin only)
server.delete('/products/:id', authenticateToken, requireAdmin, (req, res) => {
  const db = router.db;
  const productId = parseInt(req.params.id);
  const product = db.get('products').find({ id: productId }).value();

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  db.get('products').remove({ id: productId }).write();
  res.status(204).send();
});

// ============================================
// Tags Routes
// ============================================

// Get all tags
server.get('/tags', (req, res) => {
  const db = router.db;
  const tags = db.get('tags').value();
  res.json(tags);
});

// Get tag by ID
server.get('/tags/:id', (req, res) => {
  const db = router.db;
  const tag = db.get('tags').find({ id: parseInt(req.params.id) }).value();

  if (!tag) {
    return res.status(404).json({ message: 'Tag not found' });
  }

  res.json(tag);
});

// Use default router for any other routes
server.use(router);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`JSON Server with Auth is running on http://localhost:${PORT}`);
  console.log(`\nDefault users for testing:`);
  console.log(`Admin: email: banaz@example.com, password: password123`);
  console.log(`User: email: sara@example.com, password: password123\n`);
});

