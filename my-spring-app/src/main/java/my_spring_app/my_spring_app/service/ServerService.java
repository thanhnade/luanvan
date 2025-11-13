package my_spring_app.my_spring_app.service;

import my_spring_app.my_spring_app.dto.reponse.CreateServerResponse;
import my_spring_app.my_spring_app.dto.request.CreateServerRequest;
import my_spring_app.my_spring_app.entity.ServerEntity;

import java.util.List;

public interface ServerService {
    List<ServerEntity> findAll();
    
    CreateServerResponse createServer(CreateServerRequest request);
}


