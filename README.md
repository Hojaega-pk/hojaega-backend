# Hojaega Backend API

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green" alt="Node.js Version" />
  <img src="https://img.shields.io/badge/TypeScript-5.9+-blue" alt="TypeScript Version" />
  <img src="https://img.shields.io/badge/Express-5.1+-red" alt="Express Version" />
  <img src="https://img.shields.io/badge/Prisma-6.14+-purple" alt="Prisma Version" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-blue" alt="Database" />
</p>

A robust and scalable REST API backend for [Hojaega.pk](https://hojaega.pk), built with Express.js, TypeScript, and Prisma ORM. This API provides comprehensive services for managing service providers, consumers, OTP verification, and SMS functionality.

## 🚀 Features

### Core Functionality
- **Service Provider Management** - Complete CRUD operations with advanced filtering
- **Consumer Management** - User registration and authentication with PIN-based security
- **Subscription Management** - Handle service provider subscriptions and renewals
- **OTP System** - Multi-purpose OTP generation and verification
- **SMS Integration** - TextBee SMS gateway integration
- **Payment Processing** - File upload and payment verification

### Technical Features
- **Type Safety** - Full TypeScript implementation with Prisma ORM
- **API Documentation** - Swagger/OpenAPI 3.0 specification
- **Security** - Helmet, rate limiting, CORS protection
- **Validation** - Comprehensive input validation and error handling
- **Production Ready** - Separate development and production configurations
- **Database Migrations** - Automated schema management with Prisma

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.1+
- **Language**: TypeScript 5.9+
- **Database**: PostgreSQL with Prisma ORM 6.14+
- **Security**: Helmet, Express Rate Limit, CORS
- **Documentation**: Swagger/OpenAPI 3.0
- **SMS**: TextBee API integration
- **Validation**: Custom validation middleware
- **Testing**: Jest for unit and e2e testing

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- PostgreSQL database
- TextBee API credentials (for SMS functionality)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd hojaega-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hojaega_db"

# SMS Configuration
TEXTBEE_DEVICE_ID="your_device_id"
TEXTBEE_API_KEY="your_api_key"

# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Reset database
npm run db:reset
```

### 5. Start the Application
```bash
# Development mode
npm run dev

# Production mode
npm run build:prod
npm start
```

## 📚 API Endpoints

### Service Provider Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sp-create` | Create a new service provider |
| `GET` | `/api/sp-list` | Get all service providers |
| `GET` | `/api/sp-get/{id}` | Get service provider by ID |
| `PUT` | `/api/sp-update/{id}` | Update service provider |
| `DELETE` | `/api/sp-delete/{id}` | Delete service provider |
| `POST` | `/api/sp-filter` | Filter service providers |
| `GET` | `/api/sp-stats` | Get service provider statistics |
| `GET` | `/api/cities` | Get unique cities |
| `GET` | `/api/sp-pending` | Get pending service providers |
| `GET` | `/api/sp-subscription-status/{id}` | Get subscription status |
| `POST` | `/api/sp-renew-subscription/{id}` | Renew subscription |
| `POST` | `/api/payment-upload` | Upload payment documents |
| `POST` | `/api/sp-signin` | Service provider authentication |

### Consumer Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/consumer-create` | Create a new consumer |
| `POST` | `/api/consumer-signin` | Consumer authentication with PIN |
| `POST` | `/api/forgot-password` | Reset PIN for consumers and service providers |

### OTP Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/otp/request` | Request OTP for various purposes |
| `POST` | `/api/otp/verify` | Verify OTP code |
| `POST` | `/api/otp/pin-reset-request` | Request PIN reset OTP |

### SMS Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/sms/send` | Send SMS messages via TextBee |

### Utility Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check endpoint |
| `GET` | `/api/docs` | Swagger API documentation |
| `GET` | `/` | API information and endpoint list |

## 🔧 Development

### Available Scripts
```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run build:prod   # Production build with cleanup

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:deploy    # Deploy migrations to production
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database (development only)

# Testing
npm run test         # Run unit tests
npm run test:api     # Run API tests

# Deployment
npm run render:build # Build for Render deployment
```

### Project Structure
```
src/
├── config/              # Configuration files
├── entities/            # Database entity models
├── middleware/          # Custom middleware
├── routes/              # API route handlers
├── services/            # Business logic services
├── sms/                 # SMS-related functionality
├── index.ts             # Development entry point
├── index.prod.ts        # Production entry point
└── swagger.ts           # Swagger configuration
```

## 🚀 Deployment

### Production Build
```bash
npm run build:prod
```

### Environment Variables (Production)
```env
NODE_ENV=production
DATABASE_URL="your_production_database_url"
TEXTBEE_DEVICE_ID="your_device_id"
TEXTBEE_API_KEY="your_api_key"
```

### Docker Deployment
```bash
# Build Docker image
docker build -t hojaega-backend .

# Run container
docker run -p 3000:3000 hojaega-backend
```

## 📖 API Documentation

The API is fully documented using Swagger/OpenAPI 3.0. After starting the server, access the interactive documentation at:

- **Development**: `http://localhost:3000/api/docs`
- **Production**: `https://hojaega.pk/api/docs`

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run API tests
npm run test:api

# Run e2e tests
npm run test:e2e
```

## 🔒 Security Features

- **Helmet.js** - Security headers
- **Rate Limiting** - API rate limiting (100 requests per 15 minutes)
- **CORS Protection** - Configurable cross-origin resource sharing
- **Input Validation** - Comprehensive request validation
- **SQL Injection Protection** - Prisma ORM with parameterized queries

## 📊 Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities include:

- **ServiceProvider** - Service provider information and subscriptions
- **Consumer** - Consumer user accounts
- **OtpCode** - OTP generation and verification
- **Subscription** - Service provider subscription management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- **Website**: [https://hojaega.pk](https://hojaega.pk)
- **API Documentation**: Available at `/api/docs` endpoint
- **Issues**: Please use the GitHub issues page

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added OTP system and SMS integration
- **v1.2.0** - Enhanced security and production optimizations

---

**Built with ❤️ for [Hojaega.pk](https://hojaega.pk)**
