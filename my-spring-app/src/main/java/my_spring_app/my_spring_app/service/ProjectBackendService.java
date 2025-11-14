package my_spring_app.my_spring_app.service;

import my_spring_app.my_spring_app.dto.reponse.DeployBackendResponse;
import my_spring_app.my_spring_app.dto.request.DeployBackendRequest;

public interface ProjectBackendService {

    DeployBackendResponse deploy(DeployBackendRequest request);
}

