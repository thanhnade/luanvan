package my_spring_app.my_spring_app.controller;

import my_spring_app.my_spring_app.dto.reponse.AdminOverviewResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminProjectResourceDetailResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserProjectListResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserProjectSummaryResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserUsageResponse;
import my_spring_app.my_spring_app.dto.reponse.ClusterCapacityResponse;
import my_spring_app.my_spring_app.dto.reponse.ClusterAllocatableResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminDatabaseDetailResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminBackendDetailResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminFrontendDetailResponse;
import my_spring_app.my_spring_app.dto.reponse.DashboardMetricsResponse;
import my_spring_app.my_spring_app.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    // User Services - Services
    // Cluster & Overview - Overview
    @GetMapping("/user-services/overview")
    public ResponseEntity<AdminOverviewResponse> getOverview() {
        AdminOverviewResponse response = adminService.getOverview();
        return ResponseEntity.ok(response);
    }

    // User Services - Services
    @GetMapping("/user-services/users")
    public ResponseEntity<AdminUserUsageResponse> getUserUsage() {
        AdminUserUsageResponse response = adminService.getUserResourceOverview();
        return ResponseEntity.ok(response);
    }

    // User Services - Services
    @GetMapping("/user-services/user-summary")
    public ResponseEntity<AdminUserProjectSummaryResponse> getUserSummary(@RequestParam Long userId) {
        AdminUserProjectSummaryResponse response = adminService.getUserProjectSummary(userId);
        return ResponseEntity.ok(response);
    }

    // User Services - Services
    @GetMapping("/user-services/user-projects")
    public ResponseEntity<AdminUserProjectListResponse> getUserProjects(@RequestParam Long userId) {
        AdminUserProjectListResponse response = adminService.getUserProjectsDetail(userId);
        return ResponseEntity.ok(response);
    }

    // User Services - Services
    @GetMapping("/user-services/project-resources")
    public ResponseEntity<AdminProjectResourceDetailResponse> getProjectResources(@RequestParam Long projectId) {
        AdminProjectResourceDetailResponse response = adminService.getProjectResourceDetail(projectId);
        return ResponseEntity.ok(response);
    }

    // Cluster Services - Services
    // Cluster & Overview - Overview
    @GetMapping("/cluster/capacity")
    public ResponseEntity<ClusterCapacityResponse> getClusterCapacity() {
        ClusterCapacityResponse response = adminService.getClusterCapacity();
        return ResponseEntity.ok(response);
    }

    // Cluster Services - Services
    // Cluster & Overview - Overview
    @GetMapping("/cluster/allocatable")
    public ResponseEntity<ClusterAllocatableResponse> getClusterAllocatable() {
        ClusterAllocatableResponse response = adminService.getClusterAllocatable();
        return ResponseEntity.ok(response);
    }

    // User Services - Services
    @GetMapping("/database/detail")
    public ResponseEntity<AdminDatabaseDetailResponse> getDatabaseDetail(@RequestParam Long databaseId) {
        AdminDatabaseDetailResponse response = adminService.getDatabaseDetail(databaseId);
        return ResponseEntity.ok(response);
    }

    // User Services - Services
    @GetMapping("/backend/detail")
    public ResponseEntity<AdminBackendDetailResponse> getBackendDetail(@RequestParam Long backendId) {
        AdminBackendDetailResponse response = adminService.getBackendDetail(backendId);
        return ResponseEntity.ok(response);
    }

    // User Services - Services
    @GetMapping("/frontend/detail")
    public ResponseEntity<AdminFrontendDetailResponse> getFrontendDetail(@RequestParam Long frontendId) {
        AdminFrontendDetailResponse response = adminService.getFrontendDetail(frontendId);
        return ResponseEntity.ok(response);
    }

    // Cluster & Overview - Overview
    @GetMapping("/dashboard/metrics")
    public ResponseEntity<DashboardMetricsResponse> getDashboardMetrics() {
        DashboardMetricsResponse response = adminService.getDashboardMetrics();
        return ResponseEntity.ok(response);
    }
}