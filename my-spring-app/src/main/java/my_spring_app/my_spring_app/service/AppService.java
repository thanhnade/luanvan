package my_spring_app.my_spring_app.service;

import my_spring_app.my_spring_app.dto.reponse.DeployAppResponse;
import my_spring_app.my_spring_app.dto.request.DeployAppRequest;

public interface AppService {

    DeployAppResponse deployApp(DeployAppRequest request);
}

