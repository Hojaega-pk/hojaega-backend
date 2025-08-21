
# Docker Desktop Setup Guide for hojaega-backend

## 1. Services Overview
- The project uses Docker Compose to run:
  - PostgreSQL database (`db`)
  - Node.js backend (`backend`)
  - Prisma Studio (`prisma-studio`)
  - ngrok tunnel (`ngrok`)

## 2. Environment Variables
- For Docker Compose, set your `.env` file:
  ```
  DATABASE_URL="postgresql://postgres:hojaega@db:5432/hojaega_db?schema=public"
  ```
- For local development (outside Docker), use:
  ```
  DATABASE_URL="postgresql://postgres:hojaega@localhost:5432/hojaega_db?schema=public"
  ```
- Change the password if needed.

## 3. Building and Running Containers
- Build and start all services:
  ```
  docker-compose up -d --build
  ```
- Stop all services:
  ```
  docker-compose down
  ```

## 4. Prisma Migrations

- run prisma migration locally before building the containers 
    npx prisma migrate dev

## 5. Prisma Studio
- Prisma Studio is available at [http://localhost:5555](http://localhost:5555) when the `prisma-studio` service is running.

## 6. ngrok Tunnel
- The ngrok service exposes your backend to the internet.
- Check the ngrok dashboard for your public forwarding URL at [http://localhost:4040/inspect/http]

## 7. Screenshots Directory
- The `screenshots` directory is mounted from your host to the backend container for file uploads.

---

**Note:** If you change the database password or other environment variables, update them in both your `.env` file and `docker-compose.yml`.



## 8. After making changes to the code or to the schema.prisma, just rebuild the image:

docker-compose up -d --build


## 9. Common Issues & Solutions
- **Can't reach database at `db:5432`**: Make sure both services are running with Docker Compose and your `.env` uses `db` as the host.
- **Prisma Studio not reachable**: Ensure port 5555 is exposed in `docker-compose.yml` and Prisma Studio is started inside the container.
- **Table does not exist errors**: Run migrations inside the container to create tables.

## 7. Switching Between Local and Docker Development
- Use `localhost` in `.env` for local development.
- Use `db` in `.env` for Docker Compose.

---

## 10. About Different Commands

### `npx prisma generate`

* Generates the **Prisma Client** (TypeScript code) in `node_modules/.prisma/client`.
* Required after every `schema.prisma` change.
* **Does not touch the database.**

In Docker, the **Dockerfile already runs this step**:

```dockerfile
RUN npx prisma generate
```

So you don’t need to run it locally unless you are developing **outside of Docker** (e.g., `npm run start:dev` on your host machine).

---

## 🔹 Development Workflow

1. Edit `schema.prisma`.
2. Run locally:

   ```bash
   npx prisma migrate dev --name <meaningful_name_of_the_change>
   ```
3. Commit the generated migration files (`prisma/migrations/...`).
4. Rebuild your Docker containers.
5. On container startup, Prisma will run:

   ```bash
   npx prisma migrate deploy
   ```

   → applies the committed migrations to Postgres.


## 🔹 Key Points

* Always run `migrate dev` locally to create migration files.
* Commit migration files to Git so others (and Docker) can apply them.
