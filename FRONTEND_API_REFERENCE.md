# Frontend API Reference

This document is the handoff reference for the frontend team working against the `back_AQL` backend.

It is written to be useful both for human developers and for AI tools generating frontend code.

## 1. Project Overview

This backend exposes a REST API for a course-sharing platform.

Main capabilities:
- authentication with JWT access token + refresh token
- user profile management
- admin role and account management
- course creation from uploaded `.md` and `.ipynb` files
- course listing, filtering, visibility rules
- course duplication
- download of original course files

Database concepts:
- `User`
- `Course`
- `RefreshToken`

Important enums:
- `UserRole`: `ADMIN`, `TEACHER`, `STUDENT`
- `CourseStatus`: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- `CourseVisibility`: `PUBLIC`, `PRIVATE`, `RESTRICTED`
- `FileType`: `MARKDOWN`, `NOTEBOOK`

## 2. Base URLs

Local development defaults:
- API base: `http://localhost:5000/api`
- Health check: `http://localhost:5000/health`
- Swagger UI: `http://localhost:5000/api-docs`
- Swagger JSON: `http://localhost:5000/api-docs.json`

## 3. Authentication Model

The backend uses JWT.

Tokens:
- `accessToken`: used in `Authorization: Bearer <token>`
- `refreshToken`: used for token refresh and explicit logout

Important rules:
- protected routes require `Authorization: Bearer <accessToken>`
- refresh route expects the `refreshToken` in the JSON body
- logout route revokes the refresh token in the database
- reset password also deletes all stored refresh tokens for that user

## 4. Global Response Shape

### Success response

Most endpoints return:

```json
{
  "status": "success",
  "data": {}
}
```

### Paginated response

Course listing returns:

```json
{
  "status": "success",
  "data": {
    "courses": [],
    "pagination": {
      "total": 0,
      "page": 1,
      "limit": 10,
      "totalPages": 0
    }
  }
}
```

### Error response

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

Frontend should always read:
- `status`
- `message`
- optional `errors`

## 5. Core Resource Shapes

### Auth payload returned on register/login

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "STUDENT"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

### Public user profile

```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "role": "TEACHER",
  "avatar": null,
  "bio": "Teacher bio",
  "createdAt": "2026-05-13T12:00:00.000Z",
  "_count": {
    "courses": 3
  }
}
```

### Course object shape

Shape varies a little by endpoint, but the main course fields are:

```json
{
  "id": 12,
  "title": "Introduction to Python",
  "description": "Beginner course",
  "slug": "introduction-to-python",
  "category": "Python",
  "fileType": "MARKDOWN",
  "status": "PUBLISHED",
  "visibility": "PUBLIC",
  "allowDownload": true,
  "views": 25,
  "createdAt": "2026-05-13T12:00:00.000Z",
  "updatedAt": "2026-05-13T12:10:00.000Z",
  "publishedAt": "2026-05-13T12:10:00.000Z",
  "author": {
    "id": 3,
    "firstName": "Jane",
    "lastName": "Smith"
  }
}
```

Detailed course responses may additionally include:
- `contentHTML`
- `originalFileName`
- `filePath`

## 6. Visibility Rules

These rules matter for the frontend and should not be guessed.

- `PUBLIC`
  - visible to everyone
- `RESTRICTED`
  - visible only to authenticated users
- `PRIVATE`
  - visible only to the course owner and admins

Status rules:
- non-published courses (`DRAFT`, `ARCHIVED`) are not visible publicly
- owner can view their own non-published courses
- admin can view all courses

## 7. Auth Endpoints

### POST `/api/auth/register`

Creates a new user account.
New accounts are always created with role `STUDENT`.

Request:

```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

Response:
- returns `user`, `accessToken`, `refreshToken`

### POST `/api/auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

Response:
- returns `user`, `accessToken`, `refreshToken`

### POST `/api/auth/refresh`

Request:

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

### POST `/api/auth/logout`

Explicit backend logout.
Revokes the provided refresh token.

Request:

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "message": "Logged out successfully."
  }
}
```

### POST `/api/auth/forgot-password`

Request:

```json
{
  "email": "user@example.com"
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "message": "If an account exists for this email, a password reset token has been generated."
  }
}
```

Development-only note:
- in `development`, the backend may also return `resetToken` in the response to simplify testing
- frontend should not rely on that field in production

### POST `/api/auth/reset-password`

Request:

```json
{
  "token": "password_reset_token",
  "password": "NewPassword123!"
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "message": "Password reset successfully."
  }
}
```

### GET `/api/auth/me`

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Response:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "STUDENT",
      "avatar": null,
      "bio": null,
      "createdAt": "2026-05-13T12:00:00.000Z",
      "_count": {
        "courses": 0
      }
    }
  }
}
```

## 8. User Endpoints

### PATCH `/api/users/me`

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Request:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://example.com/avatar.jpg",
  "bio": "Teacher and backend developer"
}
```

### GET `/api/users/:id`

Public profile endpoint.

### GET `/api/users/:id/courses`

Returns published courses for a given user.

## 9. Admin Endpoints

All admin endpoints require:

```http
Authorization: Bearer ACCESS_TOKEN_ADMIN
```

### PATCH `/api/admin/users/:id/role`

Request:

```json
{
  "role": "TEACHER"
}
```

Allowed values:
- `ADMIN`
- `TEACHER`
- `STUDENT`

### PATCH `/api/admin/users/:id/status`

Used to activate or suspend accounts.

Request:

```json
{
  "isActive": false
}
```

Interpretation:
- `true` => active
- `false` => suspended

### DELETE `/api/admin/users/:id`

Deletes the user account.

Important frontend warning:
- deleting a user also deletes their courses because of cascade delete in the database

## 10. Course Endpoints

### GET `/api/courses`

Public or authenticated listing endpoint.
Returns paginated courses based on status and visibility rules.

Supported query params:
- `page`
- `limit`
- `search`
- `category`
- `authorId`
- `dateFrom`
- `dateTo`
- `status`

Example:

```http
GET /api/courses?page=1&limit=10&category=Python&authorId=3&dateFrom=2026-01-01&dateTo=2026-05-01
```

Notes:
- `dateFrom` and `dateTo` must be `YYYY-MM-DD`
- `status` is effectively only useful for admin-side filtering in the current backend behavior

### GET `/api/courses/mine`

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Role required:
- `TEACHER`

Returns all courses for the authenticated teacher, including non-published ones.

### GET `/api/courses/:slug`

Returns one course and increments its `views`.

Visibility behavior:
- public users only see `PUBLIC` + `PUBLISHED`
- logged-in users can also see `RESTRICTED` + `PUBLISHED`
- owner sees their own non-published/private course
- admin sees everything

### POST `/api/courses`

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
Content-Type: multipart/form-data
```

Role required:
- `TEACHER`

Form-data fields:
- `file` required
- `title` required
- `description` optional
- `category` optional
- `visibility` optional
- `allowDownload` optional

Example values:

```text
file = intro-python.md
title = Introduction to Python
description = Beginner course
category = Python
visibility = PUBLIC
allowDownload = true
```

Allowed upload files:
- `.md`
- `.ipynb`

### PATCH `/api/courses/:id`

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Role required:
- `TEACHER`
- must own the course

Request:

```json
{
  "title": "Advanced Python",
  "description": "Updated description",
  "category": "Data Science",
  "visibility": "RESTRICTED",
  "allowDownload": false
}
```

Notes:
- if `title` changes, a new unique `slug` is generated
- `category` may be set to `null` to clear it

### DELETE `/api/courses/:id`

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Deletes the course and the stored file.

### POST `/api/courses/:id/duplicate`

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Allowed for:
- owner teacher
- admin

Behavior:
- duplicates the database row
- copies the source file
- resets `views` to `0`
- sets duplicated course status to `DRAFT`
- generates a new title with `(Copy)` and a new unique slug

### PATCH `/api/courses/:id/publish`

Headers:

```http
Authorization: Bearer ACCESS_TOKEN
```

Role required:
- `TEACHER`
- must own the course

Request:

```json
{
  "status": "PUBLISHED"
}
```

Allowed values:
- `DRAFT`
- `PUBLISHED`
- `ARCHIVED`

### GET `/api/courses/:id/download`

Optional auth route.

Behavior:
- owner and admin can always access if the course itself is accessible
- others need `allowDownload = true`
- visibility and publication rules still apply

## 11. Course Filtering and Frontend UX Guidance

Recommended filter UI fields for course listing:
- search input
- category select or text chip
- author select
- date range picker
- visibility badges
- status tabs for teacher/admin dashboards

Recommended frontend query builder:

```ts
type CourseListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  authorId?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
};
```

## 12. Frontend Auth Flow Recommendation

Recommended frontend behavior:

1. On login/register:
- store `accessToken`
- store `refreshToken`
- store `user`

2. On every protected request:
- send `Authorization: Bearer <accessToken>`

3. On `401` from protected endpoint:
- call `POST /api/auth/refresh`
- replace both tokens
- retry original request once

4. On logout:
- call `POST /api/auth/logout` with `refreshToken`
- clear local auth state

5. On reset password:
- after successful reset, force a fresh login

## 13. Suggested Frontend TypeScript Types

```ts
export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CourseVisibility = 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
export type FileType = 'MARKDOWN' | 'NOTEBOOK';

export interface ApiErrorField {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  status: 'error';
  statusCode: number;
  message: string;
  errors?: ApiErrorField[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthResponse {
  status: 'success';
  data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  };
}

export interface CourseAuthor {
  id: number;
  firstName: string;
  lastName: string;
}

export interface Course {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  category: string | null;
  fileType: FileType;
  status: CourseStatus;
  visibility: CourseVisibility;
  allowDownload: boolean;
  views: number;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string | null;
  contentHTML?: string;
  author?: CourseAuthor;
}
```

## 14. Important Integration Notes

- `register` never creates `TEACHER` directly; new users are `STUDENT`
- some routes are protected by role, not only by auth
- `forgot-password` is backend-ready but email sending is not implemented yet
- `PRIVATE` and `RESTRICTED` are enforced in the backend; frontend should still hide unavailable actions for UX clarity
- the backend returns `404` for inaccessible courses in some cases instead of `403`, intentionally hiding resource existence
- deleting a user cascades to courses

## 15. Best Frontend Pages to Build Against This API

- login page
- register page
- forgot password page
- reset password page
- public course catalogue
- teacher dashboard
- course details page by slug
- create course page
- edit course page
- admin user management page

## 16. Recommended Frontend Handoff Summary

If the frontend team wants the shortest implementation path, prioritize:

1. auth store with refresh flow
2. public course list with filters
3. course details page by `slug`
4. teacher create/edit/manage course pages
5. admin users page

