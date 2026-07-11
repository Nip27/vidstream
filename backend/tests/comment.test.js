import { describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals"
import request from "supertest"
import { app } from "../src/app.js"
import { connect, closeDatabase, clearDatabase } from "./testDb.js"

beforeAll(async () => await connect())
afterAll(async () => await closeDatabase())
afterEach(async () => await clearDatabase())

const VALID_OBJECT_ID = "507f1f77bcf86cd799439011"
const INVALID_ID = "not-a-valid-id"

// ─────────────────────────────────────────────────────────────────────────────
// GET VIDEO COMMENTS
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/v1/comments/:videoId", () => {
  it("returns 400 for invalid videoId", async () => {
    const res = await request(app).get(`/api/v1/comments/${INVALID_ID}`)

    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it("returns 200 with empty paginated list for valid videoId", async () => {
    const res = await request(app).get(`/api/v1/comments/${VALID_OBJECT_ID}`)

    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty("docs")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ADD COMMENT — requires auth
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/v1/comments/:videoId", () => {
  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .post(`/api/v1/comments/${VALID_OBJECT_ID}`)
      .send({ content: "Great video!" })

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE COMMENT — requires auth
// ─────────────────────────────────────────────────────────────────────────────
describe("PATCH /api/v1/comments/c/:commentId", () => {
  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .patch(`/api/v1/comments/c/${VALID_OBJECT_ID}`)
      .send({ content: "Updated content" })

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE COMMENT — requires auth
// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/v1/comments/c/:commentId", () => {
  it("returns 401 without authentication", async () => {
    const res = await request(app).delete(
      `/api/v1/comments/c/${VALID_OBJECT_ID}`
    )

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT VALIDATION (via validate middleware)
// ─────────────────────────────────────────────────────────────────────────────
describe("Comment content validation", () => {
  it("addComment rejects empty content (caught by auth first — 401 without token)", async () => {
    const res = await request(app)
      .post(`/api/v1/comments/${VALID_OBJECT_ID}`)
      .send({ content: "" })

    // Without auth, 401 fires first
    expect(res.statusCode).toBe(401)
  })
})
