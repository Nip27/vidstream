import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import VideoCard from "../components/VideoCard"

// ── Test data ─────────────────────────────────────────────────────────────────
const mockVideo = {
  _id: "507f1f77bcf86cd799439011",
  title: "Introduction to React Hooks",
  thumbnail: "https://example.com/thumbnail.jpg",
  videoFile: "https://example.com/video.mp4",
  views: 12500,
  createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  isPublished: true,
  duration: 425,
  ownerDetails: {
    username: "reactdev",
    avatar: "https://example.com/avatar.jpg",
  },
}

const renderVideoCard = (video = mockVideo) =>
  render(
    <MemoryRouter>
      <VideoCard video={video} />
    </MemoryRouter>
  )

// ─────────────────────────────────────────────────────────────────────────────
describe("VideoCard component", () => {
  it("renders video title", () => {
    renderVideoCard()
    expect(screen.getByText("Introduction to React Hooks")).toBeInTheDocument()
  })

  it("renders owner username", () => {
    renderVideoCard()
    expect(screen.getByText("@reactdev")).toBeInTheDocument()
  })

  it("renders formatted view count (K for thousands)", () => {
    renderVideoCard()
    // 12500 views → "12.5K views"
    expect(screen.getByText(/12\.5K views/i)).toBeInTheDocument()
  })

  it("renders view count for small numbers", () => {
    renderVideoCard({ ...mockVideo, views: 850 })
    expect(screen.getByText(/850 views/i)).toBeInTheDocument()
  })

  it("renders view count for millions", () => {
    renderVideoCard({ ...mockVideo, views: 2300000 })
    expect(screen.getByText(/2\.3M views/i)).toBeInTheDocument()
  })

  it("links to the correct watch page", () => {
    renderVideoCard()
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", `/watch/${mockVideo._id}`)
  })

  it("renders thumbnail image with correct alt text", () => {
    renderVideoCard()
    const thumbnail = screen.getByAltText("Introduction to React Hooks")
    expect(thumbnail).toBeInTheDocument()
    expect(thumbnail).toHaveAttribute("src", mockVideo.thumbnail)
  })

  it("shows 'Private' badge for unpublished videos", () => {
    renderVideoCard({ ...mockVideo, isPublished: false })
    expect(screen.getByText("Private")).toBeInTheDocument()
  })

  it("does not show 'Private' badge for published videos", () => {
    renderVideoCard()
    expect(screen.queryByText("Private")).not.toBeInTheDocument()
  })

  it("renders time ago for video creation date", () => {
    renderVideoCard()
    // 1 day ago
    expect(screen.getByText(/1d ago/i)).toBeInTheDocument()
  })

  it("handles missing ownerDetails gracefully (falls back to owner)", () => {
    const videoWithOwner = {
      ...mockVideo,
      ownerDetails: undefined,
      owner: { username: "fallbackuser", avatar: "https://example.com/avatar2.jpg" },
    }
    renderVideoCard(videoWithOwner)
    expect(screen.getByText("@fallbackuser")).toBeInTheDocument()
  })

  it("handles completely missing owner gracefully", () => {
    const videoNoOwner = { ...mockVideo, ownerDetails: undefined, owner: undefined }
    renderVideoCard(videoNoOwner)
    expect(screen.getByText("@unknown")).toBeInTheDocument()
  })
})
