# Service Provider & Consumer API Documentation
## Testing the API

Download Postman desktop since local host requests only work on desktop make sure to run the project in background otherwise postman won't give any response.

## Overview
This API provides endpoints for managing service providers and consumers. It's built with Node.js, Express, and Prisma ORM, using SQLite as the database.

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

## API Endpoints Summary

### Service Providers
- `POST /api/sp-create` - Create a new service provider
- `GET /api/sp-list` - Get all service providers
- `GET /api/sp-get/{id}` - Get service provider by ID
- `PUT /api/sp-update/{id}` - Update service provider
- `DELETE /api/sp-delete/{id}` - Delete service provider
- `POST /api/sp-filter` - Filter service providers
- `GET /api/sp-stats` - Get service provider statistics
- `GET /api/cities` - Get unique cities
- `GET /api/sp-pending` - Get pending service providers
- `GET /api/sp-subscription-status/{id}` - Get subscription status
- `POST /api/sp-renew-subscription/{id}` - Renew subscription
- `POST /api/sp-signin` - Sign in service provider with PIN

### Consumers
- `POST /api/consumer-create` - Create a new consumer
- `POST /api/consumer-signin` - Sign in consumer with PIN

### OTP
- `POST /api/otp/request` - Request an OTP code
- `POST /api/otp/verify` - Verify an OTP code

### Health & Documentation
- `GET /health` - Health check endpoint
- `GET /api-docs` - API documentation (Swagger UI)

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
  "pin": "string (required)",
  "description": "string (optional)",
  "experience": "string (optional)",
  "screenshot": "string (optional)"
}
```

Example Request:
```json
{
  "name": "Ahmed Khan",
  "city": "Karachi",
  "skillset": "Plumbing",
  "contactNo": "+92-300-1234567",
  "pin": "567890",
  "description": "Professional plumber with 5 years experience",
  "experience": "5 years",
  "screenshot": "http://localhost:3000/images/payment_proof.jpg"
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
    "pin": "567890",
    "description": "Professional plumber with 5 years experience",
    "experience": "5 years",
    "screenshot": "http://localhost:3000/images/payment_proof.jpg",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

Validation Rules:
- `name`, `city`, `skillset`, `contactNo`, `pin` are required
- `pin` must be exactly 6 digits (0-9)
- `contactNo` must be unique among active providers

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
    "description": "Professional plumber with 5 years experience",
    "experience": "5 years",
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
    "description": "Updated description",
    "experience": "6 years",
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
  "name": "string (optional)",
  "search": "string (optional)"
}
```

All fields are optional. Use any combination you need.

#### Filter Parameters Explained:

- `city`: Exact city match (case-insensitive)
- `skillset`: Partial skillset match (case-insensitive)
- `experience`: Exact experience match
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
      "description": "Professional plumber with 5 years experience",
      "experience": "5 years",
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

### 9. Get Cities List
GET `/api/cities`

Get a list of unique cities where service providers are available.

Response:
```json
{
  "success": true,
  "data": [
    "Islamabad",
    "Karachi",
    "Lahore"
  ],
  "count": 3,
  "message": "Cities list retrieved successfully"
}
```

Notes:
- Only returns cities where active service providers exist
- Cities are sorted alphabetically (A-Z)
- No duplicate cities in the response
- Useful for populating city dropdowns or filters

---

### 10. Get Pending Service Providers
GET `/api/sp-pending`

Get all service providers whose subscriptions have expired and need payment renewal.

**Purpose**: Identifies service providers with expired subscriptions who need to complete payment to continue services.

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
      "isActive": true,
      "status": 0,
      "subscriptionStartDate": "2024-01-01T00:00:00.000Z",
      "subscriptionEndDate": "2024-02-01T00:00:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "message": "Subscription period ended. Please complete your payment to continue services.",
      "daysExpired": 5
    }
  ],
  "count": 1,
  "message": "Found 1 service providers with expired subscriptions"
}
```

**Response Fields Explained**:
- `status`: 0 = expired subscription, 1 = active subscription
- `subscriptionStartDate`: When the subscription began
- `subscriptionEndDate`: When the subscription expired
- `message`: Clear instruction for the service provider
- `daysExpired`: Number of days since subscription expired

**Notes**:
- Automatically updates expired subscriptions (status: 1 → 0)
- Only returns active service providers (`isActive: true`)
- Results are sorted by subscription end date (earliest expired first)
- Useful for payment collection and subscription management

---

### 11. Get Subscription Status
GET `/api/sp-subscription-status/{id}`

Get detailed subscription information for a specific service provider.

**Purpose**: Check the current subscription status, expiry dates, and remaining days for a specific service provider.

Path Parameters:
- `id` - Service provider ID (number)

Example: `GET /api/sp-subscription-status/1`

Response:
```json
{
  "success": true,
  "data": {
    "providerId": 1,
    "name": "Ahmed Khan",
    "status": 1,
    "isExpired": false,
    "daysUntilExpiry": 15,
    "subscriptionStartDate": "2024-01-01T00:00:00.000Z",
    "subscriptionEndDate": "2024-02-01T00:00:00.000Z",
    "message": "Subscription active. 15 days remaining."
  }
}
```

**Response Fields Explained**:
- `status`: 1 = active, 0 = expired
- `isExpired`: Boolean indicating if subscription has expired
- `daysUntilExpiry`: Days remaining for active subscriptions
- `message`: Human-readable status message

**Status Messages**:
- **Active**: "Subscription active. X days remaining."
- **Expired**: "Subscription period ended. Please complete your payment to continue services."

**Use Cases**:
- Check subscription status before booking services
- Monitor subscription health
- Payment reminder systems
- Customer support inquiries

---

### 12. Renew Subscription(Incomplete ,payment method??)
POST `/api/sp-renew-subscription/{id}`

Renew a service provider's subscription for a specified number of months.

**Purpose**: Extend a service provider's subscription period after payment is received.

Path Parameters:
- `id` - Service provider ID (number)

Request Body:
```json
{
  "months": 3,
  "screenshot": "http://localhost:3000/images/payment_proof_123.jpg"
}
```

**Request Fields**:
- `months`: Number of months to extend subscription (default: 1 if not specified)
- `screenshot`: Image URL for payment proof (required)

Example: `POST /api/sp-renew-subscription/1`

Response:
```json
{
  "success": true,
  "message": "Subscription renewed successfully for 3 month(s)"
}
```

**What Happens When Renewing**:
1. `status` is updated from 0 to 1 (expired → active)
2. `subscriptionStartDate` is set to current date
3. `subscriptionEndDate` is extended by specified months
4. Provider becomes active again immediately
5. Payment proof screenshot is stored for verification

**Important Notes**:
- Screenshot is **required** for subscription renewal
- Must be a valid URL pointing to a payment proof image
- Example format: `http://localhost:3000/api/images/payment_proof_123.jpg`

**Example Renewal Scenarios**:
- 1 month renewal: Extends by 30 days
- 3 month renewal: Extends by 90 days
- 6 month renewal: Extends by 180 days
- 12 month renewal: Extends by 365 days

**Error Response (400 - Missing Screenshot)**:
```json
{
  "success": false,
  "message": "Screenshot is required and must be a valid URL string"
}
```

**Error Response (400 - Invalid URL)**:
```json
{
  "success": false,
  "message": "Screenshot must be a valid URL"
}
```

**Error Response (404)**:
```json
{
  "success": false,
  "message": "Service provider not found or renewal failed"
}
```

---

### 13. Create Consumer
POST `/api/consumer-create`

Create a new consumer with name, city, and 6-digit PIN.

**Purpose**: Register new consumers who can use the platform to find service providers.

Request Body:
```json
{
  "name": "string (required)",
  "city": "string (required)",
  "pin": "string (required)"
}
```

**Request Fields**:
- `name`: Consumer's full name (required)
- `city`: Consumer's city (required)
- `pin`: 6-digit PIN code (required, exactly 6 digits 0-9)

Example Request:
```json
{
  "name": "John Doe",
  "city": "Karachi",
      "pin": "123456"
}
```

Response (201 Created):
```json
{
  "success": true,
  "message": "Consumer created successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "city": "Karachi",
    "pin": "123456",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Validation Rules**:
- `name`, `city`, and `pin` are required
- `name` and `city` cannot be empty strings
- `pin` must be exactly 4 digits (0-9)
- Consumer with same name and city combination cannot exist

**Error Response (400 - Validation Error)**:
```json
{
  "error": "Name, city and pin are required",
  "message": "Name, city and pin fields must be provided"
}
```

**Error Response (400 - Invalid PIN)**:
```json
{
  "error": "Invalid pin format",
  "message": "Pin must be exactly 4 digits (0-9)"
}
```

**Error Response (409 - Duplicate Consumer)**:
```json
{
  "error": "Consumer already exists",
  "message": "A consumer with this name and city already exists"
}
```

---

### 14. Service Provider Sign In
POST `/api/sp-signin`

Sign in an existing service provider using their 4-digit PIN.

**Purpose**: Authenticate service providers to access their account information and services.

Request Body:
```json
{
  "pin": "string (required, 4 digits)"
}
```

**Request Fields**:
- `pin`: 4-digit PIN code (required, exactly 4 digits 0-9)

Example Request:
```json
{
  "pin": "1234"
}
```

Response (200 OK):
```json
{
  "success": true,
  "message": "Service provider signed in successfully",
  "data": {
    "id": 1,
    "name": "Ahmed Khan",
    "city": "Karachi",
    "skillset": "Plumbing",
    "contactNo": "+92-300-1234567",
    "description": "Professional plumber with 5 years experience",
    "experience": "5 years",
    "isActive": true,
    "status": 1,
    "subscriptionStartDate": "2024-01-01T00:00:00.000Z",
    "subscriptionEndDate": "2024-02-01T00:00:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Validation Rules**:
- `pin` is required
- `pin` must be exactly 4 digits (0-9)
- PIN must match an existing active service provider record
- Only active service providers (`isActive: true`) can sign in

**Error Response (400 - Validation Error)**:
```json
{
  "error": "PIN is required",
  "message": "PIN field must be provided"
}
```

**Error Response (400 - Invalid PIN)**:
```json
{
  "error": "Invalid pin format",
  "message": "PIN must be exactly 6 digits (0-9)"
}
```

**Error Response (401 - Invalid Credentials)**:
```json
{
  "error": "Invalid credentials",
  "message": "PIN is incorrect or no active service provider found with this PIN"
}
```

**Use Cases**:
- Service provider authentication before accessing services
- Account verification
- Session management
- Security validation

---

### 15. Consumer Sign In
POST `/api/consumer-signin`

Sign in an existing consumer using their 6-digit PIN.

**Purpose**: Authenticate consumers to access their account information and services.

Request Body:
```json
{
  "pin": "string (required)"
}
```

**Request Fields**:
- `pin`: 6-digit PIN code (required, exactly 6 digits 0-9)

Example Request:
```json
{
  "pin": "123456"
}
```

Response (200 OK):
```json
{
  "success": true,
  "message": "Consumer signed in successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "city": "Karachi",
    "pin": "123456",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Validation Rules**:
- `pin` is required
- `pin` must be exactly 6 digits (0-9)
- PIN must match an existing consumer record

**Error Response (400 - Validation Error)**:
```json
{
  "error": "PIN is required",
  "message": "PIN field must be provided"
}
```

**Error Response (400 - Invalid PIN)**:
```json
{
  "error": "Invalid pin format",
  "message": "PIN must be exactly 6 digits (0-9)"
}
```

**Error Response (401 - Invalid Credentials)**:
```json
{
  "error": "Invalid credentials",
  "message": "Name, city, or PIN is incorrect"
}
```

**Use Cases**:
- Consumer authentication before accessing services
- Account verification
- Session management
- Security validation

---

### 16. Serve Payment Proof Images
GET `/api/images/{filename}`

Serve payment proof images for subscription renewals.

**Purpose**: Display payment proof images when viewing subscription details.

Path Parameters:
- `filename` - Image filename (e.g., payment_proof_123.jpg)

Example: `GET /api/images/payment_proof_123.jpg`

Response:
```json
{
  "success": true,
  "message": "Image payment_proof_123.jpg requested",
  "note": "This endpoint will serve actual image files in production"
}
```

**Notes**:
- Currently returns placeholder response
- In production, will serve actual image files
- Images should be stored in a secure location
- Consider implementing authentication for sensitive images

---

### 17. Request OTP
POST `/api/otp/request`

Request an OTP code for various purposes.

Request Body:
```json
{
  "contactNo": "string (required)",
  "purpose": "SP_SIGNIN | CONSUMER_SIGNIN | GENERIC (optional, default: GENERIC)",
  "length": 6,
  "ttlSeconds": 300
}
```

Behavior:
- For `SP_SIGNIN`: OTP is generated only if the service provider with this `contactNo` exists; otherwise returns 404.
- For other purposes (e.g., `GENERIC`, `CONSUMER_SIGNIN`): If an account already exists with this `contactNo`, returns 409 and does not generate OTP.

Validation Rules:
- `contactNo` must be 6-15 digits.
- `length` is clamped between 4 and 8 (default 6).
- `ttlSeconds` is clamped between 60 and 900 (default 300 seconds).

Responses:
- 201 Created
```json
{
  "success": true,
  "message": "OTP generated",
  "data": {
    "id": 123,
    "contactNo": "922003753912",
    "purpose": "SP_SIGNIN",
    "expiresAt": "2024-01-15T10:35:00.000Z",
    "code": "123456" // Returned only in non-production environments
  }
}
```
- 404 Not Found (for `SP_SIGNIN` when account not found)
```json
{ "success": false, "message": "No account found with this contact number" }
```
- 409 Conflict (for non-`SP_SIGNIN` when account exists)
```json
{ "success": false, "message": "Account with this contact number already exists" }
```
- 400 Bad Request (validation errors)
- 500 Internal Server Error

---

### 18. Verify OTP
POST `/api/otp/verify`

Verify a previously generated OTP code.

Request Body:
```json
{
  "contactNo": "string (required)",
  "purpose": "SP_SIGNIN | CONSUMER_SIGNIN | GENERIC (optional, default: GENERIC)",
  "code": "numeric string 4-8 digits (required)"
}
```

Responses:
- 200 OK
```json
{ "success": true, "message": "OTP verified" }
```
- 404 Not Found (no active OTP found)
```json
{ "success": false, "message": "No active OTP found" }
```
- 400 Bad Request (expired OTP or missing fields)
```json
{ "success": false, "message": "OTP expired" }
```
- 401 Unauthorized (invalid OTP)
```json
{ "success": false, "message": "Invalid OTP" }
```
- 500 Internal Server Error

---

## Subscription System Overview

### How Subscriptions Work

1. **New Service Provider Creation**:
   - Automatically gets 1-month subscription
   - `status` set to 1 (active)
   - `subscriptionStartDate` = current date
   - `subscriptionEndDate` = current date + 1 month

2. **Subscription Lifecycle**:
   ```
   Active (status: 1) → Expires → Pending (status: 0) → Renewed → Active again
   ```

3. **Automatic Status Updates**:
   - Pending API automatically detects expired subscriptions
   - Updates status from 1 to 0 when subscription period ends
   - No manual intervention required

### Subscription Status Values

- **1**: Active subscription (can provide services)
- **0**: Expired subscription (needs payment renewal)

### Business Benefits

- **Automated Management**: No manual subscription tracking needed
- **Payment Collection**: Clear identification of providers needing payment
- **Service Continuity**: Providers can't operate without active subscription
- **Revenue Tracking**: Monitor subscription renewals and payments
- **Customer Experience**: Clear communication about subscription status

---

## Data Models

### ServiceProvider Entity (Updated)
```typescript
interface ServiceProvider {
  id: number;                    // Auto-generated unique ID
  name: string;                  // Provider's full name
  city: string;                  // City where provider operates
  skillset: string;              // Skills/expertise area
  contactNo: string;             // Phone number
  pin: string;                   // 6-digit PIN code
  description?: string;           // Detailed description (optional)
  experience?: string;           // Years of experience (optional)
  screenshot?: string;           // Payment proof image URL (optional)
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

**Fields**:
- `pin`: 6-digit PIN code for authentication
- `screenshot`: Optional payment proof image URL

### Consumer Entity
```typescript
interface Consumer {
  id: number;                    // Auto-generated unique ID
  name: string;                  // Consumer's full name
  city: string;                  // Consumer's city
  pin: string;                   // 6-digit PIN code
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

**Fields**:
- `name`: Consumer's full name (required)
- `city`: Consumer's city (required)
- `pin`: 6-digit PIN code for authentication (required)

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


