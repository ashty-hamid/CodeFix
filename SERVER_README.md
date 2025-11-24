# JSON Server Setup

This project uses a fake JSON server with authentication and authorization to simulate a backend API.

## Quick Start

### Start the server

```bash
npm run server
```

The server will start on `http://localhost:3001`

### Start both frontend and backend together

```bash
npm run dev:all
```

This will start both the Vite dev server and the JSON server simultaneously.

**Note:** Make sure you have a `.env` file (or environment variable) with:
```
VITE_API_BASE_URL=http://localhost:3001
```

The API client is already configured to use this URL.

## Default Test Users

The server comes with two pre-configured users:

**Admin User:**
- Email: `banaz@example.com`
- Password: `password123`
- Role: `admin`

**Regular User:**
- Email: `sara@example.com`
- Password: `password123`
- Role: `user`

## Authentication

The server uses JWT (JSON Web Tokens) for authentication. After successful login or registration, you'll receive an `access_token` that should be included in subsequent requests:

```
Authorization: Bearer <your-token>
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user (public)
  ```json
  {
    "username": "john",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
  Response:
  ```json
  {
    "access_token": "jwt-token-here",
    "user": { "id": 1, "username": "john", "email": "john@example.com", "role": "user" }
  }
  ```

- `POST /auth/login` - Login user (public)
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
  Response:
  ```json
  {
    "access_token": "jwt-token-here",
    "user": { "id": 1, "username": "john", "email": "john@example.com", "role": "user" }
  }
  ```

### Posts

- `GET /posts` - Get all posts (public, supports pagination, search, filtering)
  - Query params: 
    - `page` (number, default: 1) - Page number
    - `limit` (number, default: 10) - Items per page
    - `search` (string) - Search in title and body
    - `authorId` (number) - Filter by author ID
    - `tagId` (number) - Filter by tag ID
    - `sortBy` (string: 'createdAt' | 'views' | 'title', default: 'createdAt')
    - `order` (string: 'ASC' | 'DESC', default: 'DESC')
  - Response: Array of posts with author, tags, and commentsCount

- `GET /posts/:id` - Get post by ID (public)
  - Response: Post object with full details including author and tags

- `POST /posts` - Create post (requires authentication)
  ```json
  {
    "title": "My Post Title",
    "body": "Post content here...",
    "tags": [1, 2, 3] // Array of tag IDs or tag names
  }
  ```

- `PATCH /posts/:id` - Update post (requires authentication, only author or admin)
  ```json
  {
    "title": "Updated Title",
    "body": "Updated content...",
    "tags": [1, 2]
  }
  ```

- `DELETE /posts/:id` - Delete post (requires authentication, only author or admin)
  - Also deletes all associated comments and votes

- `POST /posts/:id/best-answer` - Set best answer for a post (requires authentication, only post author)
  ```json
  {
    "commentId": 5
  }
  ```

- `DELETE /posts/:id/best-answer` - Remove best answer from a post (requires authentication, only post author)

### Comments

- `GET /comments/post/:postId` - Get comments by post ID (public)
  - Response: Array of comments with author and vote scores

- `POST /comments` - Create comment (requires authentication)
  ```json
  {
    "content": "This is my answer...",
    "postId": 1
  }
  ```

- `PATCH /comments/:id` - Update comment (requires authentication, only author or admin)
  ```json
  {
    "content": "Updated comment content..."
  }
  ```

- `DELETE /comments/:id` - Delete comment (requires authentication, only author or admin)
  - Also removes all votes on the comment and recalculates best answer

- `POST /comments/:id/vote` - Vote on comment (requires authentication)
  ```json
  {
    "type": "upvote" // or "downvote"
  }
  ```
  - Automatically recalculates comment score and best answer

- `DELETE /comments/:id/vote` - Remove vote (requires authentication)
  - Removes user's vote and recalculates comment score

### Users

- `GET /users` - Get all users (requires authentication)
  - Response: Array of users (passwords excluded)

- `GET /users/:id` - Get user by ID (requires authentication)
  - Response: User object (password excluded)

- `PUT /users/:id` - Update user (requires authentication, only owner or admin)
  ```json
  {
    "username": "newusername",
    "email": "newemail@example.com",
    "profileImageUrl": "https://example.com/image.jpg"
  }
  ```
  - Note: Regular users cannot change `role` or `blocked` status

- `POST /users/:id/block` - Block user (requires authentication, admin only)
  - Cannot block admin users or yourself

- `POST /users/:id/unblock` - Unblock user (requires authentication, admin only)

- `DELETE /users/:id` - Delete user (requires authentication, owner or admin)
  - Also deletes all user's posts, comments, and votes

### Products (Legacy/Admin)

- `GET /products` - Get all products (public)
- `GET /products/:id` - Get product by ID (public)
- `POST /products` - Create product (requires authentication, admin only)
  ```json
  {
    "name": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "stock": 100
  }
  ```
- `PUT /products/:id` - Update product (requires authentication, admin only)
- `DELETE /products/:id` - Delete product (requires authentication, admin only)

### Tags

- `GET /tags` - Get all tags (public)
  - Response: Array of all available tags

- `GET /tags/:id` - Get tag by ID (public)
  - Response: Tag object with id, name, and description

## Authorization Rules

1. **Public Routes**: 
   - Posts (read): `GET /posts`, `GET /posts/:id`
   - Comments (read): `GET /comments/post/:postId`
   - Products (read): `GET /products`, `GET /products/:id`
   - Tags (read): `GET /tags`, `GET /tags/:id`
   - Authentication: `POST /auth/register`, `POST /auth/login`

2. **Authenticated Routes**: 
   - Most write operations require a valid JWT token
   - Token must be included in `Authorization: Bearer <token>` header

3. **Owner-only Routes**: 
   - Users can only update/delete their own posts and comments
   - Post authors can set/remove best answers for their posts
   - Users can update their own profile (except role and blocked status)

4. **Admin-only Routes**: 
   - Product management: `POST /products`, `PUT /products/:id`, `DELETE /products/:id`
   - User blocking: `POST /users/:id/block`, `POST /users/:id/unblock`
   - Admins can update/delete any post or comment
   - Admins can update any user's profile including blocked status

5. **Best Answer Rules**:
   - Only the post author can set or remove the best answer
   - Best answer is automatically recalculated when comments are voted on
   - Best answer is cleared when the selected comment is deleted

## Environment Variables

You can set these environment variables:

- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - Secret key for JWT tokens (default: 'your-secret-key-change-in-production')

Example:
```bash
PORT=3001 JWT_SECRET=my-secret-key npm run server
```

## Frontend Configuration

Make sure your `.env` file (or environment) has:

```
VITE_API_BASE_URL=http://localhost:3001
```

The API client is already configured to use this base URL and automatically includes the authentication token in requests.

## Database

The database is stored in `db.json`. This file will be updated as you create, update, or delete resources. Make sure to commit this file to track changes, or add it to `.gitignore` if you want to start fresh each time.

## Notes

- **Password Storage**: Passwords are stored in plain text in `db.json`. This is fine for development, but **NEVER** do this in production!
- **JWT Expiration**: Tokens expire after 7 days
- **ID Generation**: IDs are generated using `Date.now()` which is simple but may cause collisions if multiple requests happen simultaneously. For production, use proper UUID generation.

