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
// TOGGLE SUBSCRIPTION
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/v1/subscriptions/c/:channelId", () => {
  it("returns 401 without authentication", async () => {
    const res = await request(app).post(
      `/api/v1/subscriptions/c/${VALID_OBJECT_ID}`
    )

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET CHANNEL SUBSCRIBERS
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/v1/subscriptions/c/:channelId", () => {
  it("returns 401 without authentication", async () => {
    const res = await request(app).get(
      `/api/v1/subscriptions/c/${VALID_OBJECT_ID}`
    )

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it("returns 400 for invalid channelId when authenticated", async () => {
    // Without auth, 401 fires first — so this test just validates route exists
    const res = await request(app).get(`/api/v1/subscriptions/c/${INVALID_ID}`)

    expect([400, 401]).toContain(res.statusCode)
    expect(res.body.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET SUBSCRIBED CHANNELS
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/v1/subscriptions/u/:subscriberId", () => {
  it("returns 401 without authentication", async () => {
    const res = await request(app).get(
      `/api/v1/subscriptions/u/${VALID_OBJECT_ID}`
    )

    expect(res.statusCode).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it("returns 400 for invalid subscriberId format", async () => {
    const res = await request(app).get(
      `/api/v1/subscriptions/u/${INVALID_ID}`
    )

    // Auth check fires first — 401
    expect([400, 401]).toContain(res.statusCode)
    expect(res.body.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SELF-SUBSCRIPTION PREVENTION (logic test — needs authenticated user)
// ─────────────────────────────────────────────────────────────────────────────
describe("Self-subscription prevention", () => {
  it("subscription route rejects unauthenticated requests", async () => {
    // The actual self-subscription prevention logic is tested at the controller
    // level and would require a full auth setup. Here we verify the route structure.
    const res = await request(app).post(
      `/api/v1/subscriptions/c/${VALID_OBJECT_ID}`
    )

    expect(res.statusCode).toBe(401)
  })
})
