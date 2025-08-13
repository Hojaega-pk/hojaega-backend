# Service Provider API Documentation
## Testing the API

Download Postman desktop since local host requests only work on desktop make sure to run the project in background otherwise postman won't give any response.

## Overview
This API provides endpoints for managing service providers. It's built with Node.js, Express, and TypeORM(for now will be replaced by Prisma), using SQLite as the database(will be replace by Postgres).

Base URL: `http://localhost:3000` (Development for now)
After Hojaega.pk gets deployed it will change to 'http://hojaega.pk'

## Authentication
Currently, no authentication is required for any endpoints.

## Common Response Format
All API responses follow this structure:
```json
{
  "success": boolean,
  "data": any,
  "count": number,
  "message": string
}
```

## Error Response Format
```json
{
  "success": false,
  "message": string,
  "error": string
}
```

---

## Endpoints

### 1. Health Check
GET `/health`

Check if the API is running.

Response:
```json
{
  "status": "OK",
  "message": "Service Provider API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

---

### 2. Create Service Provider
POST `/api/sp-create`

Create a new service provider.

Request Body:
```json
{
  "name": "string (required)",
  "city": "string (required)",
  "skillset": "string (required)",
  "contactNo": "string (required)",
  "email": "string (optional)",
  "description": "string (optional)",
  "experience": "string (optional)",
  "hourlyRate": "number (optional)"
}
```

Example Request:
```json
{
  "name": "Ahmed Khan",
  "city": "Karachi",
  "skillset": "Plumbing",
  "contactNo": "+92-300-1234567",
  "email": "ahmed@example.com",
  "description": "Professional plumber with 5 years experience",
  "experience": "5 years",
  "hourlyRate": 25.50
}
```

Response (201 Created):
```json
{
  "success": true,
  "message": "Service provider created successfully",
  "data": {
    "id": 1,
    "name": "Ahmed Khan",
    "city": "Karachi",
    "skillset": "Plumbing",
    "contactNo": "+92-300-1234567",
    "email": "ahmed@example.com",
    "description": "Professional plumber with 5 years experience",
    "experience": "5 years",
    "hourlyRate": 25.50,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

Validation Rules:
- `name`, `city`, `skillset`, `contactNo` are required
- `contactNo` must be unique among active providers
- `hourlyRate` should be a positive number

---

### 3. List All Service Providers
GET `/api/sp-list`

Get all active service providers.

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Ahmed Khan",
      "city": "Karachi",
      "skillset": "Plumbing",
      "contactNo": "+92-300-1234567",
      "email": "ahmed@example.com",
      "description": "Professional plumber with 5 years experience",
      "experience": "5 years",
      "hourlyRate": 25.50,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1,
  "message": "Service providers retrieved successfully"
}
```

Notes:
- Only returns active providers (`isActive: true`)
- Results are sorted by creation date (newest first)
- No pagination implemented yet

---

### 4. Get Service Provider by ID
GET `/api/sp-get/{id}`

Get a specific service provider by their ID.

Path Parameters:
- `id` - Service provider ID (number)

Example: `GET /api/sp-get/1`

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Ahmed Khan",
    "city": "Karachi",
    "skillset": "Plumbing",
    "contactNo": "+92-300-1234567",
    "email": "ahmed@example.com",
    "description": "Professional plumber with 5 years experience",
    "experience": "5 years",
    "hourlyRate": 25.50,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

Error Response (404):
```json
{
  "success": false,
  "message": "Service provider not found"
}
```

---

### 5. Update Service Provider
PUT `/api/sp-update/{id}`

Update an existing service provider.

Path Parameters:
- `id` - Service provider ID (number)

Request Body: Same as create endpoint

Example: `PUT /api/sp-update/1`

Response:
```json
{
  "success": true,
  "message": "Service provider updated successfully",
  "data": {
    "id": 1,
    "name": "Ahmed Khan Updated",
    "city": "Karachi",
    "skillset": "Plumbing",
    "contactNo": "+92-300-1234567",
    "email": "ahmed.updated@example.com",
    "description": "Updated description",
    "experience": "6 years",
    "hourlyRate": 30.00,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 6. Delete Service Provider
DELETE `/api/sp-delete/{id}`

Soft delete a service provider (sets `isActive` to false).

Path Parameters:
- `id` - Service provider ID (number)

Example: `DELETE /api/sp-delete/1`

Response:
```json
{
  "success": true,
  "message": "Service provider deleted successfully"
}
```

Notes:
- This is a soft delete - the record remains in the database
- Deleted providers won't appear in list/filter results
- Can be restored by updating `isActive` to true

---

### 7. Filter Service Providers
POST `/api/sp-filter`

Advanced filtering and searching for service providers. This endpoint replaces the old city, skillset, and search endpoints.

Request Body:
```json
{
  "city": "string (optional)",
  "skillset": "string (optional)",
  "experience": "string (optional)",
  "hourlyRateMin": "number (optional)",
  "hourlyRateMax": "number (optional)",
  "name": "string (optional)",
  "search": "string (optional)"
}
```

All fields are optional. Use any combination you need.

#### Filter Parameters Explained:

- `city`: Exact city match (case-insensitive)
- `skillset`: Partial skillset match (case-insensitive)
- `experience`: Exact experience match
- `hourlyRateMin`: Minimum hourly rate
- `hourlyRateMax`: Maximum hourly rate
- `name`: Partial name match (case-insensitive)
- `search`: General search across name, city, and skillset (case-insensitive)

#### Usage Examples:

1. Filter by City Only:
```json
{
  "city": "Karachi"
}
```

2. Filter by Skillset Only:
```json
{
  "skillset": "plumbing"
}
```

3. Filter by Hourly Rate Range:
```json
{
  "hourlyRateMin": 20,
  "hourlyRateMax": 50
}
```

4. Search by Name:
```json
{
  "name": "Ahmed"
}
```

5. General Search (replaces old search API):
```json
{
  "search": "plumber karachi"
}
```

6. Complex Filter:
```json
{
  "city": "Lahore",
  "skillset": "electrical",
  "experience": "3 years",
  "hourlyRateMin": 25,
  "search": "professional"
}
```

7. Empty Body (Get All Active Providers):
```json
{}
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Ahmed Khan",
      "city": "Karachi",
      "skillset": "Plumbing",
      "contactNo": "+92-300-1234567",
      "email": "ahmed@example.com",
      "description": "Professional plumber with 5 years experience",
      "experience": "5 years",
      "hourlyRate": 25.50,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1,
  "message": "Filtered service providers retrieved successfully"
}
```

Filter Logic:
- All filters use AND logic (all conditions must be met)
- City and name searches are case-insensitive
- Skillset and search use partial matching with wildcards
- Hourly rate filters support ranges and individual min/max values
- Only active providers are returned

---

### 8. Get Statistics
GET `/api/sp-stats`

Get statistics about service providers.

Response:
```json
{
  "success": true,
  "data": {
    "totalProviders": 10,
    "byCity": [
      {
        "city": "Karachi",
        "count": 5
      },
      {
        "city": "Lahore",
        "count": 3
      },
      {
        "city": "Islamabad",
        "count": 2
      }
    ],
    "bySkillset": [
      {
        "skillset": "Plumbing",
        "count": 4
      },
      {
        "skillset": "Electrical",
        "count": 3
      },
      {
        "skillset": "Carpentry",
        "count": 3
      }
    ]
  },
  "message": "Service provider statistics retrieved successfully"
}
```

---

## Data Models

### ServiceProvider Entity
```typescript
interface ServiceProvider {
  id: number;                    // Auto-generated unique ID
  name: string;                  // Provider's full name
  city: string;                  // City where provider operates
  skillset: string;              // Skills/expertise area
  contactNo: string;             // Phone number
  email?: string;                // Email address (optional)
  description?: string;           // Detailed description (optional)
  experience?: string;           // Years of experience (optional)
  hourlyRate?: number;           // Hourly rate in currency (optional)
  isActive: boolean;             // Active status (true/false)
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

---

## HTTP Status Codes

- 200 - OK (Success)
- 201 - Created (Resource created successfully)
- 400 - Bad Request (Invalid input)
- 404 - Not Found (Resource not found)
- 409 - Conflict (Duplicate contact number)
- 500 - Internal Server Error (Server error)

---

## Notes

- All timestamps are in ISO 8601 format
- City searches are case-insensitive
- The API automatically handles soft deletes
- No pagination implemented yet (returns all results)
- CORS is enabled for localhost development
- Database is SQLite (file-based, no separate server needed)

---


