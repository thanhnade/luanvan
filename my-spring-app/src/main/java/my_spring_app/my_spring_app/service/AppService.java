package my_spring_app.my_spring_app.service;

import my_spring_app.my_spring_app.dto.reponse.DeployAppDockerResponse;
import my_spring_app.my_spring_app.dto.reponse.DeployAppFileResponse;
import my_spring_app.my_spring_app.dto.reponse.DeployAppResponse;
import my_spring_app.my_spring_app.dto.reponse.ListAppsResponse;
import my_spring_app.my_spring_app.dto.request.DeployAppDockerRequest;
import my_spring_app.my_spring_app.dto.request.DeployAppFileRequest;
import my_spring_app.my_spring_app.dto.request.DeployAppRequest;
import my_spring_app.my_spring_app.dto.request.GetAppsByUserRequest;

public interface AppService {

//    DeployAppResponse deployApp(DeployAppRequest request);
    DeployAppDockerResponse deployAppDocker(DeployAppDockerRequest request);
    DeployAppFileResponse deployAppFile(DeployAppFileRequest request);
    ListAppsResponse getAppsByUser(GetAppsByUserRequest request);
}

