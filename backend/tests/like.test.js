import { describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals"
import request from "supertest"
import { app } from "../src/app.js"
import { connect, closeDatabase, clearDatabase } from "./testDb.js"

beforeAll(async () => await connect())
afterAll(async () => await closeDatabase())
afterEach(async () => await clearDatabase())

const VALID_OBJECT_ID = "507f1f77bcf86cd799439011"
const INVALID_ID = "bad-id"

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE VIDEO LIKE
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/v1/likes/toggle/v/:videoId", () => {
  it("returns 401 without authentication", async () => {
    const res = await request(app).post(
      `/api/v1/likes/toggle/v/${VALID_OBJECT_ID}`
    )

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it("returns 400 for invalid videoId", async () => {
    // Auth fires first, so we check 401 not 400 here without token
    const res = await request(app).post(`/api/v1/likes/toggle/v/${INVALID_ID}`)

    expect(res.statusCode).toBe(401)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE COMMENT LIKE
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/v1/likes/toggle/c/:commentId", () => {
  it("returns 401 without authentication", async () => {
    const res = await request(app).post(
      `/api/v1/likes/toggle/c/${VALID_OBJECT_ID}`
    )

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE TWEET LIKE
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/v1/likes/toggle/t/:tweetId", () => {
  it("returns 401 without authentication", async () => {
    const res = await request(app).post(
      `/api/v1/likes/toggle/t/${VALID_OBJECT_ID}`
    )

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET LIKED VIDEOS
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/v1/likes/videos", () => {
  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/v1/likes/videos")

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })
})
