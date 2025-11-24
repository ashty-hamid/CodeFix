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
- `GET /posts` - Get all posts (with pagination, search, filtering)
- `GET /posts/:id` - Get post by ID
- `GET /comments/post/:postId` - Get comments for a post
- `GET /tags` - Get all tags
- `GET /tags/:id` - Get tag by ID
- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Protected Endpoints (Auth required)
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user (owner or admin)
- `POST /users/:id/block` - Block user (admin only)
- `POST /users/:id/unblock` - Unblock user (admin only)
- `DELETE /users/:id` - Delete user (owner or admin)
- `POST /posts` - Create post
- `PATCH /posts/:id` - Update post (author or admin)
- `DELETE /posts/:id` - Delete post (author or admin)
- `POST /posts/:id/best-answer` - Set best answer (post author only)
- `DELETE /posts/:id/best-answer` - Remove best answer (post author only)
- `POST /comments` - Create comment
- `PATCH /comments/:id` - Update comment (author or admin)
- `DELETE /comments/:id` - Delete comment (author or admin)
- `POST /comments/:id/vote` - Vote on comment
- `DELETE /comments/:id/vote` - Remove vote
- `POST /products` - Create product (admin only)
- `PUT /products/:id` - Update product (admin only)
- `DELETE /products/:id` - Delete product (admin only)

## Authentication Issues

### Token Not Being Sent
- Check that token is stored in localStorage: `localStorage.getItem('authToken')`
- Verify the API client is adding the Authorization header
- Check browser Network tab to see if `Authorization: Bearer <token>` is present

### Token Expired
- Tokens expire after 7 days
- User needs to log in again
- The app should redirect to login on 401 errors

### Invalid Token
- Clear localStorage and log in again
- Check server JWT_SECRET matches (if changed)

## Service Layer Issues

### "Cannot find module '@/services'"
- Make sure you're importing from `@/services` (not `@/services/index.ts`)
- Check that `src/services/index.ts` exports all services
- Verify TypeScript path aliases are configured in `tsconfig.json`

### API Calls Not Working
- Verify you're using service methods, not raw Axios
- Check that `VITE_API_BASE_URL` is set correctly
- Ensure the server is running on the correct port

## State Management Issues

### Store Not Updating
- Make sure you're calling store actions, not just reading state
- Check that Pinia is properly initialized in `main.ts`
- Verify you're using the store correctly: `const store = usePostsStore()`

### State Persistence
- User authentication state is stored in localStorage
- Posts and comments are not persisted (fetched on mount)
- Clear localStorage if you need to reset state

## Still Having Issues?

1. **Check the browser Network tab** for the exact failing request
   - Look at the request URL, method, headers, and response
   - Check status codes (200, 401, 403, 404, 500)

2. **Check server console** for any error messages
   - Look for authentication errors
   - Check for database errors
   - Verify middleware is working

3. **Verify the endpoint exists** in `server/index.js`
   - Check the route definition
   - Verify HTTP method matches (GET, POST, etc.)
   - Check authentication middleware is applied correctly

4. **Make sure authentication token is included** for protected routes
   - Check localStorage for 'authToken'
   - Verify token is being sent in Authorization header
   - Test with curl or Postman

5. **Check TypeScript errors**
   - Run `npm run type-check`
   - Fix any type errors that might prevent compilation

6. **Check console errors**
   - Open browser DevTools Console
   - Look for JavaScript errors
   - Check for CORS errors

7. **Verify environment variables**
   - Check `.env` file exists
   - Verify `VITE_API_BASE_URL` is set
   - Restart dev server after changing .env

