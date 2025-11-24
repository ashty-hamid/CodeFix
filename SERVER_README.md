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

- `POST /auth/register` - Register a new user
  ```json
  {
    "username": "john",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- `POST /auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

### Posts (Protected unless specified)

- `GET /posts` - Get all posts (public, supports pagination, search, filtering)
  - Query params: `page`, `limit`, `search`, `authorId`, `sortBy`, `order`
- `GET /posts/:id` - Get post by ID (public)
- `POST /posts` - Create post (requires authentication)
- `PATCH /posts/:id` - Update post (requires authentication, only author or admin)
- `DELETE /posts/:id` - Delete post (requires authentication, only author or admin)

### Comments (Protected)

- `GET /comments/post/:postId` - Get comments by post ID (public)
- `POST /comments` - Create comment (requires authentication)
- `PATCH /comments/:id` - Update comment (requires authentication, only author or admin)
- `DELETE /comments/:id` - Delete comment (requires authentication, only author or admin)
- `POST /comments/:id/vote` - Vote on comment (requires authentication)
- `DELETE /comments/:id/vote` - Remove vote (requires authentication)

### Users (Protected)

- `GET /users` - Get all users (requires authentication)
- `GET /users/:id` - Get user by ID (requires authentication)
- `PUT /users/:id` - Update user (requires authentication, only owner or admin)
- `DELETE /users/:id` - Delete user (requires authentication, admin only)

### Products

- `GET /products` - Get all products (public)
- `GET /products/:id` - Get product by ID (public)
- `POST /products` - Create product (requires authentication, admin only)
- `PUT /products/:id` - Update product (requires authentication, admin only)
- `DELETE /products/:id` - Delete product (requires authentication, admin only)

### Tags

- `GET /tags` - Get all tags (public)
- `GET /tags/:id` - Get tag by ID (public)

## Authorization Rules

1. **Public Routes**: Posts (read), Comments (read), Products (read), Tags (read)
2. **Authenticated Routes**: Most write operations require a valid JWT token
3. **Owner-only Routes**: Users can only update/delete their own posts and comments
4. **Admin-only Routes**: Product management and user deletion require admin role

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

