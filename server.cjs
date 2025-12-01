const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

// Secret key for JWT (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Enable CORS and other default middlewares
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Request logging for debugging
server.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Helper function to generate JWT token
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

// Helper function to verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Authentication middleware
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

// Authorization middleware - check if user is admin
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// Authorization middleware - check if user is owner or admin
function requireOwnerOrAdmin(req, res, next) {
  const resourceId = parseInt(req.params.id);
  if (req.user.role !== 'admin' && req.user.id !== resourceId) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
}

// Middleware to check if user is blocked
function checkNotBlocked(req, res, next) {
  const db = router.db;
  const user = db.get('users').find({ id: req.user.id }).value();
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  if (user.blocked) {
    return res.status(403).json({ message: 'Your account has been blocked. You cannot perform this action.' });
  }
  
  next();
}

// Helper to get current user from database
function getCurrentUser(db, userId) {
  return db.get('users').find({ id: userId }).value();
}

// ============================================
// Authentication Routes
// ============================================

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
    id: Date.now(), // Simple ID generation (in production, use proper ID generation)
    username,
    email,
    password, // In production, hash the password!
    role: 'user',
    profileImageUrl: '',
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

// Get current user (protected)
server.get('/auth/me', authenticateToken, (req, res) => {
  const db = router.db;
  const user = db.get('users').find({ id: req.user.id }).value();

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
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

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;
  const access_token = generateToken(user);

  res.json({
    access_token,
    user: userWithoutPassword,
  });
});

// ============================================
// Protected Routes - Users
// ============================================

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
server.put('/users/:id', authenticateToken, checkNotBlocked, requireOwnerOrAdmin, (req, res) => {
  const db = router.db;
  const userId = parseInt(req.params.id);
  const user = db.get('users').find({ id: userId }).value();

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Don't allow password or role updates through this endpoint (use separate endpoints)
  const { password, role, id, ...updateData } = req.body;
  const updatedUser = {
    ...user,
    ...updateData,
    updatedAt: new Date().toISOString(),
  };

  db.get('users').find({ id: userId }).assign(updatedUser).write();

  const { password: _, ...userWithoutPassword } = updatedUser;
  res.json(userWithoutPassword);
});

// Delete user (protected - only admin)
server.delete('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const db = router.db;
  const userId = parseInt(req.params.id);
  const user = db.get('users').find({ id: userId }).value();

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  db.get('users').remove({ id: userId }).write();
  res.status(204).send();
});

// Block user (protected - admin only)
server.post('/users/:id/block', authenticateToken, requireAdmin, (req, res) => {
  const db = router.db;
  const userId = parseInt(req.params.id);
  const user = db.get('users').find({ id: userId }).value();

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Cannot block admin users
  if (user.role === 'admin') {
    return res.status(403).json({ message: 'Cannot block admin users' });
  }

  // Cannot block yourself
  if (user.id === req.user.id) {
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

// ============================================
// Protected Routes - Posts
// ============================================

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
    const tags = postTags
      .map((pt) => db.get('tags').find({ id: pt.tagId }).value())
      .filter((tag) => tag !== null && tag !== undefined); // Remove null/undefined tags
    const commentsCount = db
      .get('comments')
      .filter({ postId: post.id })
      .value().length;

    return {
      ...post,
      author: author ? { id: author.id, username: author.username } : null,
      tags: tags || [],
      commentsCount: commentsCount || 0,
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

  // Increment views
  db.get('posts')
    .find({ id: post.id })
    .assign({ views: post.views + 1 })
    .write();

  // Enrich with author, tags, and comments
  const author = db.get('users').find({ id: post.authorId }).value();
  const postTags = db.get('post_tags').filter({ postId: post.id }).value();
  const tags = postTags
    .map((pt) => db.get('tags').find({ id: pt.tagId }).value())
    .filter((tag) => tag !== null && tag !== undefined); // Remove null/undefined tags
  const comments = db.get('comments').filter({ postId: post.id }).value();
  const enrichedComments = comments.map((comment) => {
    const commentAuthor = db.get('users').find({ id: comment.authorId }).value();
    return {
      ...comment,
      author: commentAuthor ? { id: commentAuthor.id, username: commentAuthor.username } : null,
    };
  });

  res.json({
    ...post,
    author: author ? { id: author.id, username: author.username } : null,
    tags: tags || [],
    comments: enrichedComments || [],
    commentsCount: comments.length,
  });
});

// Create post (protected)
server.post('/posts', authenticateToken, checkNotBlocked, (req, res) => {
  const { title, body, tags: tagsInput } = req.body;

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

  // Handle tags - can be tag IDs (numbers) or tag names (strings)
  const tagIds = [];
  if (tagsInput && Array.isArray(tagsInput)) {
    tagsInput.forEach((tagInput) => {
      let tagId;
      
      // If it's a number, treat as tag ID
      if (typeof tagInput === 'number') {
        tagId = tagInput;
      } 
      // If it's a string, treat as tag name - find or create
      else if (typeof tagInput === 'string' && tagInput.trim()) {
        const tagName = tagInput.trim().toLowerCase();
        
        // Find existing tag by name (case-insensitive)
        let existingTag = db.get('tags')
          .find((tag) => tag.name.toLowerCase() === tagName)
          .value();
        
        if (existingTag) {
          // Use existing tag
          tagId = existingTag.id;
        } else {
          // Create new tag
          const allTags = db.get('tags').value();
          const maxId = allTags.length > 0 ? Math.max(...allTags.map(t => t.id)) : 0;
          const newTag = {
            id: maxId + 1,
            name: tagInput.trim(), // Keep original casing for display
            description: '',
            createdAt: new Date().toISOString(),
          };
          db.get('tags').push(newTag).write();
          tagId = newTag.id;
        }
      }
      
      // Add tag to post if we have a valid tag ID
      if (tagId && !tagIds.includes(tagId)) {
        tagIds.push(tagId);
        // Check if this post-tag relationship already exists
        const existingRelation = db.get('post_tags')
          .find({ postId: newPost.id, tagId })
          .value();
        
        if (!existingRelation) {
          db.get('post_tags')
            .push({ postId: newPost.id, tagId })
            .write();
        }
      }
    });
  }

  // Enrich with author and tags
  const author = db.get('users').find({ id: req.user.id }).value();
  const postTags = db.get('post_tags').filter({ postId: newPost.id }).value();
  const postTagsData = postTags
    .map((pt) => db.get('tags').find({ id: pt.tagId }).value())
    .filter((tag) => tag !== null && tag !== undefined); // Remove null/undefined tags

  res.status(201).json({
    ...newPost,
    author: author ? { id: author.id, username: author.username } : null,
    tags: postTagsData || [],
    commentsCount: 0,
  });
});

// Update post (protected - only author or admin)
server.patch('/posts/:id', authenticateToken, checkNotBlocked, (req, res) => {
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

  // Update tags if provided - supports both tag IDs and tag names
  if (tags && Array.isArray(tags)) {
    db.get('post_tags').remove({ postId }).write();
    
    const tagIds = [];
    tags.forEach((tagInput) => {
      let tagId;
      
      // If it's a number, treat as tag ID
      if (typeof tagInput === 'number') {
        tagId = tagInput;
      } 
      // If it's a string, treat as tag name - find or create
      else if (typeof tagInput === 'string' && tagInput.trim()) {
        const tagName = tagInput.trim().toLowerCase();
        
        // Find existing tag by name (case-insensitive)
        let existingTag = db.get('tags')
          .find((tag) => tag.name.toLowerCase() === tagName)
          .value();
        
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          // Create new tag
          const allTags = db.get('tags').value();
          const maxId = allTags.length > 0 ? Math.max(...allTags.map(t => t.id)) : 0;
          const newTag = {
            id: maxId + 1,
            name: tagInput.trim(),
            description: '',
            createdAt: new Date().toISOString(),
          };
          db.get('tags').push(newTag).write();
          tagId = newTag.id;
        }
      }
      
      if (tagId && !tagIds.includes(tagId)) {
        tagIds.push(tagId);
        db.get('post_tags').push({ postId, tagId }).write();
      }
    });
  }

  res.json(updatedPost);
});

// Delete post (protected - only author or admin)
server.delete('/posts/:id', authenticateToken, checkNotBlocked, (req, res) => {
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
  const comments = db.get('comments').filter({ postId }).value();

  const enrichedComments = comments.map((comment) => {
    const author = db.get('users').find({ id: comment.authorId }).value();
    return {
      ...comment,
      author: author ? { id: author.id, username: author.username } : null,
    };
  });

  res.json(enrichedComments);
});

// Create comment (protected)
server.post('/comments', authenticateToken, checkNotBlocked, (req, res) => {
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
server.patch('/comments/:id', authenticateToken, checkNotBlocked, (req, res) => {
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
server.delete('/comments/:id', authenticateToken, checkNotBlocked, (req, res) => {
  const db = router.db;
  const commentId = parseInt(req.params.id);
  const comment = db.get('comments').find({ id: commentId }).value();

  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  if (req.user.role !== 'admin' && comment.authorId !== req.user.id) {
    return res.status(403).json({ message: 'You can only delete your own comments' });
  }

  db.get('comments').remove({ id: commentId }).write();
  db.get('votes').remove({ commentId }).write();

  res.status(204).send();
});

// Vote on comment (protected)
server.post('/comments/:id/vote', authenticateToken, checkNotBlocked, (req, res) => {
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

  const author = db.get('users').find({ id: comment.authorId }).value();
  res.json({
    ...updatedComment,
    author: author ? { id: author.id, username: author.username } : null,
  });
});

// Remove vote from comment (protected)
server.delete('/comments/:id/vote', authenticateToken, checkNotBlocked, (req, res) => {
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

  const author = db.get('users').find({ id: comment.authorId }).value();
  res.json({
    ...updatedComment,
    author: author ? { id: author.id, username: author.username } : null,
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

// ============================================
// FIB API Proxy Routes (to avoid CORS)
// ============================================

// Get FIB base URL from environment or default to stage
const FIB_BASE_URL = process.env.FIB_BASE_URL || 'https://fib.stage.fib.iq';

// Helper function to proxy requests to FIB API
function proxyToFibApi(req, res) {
  // Handle preflight OPTIONS requests first
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  const targetPath = req.path.replace('/api/fib', '');
  const targetUrl = `${FIB_BASE_URL}${targetPath}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
  
  console.log(`[FIB Proxy] ${req.method} ${req.path} -> ${targetUrl}`);
  
  const url = new URL(targetUrl);
  
  // Prepare headers
  const headers = {};
  // Copy relevant headers
  if (req.headers['content-type']) {
    headers['content-type'] = req.headers['content-type'];
  }
  if (req.headers['authorization']) {
    headers['authorization'] = req.headers['authorization'];
  }
  
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method: req.method,
    headers: headers,
  };

  // Use https for https URLs, http for http URLs
  const requestModule = url.protocol === 'https:' ? https : http;

  const proxyReq = requestModule.request(options, (proxyRes) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Copy status code
    res.statusCode = proxyRes.statusCode;
    
    // Copy headers
    Object.keys(proxyRes.headers).forEach((key) => {
      // Skip headers that shouldn't be forwarded
      if (key.toLowerCase() !== 'content-encoding' && 
          key.toLowerCase() !== 'transfer-encoding' &&
          key.toLowerCase() !== 'connection') {
        res.setHeader(key, proxyRes.headers[key]);
      }
    });
    
    // Pipe the response
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    console.error(`[FIB Proxy] Error:`, error);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Proxy error', 
        error: error.message 
      });
    }
  });

  // Forward request body
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    // If body was parsed by bodyParser, use it; otherwise pipe the raw request
    if (req.body !== undefined) {
      let bodyData;
      if (typeof req.body === 'string') {
        bodyData = req.body;
      } else if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
        // For form-urlencoded, convert object to string
        bodyData = Object.entries(req.body)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
      } else {
        // For JSON, stringify
        bodyData = JSON.stringify(req.body);
      }
      proxyReq.write(bodyData);
      proxyReq.end();
    } else {
      // If body wasn't parsed, pipe the raw request
      req.pipe(proxyReq);
    }
  } else {
    // For GET/HEAD, just end the request
    proxyReq.end();
  }
}

// FIB API proxy routes
server.all('/api/fib/*', proxyToFibApi);

// 404 handler - must be before json-server router
server.use((req, res, next) => {
  // Let json-server handle it if no response sent yet
  if (!res.headersSent) {
    next();
  }
});

// Use default router for any other routes (json-server handles unmatched routes)
server.use(router);

// Final 404 handler for routes not handled by json-server
server.use((req, res) => {
  if (!res.headersSent) {
    console.error(`404: ${req.method} ${req.path} not found`);
    res.status(404).json({ 
      message: `Route not found: ${req.method} ${req.path}`,
      path: req.path,
      method: req.method
    });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`JSON Server with Auth is running on http://localhost:${PORT}`);
  console.log(`\nDefault users for testing:`);
  console.log(`Admin: email: banaz@example.com, password: password123`);
  console.log(`User: email: sara@example.com, password: password123\n`);
  console.log(`API Base URL: http://localhost:${PORT}\n`);
});

