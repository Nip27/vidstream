import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Login from "../pages/Login"

// ── Mock AuthContext ──────────────────────────────────────────────────────────
const mockLogin = vi.fn()
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin }),
}))

// ── Mock react-hot-toast ─────────────────────────────────────────────────────
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// ── Mock react-router-dom navigate ───────────────────────────────────────────
const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── Helpers ───────────────────────────────────────────────────────────────────
const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )

beforeEach(() => {
  vi.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
describe("Login component", () => {
  it("renders the sign in form", () => {
    renderLogin()

    expect(screen.getByRole("heading", { name: /vidstream/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument()
  })

  it("renders a link to the register page", () => {
    renderLogin()

    const link = screen.getByRole("link", { name: /create one/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/register")
  })

  it("calls login with form values on submit", async () => {
    mockLogin.mockResolvedValueOnce({ username: "testuser" })
    renderLogin()

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: "user@example.com" },
    })
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    })
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      })
    })
  })

  it("navigates to home after successful login", async () => {
    mockLogin.mockResolvedValueOnce({ username: "testuser" })
    renderLogin()

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: "user@example.com" },
    })
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    })
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/")
    })
  })

  it("shows loading spinner during submission", async () => {
    mockLogin.mockReturnValue(new Promise(() => {})) // never resolves
    renderLogin()

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: "user@example.com" },
    })
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    })
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => {
      const button = screen.getByRole("button")
      expect(button).toBeDisabled()
    })
  })

  it("disables submit button while loading", async () => {
    mockLogin.mockReturnValue(new Promise(() => {}))
    renderLogin()

    const button = screen.getByRole("button", { name: /sign in/i })
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: "x@x.com" },
    })
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "pass1234" },
    })
    fireEvent.click(button)

    await waitFor(() => expect(button).toBeDisabled())
  })
})
