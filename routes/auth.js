/**
 * @swagger
 * {
 *   "components": {
 *     "schemas": {
 *       "Error": {
 *         "type": "object",
 *         "properties": {
 *           "success": {
 *             "type": "boolean",
 *             "example": false
 *           },
 *           "error": {
 *             "type": "string"
 *           },
 *           "stack": {
 *             "type": "string",
 *             "description": "Included for global errors in development."
 *           }
 *         }
 *       },
 *       "User": {
 *         "type": "object",
 *         "properties": {
 *           "_id": {
 *             "type": "string",
 *             "pattern": "^[a-fA-F0-9]{24}$",
 *             "example": "507f1f77bcf86cd799439011"
 *           },
 *           "name": {
 *             "type": "string"
 *           },
 *           "email": {
 *             "type": "string",
 *             "format": "email"
 *           },
 *           "tel": {
 *             "type": "string"
 *           },
 *           "role": {
 *             "type": "string",
 *             "enum": [
 *               "member",
 *               "admin"
 *             ]
 *           },
 *           "createdAt": {
 *             "type": "string",
 *             "format": "date-time"
 *           }
 *         }
 *       },
 *       "RegisterInput": {
 *         "type": "object",
 *         "properties": {
 *           "name": {
 *             "type": "string"
 *           },
 *           "email": {
 *             "type": "string",
 *             "format": "email"
 *           },
 *           "tel": {
 *             "type": "string"
 *           },
 *           "password": {
 *             "type": "string",
 *             "minLength": 6,
 *             "format": "password"
 *           }
 *         },
 *         "required": [
 *           "name",
 *           "email",
 *           "tel",
 *           "password"
 *         ]
 *       },
 *       "LoginInput": {
 *         "type": "object",
 *         "properties": {
 *           "email": {
 *             "type": "string",
 *             "format": "email"
 *           },
 *           "password": {
 *             "type": "string",
 *             "format": "password"
 *           }
 *         },
 *         "required": [
 *           "email",
 *           "password"
 *         ]
 *       },
 *       "AuthResponse": {
 *         "type": "object",
 *         "properties": {
 *           "success": {
 *             "type": "boolean",
 *             "example": true
 *           },
 *           "data": {
 *             "type": "object",
 *             "properties": {
 *               "id": {
 *                 "type": "string",
 *                 "pattern": "^[a-fA-F0-9]{24}$",
 *                 "example": "507f1f77bcf86cd799439011"
 *               },
 *               "name": {
 *                 "type": "string"
 *               },
 *               "email": {
 *                 "type": "string",
 *                 "format": "email"
 *               },
 *               "role": {
 *                 "type": "string",
 *                 "enum": [
 *                   "member",
 *                   "admin"
 *                 ]
 *               },
 *               "token": {
 *                 "type": "string",
 *                 "description": "JWT; use with the Authorize button as a bearer token."
 *               }
 *             }
 *           }
 *         }
 *       },
 *       "FacilityInput": {
 *         "type": "object",
 *         "properties": {
 *           "name": {
 *             "type": "string",
 *             "example": "Badminton Court A"
 *           },
 *           "sportType": {
 *             "type": "string",
 *             "example": "Badminton"
 *           },
 *           "location": {
 *             "type": "string",
 *             "example": "Sports Center, Floor 1"
 *           },
 *           "capacity": {
 *             "type": "number",
 *             "minimum": 1,
 *             "example": 4
 *           },
 *           "hourlyRate": {
 *             "type": "number",
 *             "minimum": 0,
 *             "example": 200
 *           },
 *           "isActive": {
 *             "type": "boolean",
 *             "default": true
 *           }
 *         },
 *         "required": [
 *           "name",
 *           "sportType",
 *           "location",
 *           "capacity",
 *           "hourlyRate"
 *         ]
 *       },
 *       "FacilityUpdate": {
 *         "type": "object",
 *         "properties": {
 *           "name": {
 *             "type": "string",
 *             "example": "Badminton Court A"
 *           },
 *           "sportType": {
 *             "type": "string",
 *             "example": "Badminton"
 *           },
 *           "location": {
 *             "type": "string",
 *             "example": "Sports Center, Floor 1"
 *           },
 *           "capacity": {
 *             "type": "number",
 *             "minimum": 1,
 *             "example": 4
 *           },
 *           "hourlyRate": {
 *             "type": "number",
 *             "minimum": 0,
 *             "example": 200
 *           },
 *           "isActive": {
 *             "type": "boolean",
 *             "default": true
 *           }
 *         }
 *       },
 *       "Facility": {
 *         "type": "object",
 *         "properties": {
 *           "_id": {
 *             "type": "string",
 *             "pattern": "^[a-fA-F0-9]{24}$",
 *             "example": "507f1f77bcf86cd799439011"
 *           },
 *           "name": {
 *             "type": "string",
 *             "example": "Badminton Court A"
 *           },
 *           "sportType": {
 *             "type": "string",
 *             "example": "Badminton"
 *           },
 *           "location": {
 *             "type": "string",
 *             "example": "Sports Center, Floor 1"
 *           },
 *           "capacity": {
 *             "type": "number",
 *             "minimum": 1,
 *             "example": 4
 *           },
 *           "hourlyRate": {
 *             "type": "number",
 *             "minimum": 0,
 *             "example": 200
 *           },
 *           "isActive": {
 *             "type": "boolean",
 *             "default": true
 *           },
 *           "createdAt": {
 *             "type": "string",
 *             "format": "date-time"
 *           },
 *           "updatedAt": {
 *             "type": "string",
 *             "format": "date-time"
 *           }
 *         }
 *       },
 *       "BookingInput": {
 *         "type": "object",
 *         "properties": {
 *           "facility": {
 *             "type": "string",
 *             "pattern": "^[a-fA-F0-9]{24}$",
 *             "example": "507f1f77bcf86cd799439011"
 *           },
 *           "bookingDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-10-01"
 *           },
 *           "startTime": {
 *             "type": "string",
 *             "pattern": "^([01]\\d|2[0-3]):[0-5]\\d$",
 *             "example": "14:00"
 *           },
 *           "durationHours": {
 *             "type": "number",
 *             "minimum": 0.5,
 *             "maximum": 2,
 *             "example": 1.5
 *           }
 *         },
 *         "required": [
 *           "facility",
 *           "bookingDate",
 *           "startTime",
 *           "durationHours"
 *         ]
 *       },
 *       "BookingUpdate": {
 *         "type": "object",
 *         "properties": {
 *           "facility": {
 *             "type": "string",
 *             "pattern": "^[a-fA-F0-9]{24}$",
 *             "example": "507f1f77bcf86cd799439011"
 *           },
 *           "bookingDate": {
 *             "type": "string",
 *             "format": "date",
 *             "example": "2026-10-01"
 *           },
 *           "startTime": {
 *             "type": "string",
 *             "pattern": "^([01]\\d|2[0-3]):[0-5]\\d$",
 *             "example": "14:00"
 *           },
 *           "durationHours": {
 *             "type": "number",
 *             "minimum": 0.5,
 *             "maximum": 2,
 *             "example": 1.5
 *           }
 *         }
 *       },
 *       "Booking": {
 *         "type": "object",
 *         "properties": {
 *           "_id": {
 *             "type": "string",
 *             "pattern": "^[a-fA-F0-9]{24}$",
 *             "example": "507f1f77bcf86cd799439011"
 *           },
 *           "facility": {
 *             "type": "object",
 *             "properties": {
 *               "_id": {
 *                 "type": "string",
 *                 "pattern": "^[a-fA-F0-9]{24}$",
 *                 "example": "507f1f77bcf86cd799439011"
 *               },
 *               "name": {
 *                 "type": "string"
 *               },
 *               "sportType": {
 *                 "type": "string"
 *               },
 *               "location": {
 *                 "type": "string"
 *               },
 *               "capacity": {
 *                 "type": "number"
 *               },
 *               "hourlyRate": {
 *                 "type": "number"
 *               }
 *             }
 *           },
 *           "user": {
 *             "type": "object",
 *             "properties": {
 *               "_id": {
 *                 "type": "string",
 *                 "pattern": "^[a-fA-F0-9]{24}$",
 *                 "example": "507f1f77bcf86cd799439011"
 *               },
 *               "name": {
 *                 "type": "string"
 *               },
 *               "email": {
 *                 "type": "string"
 *               },
 *               "tel": {
 *                 "type": "string"
 *               },
 *               "role": {
 *                 "type": "string",
 *                 "enum": [
 *                   "member",
 *                   "admin"
 *                 ]
 *               }
 *             }
 *           },
 *           "bookingDate": {
 *             "type": "string",
 *             "format": "date-time"
 *           },
 *           "startTime": {
 *             "type": "string",
 *             "pattern": "^([01]\\d|2[0-3]):[0-5]\\d$",
 *             "example": "14:00"
 *           },
 *           "durationHours": {
 *             "type": "number",
 *             "minimum": 0.5,
 *             "maximum": 2,
 *             "example": 1.5
 *           },
 *           "startMinutes": {
 *             "type": "number",
 *             "minimum": 0,
 *             "maximum": 1439
 *           },
 *           "endMinutes": {
 *             "type": "number",
 *             "minimum": 1,
 *             "maximum": 1440
 *           },
 *           "createdAt": {
 *             "type": "string",
 *             "format": "date-time"
 *           },
 *           "updatedAt": {
 *             "type": "string",
 *             "format": "date-time"
 *           }
 *         }
 *       },
 *       "EmptyResponse": {
 *         "type": "object",
 *         "properties": {
 *           "success": {
 *             "type": "boolean",
 *             "example": true
 *           },
 *           "data": {
 *             "type": "object",
 *             "example": {}
 *           }
 *         }
 *       }
 *     },
 *     "parameters": {
 *       "ResourceId": {
 *         "name": "id",
 *         "in": "path",
 *         "required": true,
 *         "description": "MongoDB document ID.",
 *         "schema": {
 *           "type": "string",
 *           "pattern": "^[a-fA-F0-9]{24}$",
 *           "example": "507f1f77bcf86cd799439011"
 *         }
 *       }
 *     },
 *     "responses": {
 *       "Error400": {
 *         "description": "Invalid request input.",
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "$ref": "#/components/schemas/Error"
 *             }
 *           }
 *         }
 *       },
 *       "Error401": {
 *         "description": "Missing or invalid credentials, or user no longer exists.",
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "$ref": "#/components/schemas/Error"
 *             }
 *           }
 *         }
 *       },
 *       "Error403": {
 *         "description": "Role or ownership does not permit this operation.",
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "$ref": "#/components/schemas/Error"
 *             }
 *           }
 *         }
 *       },
 *       "Error404": {
 *         "description": "Resource not found or inactive.",
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "$ref": "#/components/schemas/Error"
 *             }
 *           }
 *         }
 *       },
 *       "Error409": {
 *         "description": "Facility or member already has an overlapping booking.",
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "$ref": "#/components/schemas/Error"
 *             }
 *           }
 *         }
 *       },
 *       "Error429": {
 *         "description": "Rate limit exceeded (100 requests per IP per 10 minutes).",
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "$ref": "#/components/schemas/Error"
 *             }
 *           }
 *         }
 *       },
 *       "Error500": {
 *         "description": "Server error. Current global handling also returns this for Mongoose validation, cast, and duplicate-key errors.",
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "$ref": "#/components/schemas/Error"
 *             }
 *           }
 *         }
 *       }
 *     }
 *   },
 *   "/api/v1/auth/register": {
 *     "post": {
 *       "tags": [
 *         "Authentication"
 *       ],
 *       "summary": "Register a user",
 *       "description": "Public registration always creates a member account (any role field is ignored) and issues a JWT in data.token and an HTTP-only token cookie. Admins are created with npm run create-admin.",
 *       "security": [],
 *       "responses": {
 *         "201": {
 *           "description": "Successful operation.",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/AuthResponse"
 *               }
 *             }
 *           },
 *           "headers": {
 *             "Set-Cookie": {
 *               "description": "HTTP-only token cookie; Secure in production.",
 *               "schema": {
 *                 "type": "string"
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
 *       },
 *       "requestBody": {
 *         "required": true,
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "$ref": "#/components/schemas/RegisterInput"
 *             }
 *           }
 *         }
 *       }
 *     }
 *   },
 *   "/api/v1/auth/login": {
 *     "post": {
 *       "tags": [
 *         "Authentication"
 *       ],
 *       "summary": "Log in",
 *       "description": "Issues a JWT in data.token and an HTTP-only token cookie.",
 *       "security": [],
 *       "responses": {
 *         "200": {
 *           "description": "Successful operation.",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/AuthResponse"
 *               }
 *             }
 *           },
 *           "headers": {
 *             "Set-Cookie": {
 *               "description": "HTTP-only token cookie; Secure in production.",
 *               "schema": {
 *                 "type": "string"
 *               }
 *             }
 *           }
 *         },
 *         "400": {
 *           "$ref": "#/components/responses/Error400"
 *         },
 *         "401": {
 *           "$ref": "#/components/responses/Error401"
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         },
 *         "500": {
 *           "$ref": "#/components/responses/Error500"
 *         }
 *       },
 *       "requestBody": {
 *         "required": true,
 *         "content": {
 *           "application/json": {
 *             "schema": {
 *               "$ref": "#/components/schemas/LoginInput"
 *             }
 *           }
 *         }
 *       }
 *     }
 *   },
 *   "/api/v1/auth/me": {
 *     "get": {
 *       "tags": [
 *         "Authentication"
 *       ],
 *       "summary": "Get current user",
 *       "description": "Returns the authenticated user profile without the password.",
 *       "security": [
 *         {
 *           "bearerAuth": []
 *         }
 *       ],
 *       "responses": {
 *         "200": {
 *           "description": "Successful operation.",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "properties": {
 *                   "success": {
 *                     "type": "boolean",
 *                     "example": true
 *                   },
 *                   "data": {
 *                     "$ref": "#/components/schemas/User"
 *                   }
 *                 }
 *               }
 *             }
 *           }
 *         },
 *         "401": {
 *           "$ref": "#/components/responses/Error401"
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
 *   "/api/v1/auth/logout": {
 *     "get": {
 *       "tags": [
 *         "Authentication"
 *       ],
 *       "summary": "Log out",
 *       "description": "Replaces the token cookie with none and a short expiry. Existing bearer tokens remain valid until they expire.",
 *       "security": [
 *         {
 *           "bearerAuth": []
 *         }
 *       ],
 *       "responses": {
 *         "200": {
 *           "description": "Successful operation.",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/EmptyResponse"
 *               }
 *             }
 *           }
 *         },
 *         "401": {
 *           "$ref": "#/components/responses/Error401"
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         },
 *         "500": {
 *           "$ref": "#/components/responses/Error500"
 *         }
 *       }
 *     }
 *   }
 * }
 */
const express = require("express");
const { register, login, getMe, logout } = require("../controllers/auth");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/logout", protect, logout);

module.exports = router;
