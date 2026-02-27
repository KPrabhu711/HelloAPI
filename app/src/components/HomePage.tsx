'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useApi } from '@/context/ApiContext';
import Dashboard from '@/components/Dashboard';

const SAMPLE_SPEC = `{
  "openapi": "3.0.0",
  "info": {
    "title": "Pet Store API",
    "description": "A sample API for managing pets in a pet store",
    "version": "1.0.0"
  },
  "servers": [{ "url": "https://api.petstore.example.com/v1" }],
  "security": [{ "bearerAuth": [] }],
  "components": {
    "securitySchemes": {
      "bearerAuth": { "type": "http", "scheme": "bearer", "description": "JWT Bearer token" }
    }
  },
  "tags": [
    { "name": "Pets", "description": "Pet operations" },
    { "name": "Store", "description": "Store operations" },
    { "name": "Users", "description": "User operations" }
  ],
  "paths": {
    "/pets": {
      "get": {
        "tags": ["Pets"],
        "operationId": "listPets",
        "summary": "List all pets",
        "description": "Returns a paginated list of all pets in the store",
        "parameters": [
          { "name": "limit", "in": "query", "schema": { "type": "integer" }, "description": "Maximum number of pets to return" },
          { "name": "offset", "in": "query", "schema": { "type": "integer" }, "description": "Number of pets to skip" },
          { "name": "status", "in": "query", "schema": { "type": "string", "enum": ["available", "pending", "sold"] }, "description": "Filter by status" }
        ],
        "responses": {
          "200": { "description": "A list of pets", "content": { "application/json": { "schema": { "type": "object", "properties": { "data": { "type": "array" }, "total": { "type": "integer" }, "limit": { "type": "integer" }, "offset": { "type": "integer" } } } } } },
          "401": { "description": "Unauthorized" },
          "429": { "description": "Rate limit exceeded" }
        }
      },
      "post": {
        "tags": ["Pets"],
        "operationId": "createPet",
        "summary": "Create a new pet",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["name", "species"],
                "properties": {
                  "name": { "type": "string", "description": "Pet name", "example": "Buddy" },
                  "species": { "type": "string", "description": "Animal species", "enum": ["dog", "cat", "bird", "fish", "other"] },
                  "breed": { "type": "string", "description": "Pet breed" },
                  "age": { "type": "integer", "description": "Pet age in years" },
                  "status": { "type": "string", "enum": ["available", "pending", "sold"], "default": "available" }
                }
              }
            }
          }
        },
        "responses": {
          "201": { "description": "Pet created successfully" },
          "400": { "description": "Invalid input" },
          "401": { "description": "Unauthorized" }
        }
      }
    },
    "/pets/{petId}": {
      "get": {
        "tags": ["Pets"],
        "operationId": "getPet",
        "summary": "Get a pet by ID",
        "parameters": [
          { "name": "petId", "in": "path", "required": true, "schema": { "type": "string" }, "description": "ID of the pet", "example": "pet_123" }
        ],
        "responses": {
          "200": { "description": "Pet details", "content": { "application/json": { "schema": { "type": "object", "properties": { "id": {"type": "string"}, "name": {"type": "string"}, "species": {"type": "string"}, "breed": {"type": "string"}, "age": {"type": "integer"}, "status": {"type": "string"}, "createdAt": {"type": "string"} } } } } },
          "404": { "description": "Pet not found" }
        }
      },
      "put": {
        "tags": ["Pets"],
        "operationId": "updatePet",
        "summary": "Update a pet",
        "parameters": [
          { "name": "petId", "in": "path", "required": true, "schema": { "type": "string" }, "description": "ID of the pet" }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": { "type": "string" },
                  "status": { "type": "string", "enum": ["available", "pending", "sold"] },
                  "breed": { "type": "string" },
                  "age": { "type": "integer" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Pet updated" },
          "404": { "description": "Pet not found" }
        }
      },
      "delete": {
        "tags": ["Pets"],
        "operationId": "deletePet",
        "summary": "Delete a pet",
        "parameters": [
          { "name": "petId", "in": "path", "required": true, "schema": { "type": "string" }, "description": "ID of the pet" }
        ],
        "responses": {
          "204": { "description": "Pet deleted" },
          "404": { "description": "Pet not found" }
        }
      }
    },
    "/store/inventory": {
      "get": {
        "tags": ["Store"],
        "operationId": "getInventory",
        "summary": "Get store inventory",
        "description": "Returns a map of pet statuses to quantities",
        "responses": {
          "200": { "description": "Inventory counts" }
        }
      }
    },
    "/store/orders": {
      "post": {
        "tags": ["Store"],
        "operationId": "placeOrder",
        "summary": "Place an order for a pet",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["petId", "quantity"],
                "properties": {
                  "petId": { "type": "string", "description": "ID of the pet to order" },
                  "quantity": { "type": "integer", "description": "Number of pets", "default": 1 },
                  "shipDate": { "type": "string", "description": "Requested shipping date" }
                }
              }
            }
          }
        },
        "responses": {
          "201": { "description": "Order placed" },
          "400": { "description": "Invalid order" }
        }
      }
    },
    "/users/login": {
      "post": {
        "tags": ["Users"],
        "operationId": "loginUser",
        "summary": "Log in a user",
        "security": [],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["username", "password"],
                "properties": {
                  "username": { "type": "string", "example": "john_doe" },
                  "password": { "type": "string", "example": "secret123" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Login successful, returns token" },
          "401": { "description": "Invalid credentials" }
        }
      }
    },
    "/users/me": {
      "get": {
        "tags": ["Users"],
        "operationId": "getCurrentUser",
        "summary": "Get current user profile",
        "responses": {
          "200": { "description": "User profile" },
          "401": { "description": "Not authenticated" }
        }
      }
    }
  }
}`;

export default function HomePage() {
    const { spec, isLoading, error, parseAndGenerate } = useApi();
    const [inputText, setInputText] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
        if (inputText.trim()) {
            parseAndGenerate(inputText);
        }
    };

    const handleFileUpload = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setInputText(text);
        };
        reader.readAsText(file);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    }, [handleFileUpload]);

    const handleLoadSample = () => {
        setInputText(SAMPLE_SPEC);
    };

    // Show dashboard if spec is loaded
    if (spec) {
        return <Dashboard />;
    }

    return (
        <div className="landing-page">
            {/* Hero */}
            <div className="hero">
                <div className="hero-glow" />
                <div className="hero-content">
                    <div className="hero-badge">⚡ Interactive API Learning Platform</div>
                    <h1 className="hero-title">
                        Turn API docs into
                        <br />
                        <span className="gradient-text">live playgrounds</span>
                    </h1>
                    <p className="hero-subtitle">
                        Drop in an OpenAPI spec or paste your docs. Get a working quickstart,
                        starter code, and an interactive endpoint playground — in seconds.
                    </p>
                </div>
            </div>

            {/* Upload Section */}
            <div className="upload-section">
                <div
                    className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.yaml,.yml,.txt,.md"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        className="hidden-input"
                    />
                    <div className="upload-icon">📁</div>
                    <p className="upload-text">
                        <strong>Drop your OpenAPI spec here</strong> or click to browse
                    </p>
                    <p className="upload-hint">Supports JSON, YAML, or text documentation</p>
                </div>

                <div className="divider">
                    <span>or paste below</span>
                </div>

                <textarea
                    className="input-textarea"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={'Paste your OpenAPI/Swagger spec (JSON or YAML) or API documentation text here...\n\nExample:\n{\n  "openapi": "3.0.0",\n  "info": { "title": "My API", "version": "1.0" },\n  "paths": { ... }\n}'}
                    rows={12}
                />

                <div className="action-row">
                    <button
                        className="sample-button"
                        onClick={handleLoadSample}
                    >
                        📋 Load Sample (Pet Store API)
                    </button>
                    <button
                        className="generate-button"
                        onClick={handleSubmit}
                        disabled={!inputText.trim() || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <span>⚡</span>
                                Generate Playground
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="error-banner">
                        <span>❌</span> {error}
                    </div>
                )}
            </div>

            {/* Features */}
            <div className="features">
                <div className="feature-card">
                    <span className="feature-icon">🔌</span>
                    <h3>Interactive Playground</h3>
                    <p>Explore every endpoint with auto-generated forms, Try It execution, and formatted responses.</p>
                </div>
                <div className="feature-card">
                    <span className="feature-icon">🚀</span>
                    <h3>Quickstart Pack</h3>
                    <p>Get a README with auth setup, curl examples, and starter code in Python & TypeScript.</p>
                </div>
                <div className="feature-card">
                    <span className="feature-icon">📚</span>
                    <h3>Guided Learning</h3>
                    <p>Follow structured paths: Basics → CRUD → Workflows. Learn the API step by step.</p>
                </div>
                <div className="feature-card">
                    <span className="feature-icon">⚠️</span>
                    <h3>Error Intelligence</h3>
                    <p>Every endpoint comes with common errors, likely causes, and fix suggestions.</p>
                </div>
            </div>

            {/* Footer */}
            <footer className="landing-footer">
                <p>Built with ⚡ by HelloAPI — Powered by Amazon Bedrock</p>
            </footer>
        </div>
    );
}
