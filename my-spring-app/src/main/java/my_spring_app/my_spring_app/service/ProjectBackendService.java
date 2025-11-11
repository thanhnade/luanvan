package my_spring_app.my_spring_app.service;

import my_spring_app.my_spring_app.dto.reponse.DeployBackendResponse;
import my_spring_app.my_spring_app.dto.reponse.ListProjectBackendResponse;
import my_spring_app.my_spring_app.dto.request.DeployBackendRequest;

public interface ProjectBackendService {

    ListProjectBackendResponse getAllProjectBackends();

    DeployBackendResponse deploy(DeployBackendRequest request);
}

