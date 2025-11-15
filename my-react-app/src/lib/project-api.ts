/**
 * API service cho projects
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"

export interface ProjectSummaryItem {
  id: number
  projectName: string
  description?: string
  databaseCount: number
  backendCount: number
  frontendCount: number
  updatedAt: string // ISO date string
}

export interface ProjectSummaryResponse {
  projects: ProjectSummaryItem[]
}

/**
 * Lấy danh sách projects của user
 */
export async function getUserProjects(username: string): Promise<ProjectSummaryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/projects?username=${encodeURIComponent(username)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Có lỗi xảy ra khi lấy danh sách projects" }))
    throw new Error(error.message || "Có lỗi xảy ra khi lấy danh sách projects")
  }

  return response.json()
}

/**
 * Tạo project mới
 */
export interface CreateProjectRequest {
  projectName: string
  description?: string
  username: string
}

export interface CreateProjectResponse {
  id: number
  projectName: string
  description?: string
  uuid_k8s: string
  namespace: string
  createdAt: string
}

export async function createProject(request: CreateProjectRequest): Promise<CreateProjectResponse> {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Có lỗi xảy ra khi tạo project" }))
    throw new Error(error.message || "Có lỗi xảy ra khi tạo project")
  }

  return response.json()
}

