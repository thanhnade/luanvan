package my_spring_app.my_spring_app.service;

import my_spring_app.my_spring_app.dto.reponse.DeployDatabaseResponse;
import my_spring_app.my_spring_app.dto.reponse.ListProjectDatabaseResponse;
import my_spring_app.my_spring_app.dto.request.DeployDatabaseRequest;

public interface ProjectDatabaseService {

    ListProjectDatabaseResponse getAllProjectDatabases();
    
    DeployDatabaseResponse deploy(DeployDatabaseRequest request);
}

