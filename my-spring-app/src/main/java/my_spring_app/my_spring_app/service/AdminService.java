package my_spring_app.my_spring_app.service;

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
import my_spring_app.my_spring_app.dto.reponse.NodeListResponse;
import my_spring_app.my_spring_app.dto.reponse.NamespaceListResponse;
import my_spring_app.my_spring_app.dto.reponse.DeploymentListResponse;
import my_spring_app.my_spring_app.dto.reponse.PodListResponse;
import my_spring_app.my_spring_app.dto.reponse.StatefulsetListResponse;
import my_spring_app.my_spring_app.dto.reponse.ServiceListResponse;
import my_spring_app.my_spring_app.dto.reponse.IngressListResponse;

public interface AdminService {

    AdminOverviewResponse getOverview();

    AdminUserUsageResponse getUserResourceOverview();

    AdminUserProjectSummaryResponse getUserProjectSummary(Long userId);

    AdminUserProjectListResponse getUserProjectsDetail(Long userId);

    AdminProjectResourceDetailResponse getProjectResourceDetail(Long projectId);

    ClusterCapacityResponse getClusterCapacity();

    ClusterAllocatableResponse getClusterAllocatable();

    AdminDatabaseDetailResponse getDatabaseDetail(Long databaseId);

    AdminBackendDetailResponse getBackendDetail(Long backendId);

    AdminFrontendDetailResponse getFrontendDetail(Long frontendId);

    DashboardMetricsResponse getDashboardMetrics();

    NodeListResponse getNodes();

    NamespaceListResponse getNamespaces();

    DeploymentListResponse getDeployments();

    PodListResponse getPods();

    StatefulsetListResponse getStatefulsets();

    ServiceListResponse getServices();

    IngressListResponse getIngress();
}