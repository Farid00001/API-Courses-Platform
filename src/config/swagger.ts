import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Courses Platform API',
      version: '1.0.0',
      description:
        'API REST pour la plateforme de partage de cours. Permet aux enseignants de publier des notebooks Jupyter (.ipynb) et fichiers Markdown (.md) convertis automatiquement en HTML.',
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
        // ──────────── Enums ────────────
        UserRole: {
          type: 'string',
          enum: ['ADMIN', 'TEACHER', 'STUDENT'],
        },
        CourseStatus: {
          type: 'string',
          enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
        },
        FileType: {
          type: 'string',
          enum: ['NOTEBOOK', 'MARKDOWN'],
        },

        // ──────────── Models ────────────
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { $ref: '#/components/schemas/UserRole' },
            avatar: { type: 'string', nullable: true },
            bio: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            contentHTML: { type: 'string' },
            status: { $ref: '#/components/schemas/CourseStatus' },
            fileType: { $ref: '#/components/schemas/FileType' },
            originalFileName: { type: 'string' },
            filePath: { type: 'string' },
            allowDownload: { type: 'boolean' },
            views: { type: 'integer' },
            authorId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            author: { $ref: '#/components/schemas/User' },
          },
        },

        // ──────────── Requests ────────────
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', minLength: 8, example: 'securePass123' },
            firstName: { type: 'string', minLength: 2, example: 'John' },
            lastName: { type: 'string', minLength: 2, example: 'Doe' },
            role: { $ref: '#/components/schemas/UserRole', default: 'STUDENT' },
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
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            firstName: { type: 'string', minLength: 2, maxLength: 50 },
            lastName: { type: 'string', minLength: 2, maxLength: 50 },
            avatar: { type: 'string', format: 'uri', nullable: true },
            bio: { type: 'string', maxLength: 1000, nullable: true },
          },
        },
        UpdateCourseRequest: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200 },
            description: { type: 'string', maxLength: 5000 },
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

        // ──────────── Responses ────────────
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
        SuccessResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: { type: 'object' },
          },
        },
        PaginatedResponse: {
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

    // ──────────────────────────────────────────────────────
    //  PATHS
    // ──────────────────────────────────────────────────────
    paths: {
      // ──────────── AUTH ────────────
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          description: 'Creates a new user account. Default role is STUDENT.',
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
            422: {
              description: 'Validation error',
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
          description: 'Authenticates a user and returns JWT tokens.',
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
          summary: 'Refresh access token',
          description: 'Uses a refresh token to get a new access token pair.',
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
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            401: {
              description: 'Invalid or expired refresh token',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
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
          description: 'Returns the authenticated user profile.',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'Current user data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Not authenticated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },

      // ──────────── COURSES ────────────
      '/courses': {
        get: {
          tags: ['Courses'],
          summary: 'List published courses',
          description:
            'Returns a paginated list of published courses. Supports search by title/description (ILIKE).',
          parameters: [
            {
              in: 'query',
              name: 'page',
              schema: { type: 'integer', default: 1 },
              description: 'Page number',
            },
            {
              in: 'query',
              name: 'limit',
              schema: { type: 'integer', default: 10, maximum: 100 },
              description: 'Items per page',
            },
            {
              in: 'query',
              name: 'search',
              schema: { type: 'string' },
              description: 'Search term (matches title and description)',
            },
            {
              in: 'query',
              name: 'status',
              schema: { $ref: '#/components/schemas/CourseStatus' },
              description: 'Filter by status (default: PUBLISHED)',
            },
          ],
          responses: {
            200: {
              description: 'Paginated list of courses',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PaginatedResponse' },
                },
              },
            },
          },
        },
        post: {
          tags: ['Courses'],
          summary: 'Create a new course',
          description:
            'Upload a .ipynb or .md file to create a course. The file is converted to HTML automatically. Requires TEACHER role.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
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
                    allowDownload: {
                      type: 'boolean',
                      default: true,
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Course created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: { $ref: '#/components/schemas/Course' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'No file uploaded or invalid file type',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            401: { description: 'Not authenticated' },
            403: { description: 'Not a TEACHER' },
          },
        },
      },
      '/courses/mine': {
        get: {
          tags: ['Courses'],
          summary: 'List my courses (TEACHER)',
          description:
            'Returns all courses belonging to the authenticated teacher, regardless of status.',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'List of teacher courses',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Course' },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'Not authenticated' },
            403: { description: 'Not a TEACHER' },
          },
        },
      },
      '/courses/{slug}': {
        get: {
          tags: ['Courses'],
          summary: 'Get course by slug',
          description:
            'Returns the full course data including HTML content. Increments view count.',
          parameters: [
            {
              in: 'path',
              name: 'slug',
              required: true,
              schema: { type: 'string' },
              description: 'Course URL slug',
            },
          ],
          responses: {
            200: {
              description: 'Course details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: { $ref: '#/components/schemas/Course' },
                    },
                  },
                },
              },
            },
            404: {
              description: 'Course not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/courses/{id}': {
        patch: {
          tags: ['Courses'],
          summary: 'Update course metadata',
          description:
            'Update title, description, or allowDownload. Only the course owner (TEACHER) can update.',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Course ID',
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
            200: {
              description: 'Course updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: { $ref: '#/components/schemas/Course' },
                    },
                  },
                },
              },
            },
            401: { description: 'Not authenticated' },
            403: { description: 'Not the course owner' },
            404: { description: 'Course not found' },
          },
        },
        delete: {
          tags: ['Courses'],
          summary: 'Delete a course',
          description:
            'Permanently deletes a course and its associated file. Only the course owner (TEACHER) can delete.',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Course ID',
            },
          ],
          responses: {
            200: {
              description: 'Course deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            401: { description: 'Not authenticated' },
            403: { description: 'Not the course owner' },
            404: { description: 'Course not found' },
          },
        },
      },
      '/courses/{id}/publish': {
        patch: {
          tags: ['Courses'],
          summary: 'Change publication status',
          description:
            'Set course status to PUBLISHED, DRAFT, or ARCHIVED. Only the course owner (TEACHER) can change status.',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Course ID',
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
            200: {
              description: 'Status updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: { $ref: '#/components/schemas/Course' },
                    },
                  },
                },
              },
            },
            401: { description: 'Not authenticated' },
            403: { description: 'Not the course owner' },
            404: { description: 'Course not found' },
          },
        },
      },
      '/courses/{id}/download': {
        get: {
          tags: ['Courses'],
          summary: 'Download source file',
          description:
            'Downloads the original .ipynb or .md source file. Only available if allowDownload is true (or if the requester is the owner).',
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Course ID',
            },
          ],
          responses: {
            200: {
              description: 'File download',
              content: {
                'application/octet-stream': {
                  schema: { type: 'string', format: 'binary' },
                },
              },
            },
            403: { description: 'Downloads disabled for this course' },
            404: { description: 'Course or file not found' },
          },
        },
      },

      // ──────────── USERS ────────────
      '/users/me': {
        patch: {
          tags: ['Users'],
          summary: 'Update my profile',
          description: 'Update the authenticated user profile fields.',
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
            200: {
              description: 'Profile updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: { description: 'Not authenticated' },
          },
        },
      },
      '/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Get public user profile',
          description: 'Returns a public user profile by ID.',
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'User ID',
            },
          ],
          responses: {
            200: {
              description: 'User profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            404: { description: 'User not found' },
          },
        },
      },
      '/users/{id}/courses': {
        get: {
          tags: ['Users'],
          summary: 'Get published courses by user',
          description: 'Returns all published courses for a given user.',
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'User ID',
            },
          ],
          responses: {
            200: {
              description: 'List of published courses',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Course' },
                      },
                    },
                  },
                },
              },
            },
            404: { description: 'User not found' },
          },
        },
      },
    },

    tags: [
      {
        name: 'Auth',
        description: 'Authentication: register, login, refresh tokens',
      },
      {
        name: 'Courses',
        description:
          'Course CRUD, file upload (.ipynb/.md), conversion to HTML, publish/draft/archive',
      },
      {
        name: 'Users',
        description: 'User profiles and public course listings',
      },
    ],
  },
  apis: [], // We define everything inline, no need to scan files
};

export const swaggerSpec = swaggerJsdoc(options);
