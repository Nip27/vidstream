import { describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals"
import request from "supertest"
import { app } from "../src/app.js"
import { connect, closeDatabase, clearDatabase } from "./testDb.js"

beforeAll(async () => await connect())
afterAll(async () => await closeDatabase())
afterEach(async () => await clearDatabase())

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL VIDEOS (public)
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/v1/videos", () => {
  it("returns 200 without authentication", async () => {
    const res = await request(app).get("/api/v1/videos")

    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toBeDefined()
  })

  it("returns paginated structure", async () => {
    const res = await request(app).get("/api/v1/videos?page=1&limit=5")

    expect(res.statusCode).toBe(200)
    expect(res.body.data).toHaveProperty("docs")
    expect(res.body.data).toHaveProperty("totalDocs")
    expect(res.body.data).toHaveProperty("limit")
    expect(Array.isArray(res.body.data.docs)).toBe(true)
  })

  it("accepts search query parameter", async () => {
    const res = await request(app)
      .get("/api/v1/videos")
      .query({ query: "test video" })

    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it("returns 400 for invalid userId", async () => {
    const res = await request(app)
      .get("/api/v1/videos")
      .query({ userId: "invalid-id" })

    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET VIDEO BY ID (public)
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/v1/videos/:videoId", () => {
  it("returns 400 for invalid videoId format", async () => {
    const res = await request(app).get("/api/v1/videos/not-a-valid-id")

    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it("returns 404 for non-existent video", async () => {
    const res = await request(app).get(
      "/api/v1/videos/507f1f77bcf86cd799439011"
    )

    expect(res.statusCode).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it("does not require authentication", async () => {
    // Should return 404 (not found) or 200, NOT 401
    const res = await request(app).get(
      "/api/v1/videos/507f1f77bcf86cd799439011"
    )

    expect(res.statusCode).not.toBe(401)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED VIDEO ROUTES
// ─────────────────────────────────────────────────────────────────────────────
describe("Protected video endpoints", () => {
  it("returns 401 when publishing without authentication", async () => {
    const res = await request(app)
      .post("/api/v1/videos")
      .field("title", "Test Video")
      .field("description", "Test description")

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it("returns 401 when deleting without authentication", async () => {
    const res = await request(app).delete(
      "/api/v1/videos/507f1f77bcf86cd799439011"
    )

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it("returns 401 when updating without authentication", async () => {
    const res = await request(app)
      .patch("/api/v1/videos/507f1f77bcf86cd799439011")
      .send({ title: "New title" })

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it("returns 401 when toggling publish without authentication", async () => {
    const res = await request(app).patch(
      "/api/v1/videos/toggle/publish/507f1f77bcf86cd799439011"
    )

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO URL VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/v1/videos/url — validation", () => {
  it("returns 401 without auth (quick guard check)", async () => {
    const res = await request(app)
      .post("/api/v1/videos/url")
      .send({ title: "Test", videoUrl: "not-a-url" })

    // Auth guard fires before validation
    expect(res.statusCode).toBe(401)
  })
})
