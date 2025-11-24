const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Secret key for JWT (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Enable CORS and other default middlewares
server.use(middlewares);
server.use(jsonServer.bodyParser);

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
server.put('/users/:id', authenticateToken, requireOwnerOrAdmin, (req, res) => {
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
  const tags = postTags.map((pt) => db.get('tags').find({ id: pt.tagId }).value());
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

  res.json(updatedPost);
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

  db.get('comments').remove({ id: commentId }).write();
  db.get('votes').remove({ commentId }).write();

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

