# Troubleshooting Guide

## 404 Errors

If you're getting 404 errors, check the following:

### 1. Server Status
Make sure the server is running:
```bash
npm run server
```

You should see:
```
JSON Server with Auth is running on http://localhost:3001
```

### 2. Check API Base URL
Verify your `.env` file or environment has:
```
VITE_API_BASE_URL=http://localhost:3001
```

Or check `src/services/api.ts` - it defaults to `http://localhost:3001`

### 3. Test Endpoints Manually

Test if the server is responding:
```bash
# Test posts endpoint
curl http://localhost:3001/posts

# Test auth endpoint (should return 401 without token)
curl http://localhost:3001/auth/me

# Test login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"banaz@example.com","password":"password123"}'
```

### 4. Browser Console
Open browser DevTools (F12) and check:
- **Network tab**: See which requests are failing with 404
- **Console tab**: Check for any error messages

### 5. Common Issues

#### Issue: "Route not found"
- Make sure the server is running on port 3001
- Check if the endpoint exists in `server.cjs`
- Verify the HTTP method (GET, POST, etc.) matches

#### Issue: "Cannot connect to server"
- Server might not be running
- Port 3001 might be in use
- Firewall might be blocking the connection

#### Issue: "CORS errors"
- The server should handle CORS automatically
- Check if `jsonServer.defaults()` middleware is applied

### 6. Debugging Steps

1. **Check server logs**: Look at the terminal where the server is running
2. **Check browser console**: See exact error messages
3. **Check Network tab**: See the exact URL and status code
4. **Test with curl**: Verify endpoints work outside the browser

### 7. Reset Database

If you need to reset the database:
1. Stop the server (Ctrl+C)
2. Restore `db.json` from git or recreate it
3. Start the server again

### 8. Verify Environment

Make sure you have all dependencies:
```bash
npm install
```

And check if json-server is installed:
```bash
npm list json-server
```

## Common Endpoints

### Public Endpoints (No auth required)
- `GET /posts` - Get all posts
- `GET /posts/:id` - Get post by ID
- `GET /comments/post/:postId` - Get comments for a post
- `GET /tags` - Get all tags
- `GET /tags/:id` - Get tag by ID
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Protected Endpoints (Auth required)
- `GET /auth/me` - Get current user
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /posts` - Create post
- `PATCH /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post
- `POST /comments` - Create comment
- `PATCH /comments/:id` - Update comment
- `DELETE /comments/:id` - Delete comment
- `POST /comments/:id/vote` - Vote on comment
- `DELETE /comments/:id/vote` - Remove vote

## Still Having Issues?

1. Check the browser Network tab for the exact failing request
2. Check server console for any error messages
3. Verify the endpoint exists in `server.cjs`
4. Make sure authentication token is included for protected routes

