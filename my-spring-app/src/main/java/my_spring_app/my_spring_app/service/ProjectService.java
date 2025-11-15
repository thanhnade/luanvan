package my_spring_app.my_spring_app.service;

import my_spring_app.my_spring_app.dto.reponse.CreateProjectResponse;
import my_spring_app.my_spring_app.dto.reponse.ProjectSummaryResponse;
import my_spring_app.my_spring_app.dto.request.CreateProjectRequest;

public interface ProjectService {
    
    CreateProjectResponse createProject(CreateProjectRequest request);
    
    ProjectSummaryResponse getUserProjects(String username);
}

