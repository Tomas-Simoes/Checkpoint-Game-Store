# Checkpoint Game Store

Checkpoint Game Store is an online store project with a React/Vite frontend and a Spring Boot REST API backend.

The backend supports product and category management, customer registration and authentication, online purchases, stock control, invoice generation, and store statistics.

## Requirements

- Java 17 or newer.
- Node.js 20 or newer.
- No global Maven installation is required because the backend includes Maven Wrapper.

## Getting Started

Clone the repository and open it in a terminal:

```powershell
cd Checkpoint-Game-Store
```

## Running the Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

By default, the API runs at:

```text
http://localhost:8080
```

If port `8080` is already in use, run the backend on another port:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"
```

## Running the Frontend

From the project root:

```powershell
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

## API Documentation

Swagger UI is available after starting the backend:

```text
http://localhost:8080/swagger-ui.html
```

If the backend is running on port `8081`, use:

```text
http://localhost:8081/swagger-ui.html
```

The detailed API reference is also available in:

```text
docs/API.md
```

## Default Credentials

### Admin

```text
Email: admin@checkpoint.local
Password: Admin123!
```

### Customer

```text
Email: cliente@checkpoint.local
Password: Cliente123!
```

## Database

The project uses H2 Database in file mode for easy local setup.

The database is created automatically at:

```text
backend/data/checkpoint-store-db
```

The H2 console is available after starting the backend:

```text
http://localhost:8080/h2-console
```

Connection settings:

```text
JDBC URL: jdbc:h2:file:./data/checkpoint-store-db
User: sa
Password:
```

The SQL scripts are located in:

```text
backend/database/schema.sql
backend/database/seed-data.sql
```

By default, the application creates or updates the database schema with JPA/Hibernate and inserts initial data through `DataSeeder`.

## Project Structure

```text
Checkpoint-Game-Store/
|-- backend/
|   |-- database/
|   |   |-- schema.sql
|   |   `-- seed-data.sql
|   |-- src/main/java/com/checkpoint/store/
|   |   |-- auth/
|   |   |-- common/
|   |   |-- config/
|   |   |-- customer/
|   |   |-- domain/
|   |   |-- invoice/
|   |   |-- product/
|   |   |-- repository/
|   |   |-- sale/
|   |   `-- stats/
|   |-- src/main/resources/
|   |-- mvnw
|   |-- mvnw.cmd
|   `-- pom.xml
|-- docs/
|   |-- API.md
|   |-- CONCEPTS_TO_KNOW.md
|   |-- IMPLEMENTATION_DECISIONS.md
|   `-- PROJECT_STRUCTURE.md
|-- src/
|-- package.json
`-- README.md
```

## Useful Commands

Run backend tests:

```powershell
cd backend
.\mvnw.cmd test
```

Build the backend:

```powershell
cd backend
.\mvnw.cmd package
```

Build the frontend:

```powershell
npm run build
```
