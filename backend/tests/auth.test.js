import { describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals"
import request from "supertest"
import path from "path"
import { fileURLToPath } from "url"
import { app } from "../src/app.js"
import { connect, closeDatabase, clearDatabase } from "./testDb.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Helpers ───────────────────────────────────────────────────────────────────
const registerPayload = () => ({
  fullName: "Test User",
  email: `test_${Date.now()}@example.com`,
  username: `testuser_${Date.now()}`,
  password: "TestPass123!",
})

beforeAll(async () => await connect())
afterAll(async () => await closeDatabase())
afterEach(async () => await clearDatabase())

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/v1/users/register", () => {
  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .field("fullName", "Test User")
      .field("email", "test@example.com")
    // username and password are missing

    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it("returns 400 when password is too short", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .field("fullName", "Test User")
      .field("email", "test@example.com")
      .field("username", "testuser")
      .field("password", "short") // < 8 chars

    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it("returns 400 when email is invalid", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .field("fullName", "Test User")
      .field("email", "not-an-email")
      .field("username", "testuser")
      .field("password", "ValidPass123!")

    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toMatch(/email/i)
  })

  it("returns 400 when avatar is missing", async () => {
    const payload = registerPayload()
    const res = await request(app)
      .post("/api/v1/users/register")
      .field("fullName", payload.fullName)
      .field("email", payload.email)
      .field("username", payload.username)
      .field("password", payload.password)
    // no avatar file

    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/v1/users/login", () => {
  it("returns 400 when password is missing", async () => {
    const res = await request(app)
      .post("/api/v1/users/login")
      .send({ email: "test@example.com" })

    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it("returns 401 when credentials are invalid", async () => {
    const res = await request(app)
      .post("/api/v1/users/login")
      .send({ email: "nonexistent@example.com", password: "WrongPass123!" })

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
    // Should NOT reveal whether user exists (prevent enumeration)
    expect(res.body.message).toBe("Invalid credentials")
  })

  it("returns 400 when neither email nor username is provided", async () => {
    const res = await request(app)
      .post("/api/v1/users/login")
      .send({ password: "SomePass123!" })

    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES
// ─────────────────────────────────────────────────────────────────────────────
describe("Protected route access", () => {
  it("returns 401 when accessing /current-user without token", async () => {
    const res = await request(app).get("/api/v1/users/current-user")

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it("returns 401 when accessing /logout without token", async () => {
    const res = await request(app).post("/api/v1/users/logout")

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it("returns 401 when token is malformed", async () => {
    const res = await request(app)
      .get("/api/v1/users/current-user")
      .set("Authorization", "Bearer invalidtoken123")

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN REFRESH
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/v1/users/refresh-token", () => {
  it("returns 401 when no refresh token is provided", async () => {
    const res = await request(app).post("/api/v1/users/refresh-token").send({})

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it("returns 401 when refresh token is invalid", async () => {
    const res = await request(app)
      .post("/api/v1/users/refresh-token")
      .send({ refreshToken: "invalid.refresh.token" })

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH USERS
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/v1/users/search", () => {
  it("returns 400 when query is missing", async () => {
    const res = await request(app).get("/api/v1/users/search")

    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it("returns 200 with empty array for no matches", async () => {
    const res = await request(app)
      .get("/api/v1/users/search")
      .query({ query: "zzznomatch999" })

    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBe(0)
  })
})
