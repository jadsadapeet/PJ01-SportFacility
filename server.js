/**
 * @swagger
 * {
 *   "/": {
 *     "get": {
 *       "tags": [
 *         "Utilities"
 *       ],
 *       "summary": "API welcome message",
 *       "description": "Returns links to documentation and application health.",
 *       "security": [],
 *       "responses": {
 *         "200": {
 *           "description": "Successful operation.",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "properties": {
 *                   "success": {
 *                     "type": "boolean"
 *                   },
 *                   "message": {
 *                     "type": "string"
 *                   },
 *                   "documentation": {
 *                     "type": "string",
 *                     "example": "/api-docs"
 *                   },
 *                   "health": {
 *                     "type": "string",
 *                     "example": "/health"
 *                   }
 *                 }
 *               }
 *             }
 *           }
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         },
 *         "500": {
 *           "$ref": "#/components/responses/Error500"
 *         }
 *       }
 *     }
 *   },
 *   "/health": {
 *     "get": {
 *       "tags": [
 *         "Utilities"
 *       ],
 *       "summary": "Application health",
 *       "description": "Returns application status, timestamp, and environment. Does not verify database connectivity.",
 *       "security": [],
 *       "responses": {
 *         "200": {
 *           "description": "Successful operation.",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "properties": {
 *                   "success": {
 *                     "type": "boolean"
 *                   },
 *                   "message": {
 *                     "type": "string"
 *                   },
 *                   "timestamp": {
 *                     "type": "string",
 *                     "format": "date-time"
 *                   },
 *                   "environment": {
 *                     "type": "string",
 *                     "example": "development"
 *                   }
 *                 }
 *               }
 *             }
 *           }
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         },
 *         "500": {
 *           "$ref": "#/components/responses/Error500"
 *         }
 *       }
 *     }
 *   },
 *   "/api-docs": {
 *     "get": {
 *       "tags": [
 *         "Utilities"
 *       ],
 *       "summary": "Swagger UI",
 *       "description": "Interactive API documentation. Open this URL in a browser.",
 *       "security": [],
 *       "responses": {
 *         "200": {
 *           "description": "Swagger UI HTML page.",
 *           "content": {
 *             "text/html": {
 *               "schema": {
 *                 "type": "string"
 *               }
 *             }
 *           }
 *         },
 *         "301": {
 *           "description": "Redirect to the trailing-slash documentation URL."
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         }
 *       }
 *     }
 *   }
 * }
 */
const path = require("node:path");
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");
const cors = require("cors");
const connectDB = require("./config/db");
const auth = require("./routes/auth");
const facilities = require("./routes/facilities");
const bookings = require("./routes/bookings");

dotenv.config({ path: "./config/config.env" });

const app = express();

// Behind a hosting proxy (Render, Railway, Heroku...) the client IP arrives in
// X-Forwarded-For. Trust one hop in production so rate limiting is per user,
// not one shared bucket for everyone. Override with TRUST_PROXY (number of hops).
if (process.env.NODE_ENV === "production" || process.env.TRUST_PROXY) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));
}

app.use(helmet());
app.use(hpp());
app.use(rateLimit({
  windowMs: 10 * 60 * 1000,
  // Relaxed outside production so local frontend development does not hit the cap.
  limit: process.env.NODE_ENV === "production" ? 100 : 1000,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
  },
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : "http://localhost:3000",
  credentials: true,
}));

// Make sure MongoDB is connected before any API route runs. On Vercel the app is
// imported (not started with `node server.js`), so this is where it connects.
app.use("/api/v1", async (req, res, next) => {
  if (!process.env.MONGO_URI || mongoose.connection.readyState === 1) return next();
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api/v1/auth", auth);
app.use("/api/v1/facilities", facilities);
app.use("/api/v1/bookings", bookings);

// Glob patterns need forward slashes, also on Windows.
const toPosix = (p) => p.split(path.sep).join("/");

const swaggerDocs = swaggerJsDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sports Facility Booking API",
      version: "1.0.0",
      description: "REST API for sports facility management and bookings.",
    },
    servers: [{
      url: `http://localhost:${process.env.PORT || 5000}`,
    }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  // Absolute, forward-slash paths so the docs load from any working directory.
  apis: [toPosix(path.join(__dirname, "routes", "*.js")), toPosix(__filename)],
});

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Sports Facility Booking API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Sports Facility Booking API",
    documentation: "/api-docs",
    health: "/health",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
});

// Connect and listen only when run directly (`node server.js`), so tests can
// import `app` without touching the real database or opening a port.
const start = () => {
  if (process.env.MONGO_URI) {
    connectDB().catch((error) => {
      console.error(`Database connection failed: ${error.message}`);
      process.exit(1);
    });
  }

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`Sports Facility Booking API running on http://localhost:${PORT}`);
  });

  process.on("unhandledRejection", (error) => {
    console.error(`Unhandled rejection: ${error.message}`);
    server.close(() => process.exit(1));
  });

  process.on("uncaughtException", (error) => {
    console.error(`Uncaught exception: ${error.message}`);
    process.exit(1);
  });

  return server;
};

if (require.main === module) start();

// Vercel expects the Express app as the module's export.
module.exports = app;
module.exports.start = start;
