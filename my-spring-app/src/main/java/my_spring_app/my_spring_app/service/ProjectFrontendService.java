package my_spring_app.my_spring_app.service;

import my_spring_app.my_spring_app.dto.reponse.DeployFrontendResponse;
import my_spring_app.my_spring_app.dto.reponse.ListProjectFrontendResponse;
import my_spring_app.my_spring_app.dto.request.DeployFrontendRequest;

public interface ProjectFrontendService {

    ListProjectFrontendResponse getAllProjectFrontends();
    
    DeployFrontendResponse deploy(DeployFrontendRequest request);
}

