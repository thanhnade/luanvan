package my_spring_app.my_spring_app.service;

import my_spring_app.my_spring_app.dto.reponse.AdminOverviewResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserProjectListResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserProjectSummaryResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserUsageResponse;

public interface AdminService {

    AdminOverviewResponse getOverview();

    AdminUserUsageResponse getUserResourceOverview();

    AdminUserProjectSummaryResponse getUserProjectSummary(Long userId);

    AdminUserProjectListResponse getUserProjectsDetail(Long userId);
}