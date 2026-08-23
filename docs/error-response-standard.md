# API Error Response Standard — ClientFlow

All API error responses follow the same JSON shape:

```json
{ "error": "Human readable message here" }
```

## Status codes

| Code | Meaning                          | When to use it                                      |
|------|-----------------------------------|------------------------------------------------------|
| 401  | Unauthorized                     | Missing, invalid, or expired JWT — "we don't know who you are" |
| 403  | Forbidden                        | Valid JWT, but the user's role isn't allowed — "we know who you are, but you can't do this" |
| 404  | Not Found                        | Route doesn't exist                                   |
| 409  | Conflict                         | Duplicate resource (e.g. email already registered)    |
| 422  | Unprocessable Entity             | Validation errors (missing/invalid fields)             |

## Where this is implemented

- `AuthMiddleware` → 401 responses
- `RoleMiddleware` → 403 responses
- `Router::notFound()` → 404 responses
- `Controller::error()` → used by Controllers for 409/422/etc.

## Notes for future development

Every new Controller or Middleware should return errors in this same
`{ "error": "..." }` shape with the correct status code above, so the
frontend can handle all API errors consistently in one place (e.g. one
shared Axios error handler).

Currently `AuthMiddleware` and `RoleMiddleware` each build their own
JSON error response inline rather than sharing a common helper. This
works correctly and is intentional for now — if duplication grows as
more middleware is added, consider extracting a shared `Response`
helper class in `App\Core`.