package my_spring_app.my_spring_app.service;

import my_spring_app.my_spring_app.dto.reponse.AdminOverviewResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminProjectResourceDetailResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserProjectListResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserProjectSummaryResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserUsageResponse;
import my_spring_app.my_spring_app.dto.reponse.ClusterCapacityResponse;
import my_spring_app.my_spring_app.dto.reponse.ClusterAllocatableResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminDatabaseDetailResponse;

public interface AdminService {

    AdminOverviewResponse getOverview();

    AdminUserUsageResponse getUserResourceOverview();

    AdminUserProjectSummaryResponse getUserProjectSummary(Long userId);

    AdminUserProjectListResponse getUserProjectsDetail(Long userId);

    AdminProjectResourceDetailResponse getProjectResourceDetail(Long projectId);

    ClusterCapacityResponse getClusterCapacity();

    ClusterAllocatableResponse getClusterAllocatable();

    AdminDatabaseDetailResponse getDatabaseDetail(Long databaseId);
}