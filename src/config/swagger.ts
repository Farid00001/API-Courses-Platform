import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Courses Platform API',
      version: '1.0.0',
      description:
        'REST API for a course sharing platform with authentication, course upload/conversion, user profiles, and admin management.',
      contact: {
        name: 'API Support',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API base path',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        UserRole: {
          type: 'string',
          enum: ['ADMIN', 'TEACHER', 'STUDENT'],
        },
        CourseStatus: {
          type: 'string',
          enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
        },
        CourseVisibility: {
          type: 'string',
          enum: ['PUBLIC', 'PRIVATE', 'RESTRICTED'],
        },
        FileType: {
          type: 'string',
          enum: ['NOTEBOOK', 'MARKDOWN'],
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { $ref: '#/components/schemas/UserRole' },
            isActive: { type: 'boolean' },
            avatar: { type: 'string', nullable: true },
            bio: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CourseAuthor: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            avatar: { type: 'string', nullable: true },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            category: { type: 'string', nullable: true },
            contentHTML: { type: 'string' },
            status: { $ref: '#/components/schemas/CourseStatus' },
            visibility: { $ref: '#/components/schemas/CourseVisibility' },
            fileType: { $ref: '#/components/schemas/FileType' },
            originalFileName: { type: 'string' },
            filePath: { type: 'string' },
            allowDownload: { type: 'boolean' },
            views: { type: 'integer' },
            authorId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
            author: { $ref: '#/components/schemas/CourseAuthor' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', minLength: 8, example: 'securePass123' },
            firstName: { type: 'string', minLength: 2, example: 'John' },
            lastName: { type: 'string', minLength: 2, example: 'Doe' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'securePass123' },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['token', 'password'],
          properties: {
            token: { type: 'string' },
            password: { type: 'string', minLength: 8, example: 'NewSecurePass123' },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            firstName: { type: 'string', minLength: 2, maxLength: 50 },
            lastName: { type: 'string', minLength: 2, maxLength: 50 },
            avatar: { type: 'string', format: 'uri', nullable: true },
            bio: { type: 'string', maxLength: 1000, nullable: true },
          },
        },
        CreateCourseRequest: {
          type: 'object',
          required: ['file', 'title'],
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'Notebook (.ipynb) or Markdown (.md) file',
            },
            title: {
              type: 'string',
              minLength: 3,
              maxLength: 200,
            },
            description: {
              type: 'string',
              maxLength: 5000,
            },
            category: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
            },
            visibility: {
              $ref: '#/components/schemas/CourseVisibility',
            },
            allowDownload: {
              type: 'boolean',
              default: true,
            },
          },
        },
        UpdateCourseRequest: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200 },
            description: { type: 'string', maxLength: 5000 },
            category: { type: 'string', minLength: 2, maxLength: 100, nullable: true },
            visibility: { $ref: '#/components/schemas/CourseVisibility' },
            allowDownload: { type: 'boolean' },
          },
        },
        PublishCourseRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { $ref: '#/components/schemas/CourseStatus' },
          },
        },
        ChangeUserRoleRequest: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { $ref: '#/components/schemas/UserRole' },
          },
        },
        ChangeUserStatusRequest: {
          type: 'object',
          required: ['isActive'],
          properties: {
            isActive: { type: 'boolean' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
          },
        },
        PaginatedCourseResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'object',
              properties: {
                courses: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Course' },
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            statusCode: { type: 'integer' },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    paths: {
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          description: 'Creates a new user account. New users are always created as STUDENT.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            409: {
              description: 'Email already registered',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            401: {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh tokens',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Tokens refreshed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: {
                        type: 'object',
                        properties: {
                          accessToken: { type: 'string' },
                          refreshToken: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Explicitly logout a user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Logout successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Request password reset',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ForgotPasswordRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Reset flow triggered',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string' },
                          resetToken: { type: 'string', nullable: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/auth/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Reset password with reset token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Password reset successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'Current user profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/courses': {
        get: {
          tags: ['Courses'],
          summary: 'List courses',
          description: 'Returns paginated courses with visibility rules applied and supports filters.',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10, maximum: 100 } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'category', schema: { type: 'string' } },
            { in: 'query', name: 'authorId', schema: { type: 'integer' } },
            { in: 'query', name: 'dateFrom', schema: { type: 'string', example: '2026-05-01' } },
            { in: 'query', name: 'dateTo', schema: { type: 'string', example: '2026-05-31' } },
            { in: 'query', name: 'status', schema: { $ref: '#/components/schemas/CourseStatus' } },
          ],
          responses: {
            200: {
              description: 'Paginated list of courses',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PaginatedCourseResponse' },
                },
              },
            },
          },
        },
        post: {
          tags: ['Courses'],
          summary: 'Create a course',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: { $ref: '#/components/schemas/CreateCourseRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Course created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: {
                        type: 'object',
                        properties: {
                          course: { $ref: '#/components/schemas/Course' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/courses/mine': {
        get: {
          tags: ['Courses'],
          summary: 'List courses owned by current teacher',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'Teacher courses',
            },
          },
        },
      },
      '/courses/{slug}': {
        get: {
          tags: ['Courses'],
          summary: 'Get course by slug',
          parameters: [
            {
              in: 'path',
              name: 'slug',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Course details',
            },
            404: {
              description: 'Course not found',
            },
          },
        },
      },
      '/courses/{id}': {
        patch: {
          tags: ['Courses'],
          summary: 'Update course metadata',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateCourseRequest' },
              },
            },
          },
          responses: {
            200: { description: 'Course updated' },
          },
        },
        delete: {
          tags: ['Courses'],
          summary: 'Delete a course',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            200: { description: 'Course deleted' },
          },
        },
      },
      '/courses/{id}/duplicate': {
        post: {
          tags: ['Courses'],
          summary: 'Duplicate a course',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            201: { description: 'Course duplicated' },
          },
        },
      },
      '/courses/{id}/publish': {
        patch: {
          tags: ['Courses'],
          summary: 'Change course status',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublishCourseRequest' },
              },
            },
          },
          responses: {
            200: { description: 'Course status updated' },
          },
        },
      },
      '/courses/{id}/download': {
        get: {
          tags: ['Courses'],
          summary: 'Download original course file',
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            200: {
              description: 'Binary file download',
              content: {
                'application/octet-stream': {
                  schema: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
      },
      '/users/me': {
        patch: {
          tags: ['Users'],
          summary: 'Update current user profile',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
              },
            },
          },
          responses: {
            200: { description: 'Profile updated' },
          },
        },
      },
      '/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Get public user profile',
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            200: { description: 'User profile found' },
          },
        },
      },
      '/users/{id}/courses': {
        get: {
          tags: ['Users'],
          summary: 'Get published courses by user',
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            200: { description: 'Published courses found' },
          },
        },
      },
      '/admin/users/{id}/role': {
        patch: {
          tags: ['Admin'],
          summary: 'Change user role',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChangeUserRoleRequest' },
              },
            },
          },
          responses: {
            200: { description: 'User role updated' },
          },
        },
      },
      '/admin/users/{id}/status': {
        patch: {
          tags: ['Admin'],
          summary: 'Activate or suspend a user account',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChangeUserStatusRequest' },
              },
            },
          },
          responses: {
            200: { description: 'User status updated' },
          },
        },
      },
      '/admin/users/{id}': {
        delete: {
          tags: ['Admin'],
          summary: 'Delete a user account',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            200: { description: 'User deleted' },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication and password recovery',
      },
      {
        name: 'Courses',
        description: 'Course management, upload, filtering, duplication and download',
      },
      {
        name: 'Users',
        description: 'User profile endpoints',
      },
      {
        name: 'Admin',
        description: 'Administrative user management',
      },
    ],
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
