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

/**
 * Lấy thông tin cơ bản của project
 */
export interface ProjectBasicInfoResponse {
  id: number
  projectName: string
  description?: string
  updatedAt: string // ISO date string
}

export async function getProjectBasicInfo(projectId: string | number): Promise<ProjectBasicInfoResponse> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/basic-info`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Có lỗi xảy ra khi lấy thông tin project" }))
    throw new Error(error.message || "Có lỗi xảy ra khi lấy thông tin project")
  }

  return response.json()
}

/**
 * Lấy thông tin tổng quan của project
 */
export interface ComponentStats {
  total: number
  running: number
  paused: number
  stopped: number
  error: number
}

export interface ProjectOverviewResponse {
  id: number
  projectName: string
  description?: string
  createdAt: string
  updatedAt: string
  uuid_k8s: string
  namespace: string
  databases: ComponentStats
  backends: ComponentStats
  frontends: ComponentStats
}

export async function getProjectOverview(projectId: string | number): Promise<ProjectOverviewResponse> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/overview`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Có lỗi xảy ra khi lấy thông tin tổng quan project" }))
    throw new Error(error.message || "Có lỗi xảy ra khi lấy thông tin tổng quan project")
  }

  return response.json()
}

/**
 * Lấy danh sách databases của project
 */
export interface DatabaseInfo {
  id: number
  projectName: string
  description?: string
  databaseType: string // MYSQL, MONGODB
  databaseIp: string
  databasePort: number
  databaseName: string
  databaseUsername: string
  databasePassword: string
  status: string // RUNNING, STOPPED, ERROR
  createdAt: string
}

export interface ProjectDatabaseListResponse {
  databases: DatabaseInfo[]
}

export async function getProjectDatabases(projectId: string | number): Promise<ProjectDatabaseListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/databases`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Có lỗi xảy ra khi lấy danh sách databases" }))
    throw new Error(error.message || "Có lỗi xảy ra khi lấy danh sách databases")
  }

  return response.json()
}

/**
 * Lấy danh sách backends của project
 */
export interface BackendInfo {
  id: number
  projectName: string
  description?: string
  deploymentType: string // DOCKER, FILE
  frameworkType: string // SPRING, NODEJS
  databaseIp?: string
  databasePort?: number
  databaseName?: string
  databaseUsername?: string
  databasePassword?: string
  uuid_k8s: string
  sourcePath?: string
  yamlPath?: string
  dockerImage?: string
  domainNameSystem?: string
  status: string // RUNNING, STOPPED, ERROR
  createdAt: string
}

export interface ProjectBackendListResponse {
  backends: BackendInfo[]
}

export async function getProjectBackends(projectId: string | number): Promise<ProjectBackendListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/backends`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Có lỗi xảy ra khi lấy danh sách backends" }))
    throw new Error(error.message || "Có lỗi xảy ra khi lấy danh sách backends")
  }

  return response.json()
}

/**
 * Lấy danh sách frontends của project
 */
export interface FrontendInfo {
  id: number
  projectName: string
  description?: string
  deploymentType: string // DOCKER, FILE
  frameworkType: string // REACT, VUE, ANGULAR
  uuid_k8s: string
  sourcePath?: string
  yamlPath?: string
  dockerImage?: string
  domainNameSystem?: string
  status: string // RUNNING, STOPPED, ERROR
  createdAt: string
}

export interface ProjectFrontendListResponse {
  frontends: FrontendInfo[]
}

export async function getProjectFrontends(projectId: string | number): Promise<ProjectFrontendListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/frontends`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Có lỗi xảy ra khi lấy danh sách frontends" }))
    throw new Error(error.message || "Có lỗi xảy ra khi lấy danh sách frontends")
  }

  return response.json()
}

/**
 * Xóa project
 */
export async function deleteProject(projectId: string | number, username: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}?username=${encodeURIComponent(username)}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Có lỗi xảy ra khi xóa project" }))
    throw new Error(error.message || "Có lỗi xảy ra khi xóa project")
  }
}

/**
 * Lịch sử triển khai
 */
export interface DeploymentHistoryItem {
  type: "PROJECT" | "DATABASE" | "BACKEND" | "FRONTEND"
  id: number
  name: string
  description?: string
  createdAt: string
  databaseType?: string
  frameworkType?: string
  deploymentType?: string
}

export interface ProjectDeploymentHistoryResponse {
  projectId: number
  projectName: string
  projectCreatedAt: string
  historyItems: DeploymentHistoryItem[]
}

export async function getProjectDeploymentHistory(projectId: string | number): Promise<ProjectDeploymentHistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/deployment-history`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Có lỗi xảy ra khi lấy lịch sử triển khai" }))
    throw new Error(error.message || "Có lỗi xảy ra khi lấy lịch sử triển khai")
  }

  return response.json()
}

/**
 * Deploy Database
 */
export interface DeployDatabaseRequest {
  projectName: string
  databaseType: "MYSQL" | "MONGODB"
  databaseName: string
  databaseUsername: string
  databasePassword: string
  file?: File | null
  username: string
  projectId: number
}

export interface DeployDatabaseResponse {
  status: string
  databaseIp: string
  databasePort: number
  databaseName: string
  databaseUsername: string
  databasePassword: string
}

export async function deployDatabase(request: DeployDatabaseRequest): Promise<DeployDatabaseResponse> {
  const formData = new FormData()
  formData.append("projectName", request.projectName)
  formData.append("databaseType", request.databaseType)
  formData.append("databaseName", request.databaseName)
  formData.append("databaseUsername", request.databaseUsername)
  formData.append("databasePassword", request.databasePassword)
  formData.append("username", request.username)
  formData.append("projectId", String(request.projectId))
  
  if (request.file) {
    formData.append("file", request.file)
  }

  const response = await fetch(`${API_BASE_URL}/api/project-databases/deploy`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Có lỗi xảy ra khi triển khai database" }))
    throw new Error(error.message || "Có lỗi xảy ra khi triển khai database")
  }

  return response.json()
}

