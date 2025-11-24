package my_spring_app.my_spring_app.service;

import my_spring_app.my_spring_app.dto.reponse.CreateServerResponse;
import my_spring_app.my_spring_app.dto.reponse.ServerResponse;
import my_spring_app.my_spring_app.dto.reponse.TestSshResponse;
import my_spring_app.my_spring_app.dto.request.CreateServerRequest;
import my_spring_app.my_spring_app.dto.request.UpdateServerRequest;
import my_spring_app.my_spring_app.dto.request.TestSshRequest;
import my_spring_app.my_spring_app.entity.ServerEntity;

import java.util.List;

public interface ServerService {
    List<ServerResponse> findAll();
    
    ServerResponse findById(Long id);
    
    CreateServerResponse createServer(CreateServerRequest request);
    
    ServerResponse updateServer(Long id, UpdateServerRequest request);
    
    void deleteServer(Long id);
    
    TestSshResponse testSsh(TestSshRequest request);
    
    List<ServerResponse> checkAllStatuses(int timeoutMs);
    
    List<ServerResponse> checkAllStatuses(int timeoutMs, boolean includeMetrics);
    
    ServerResponse updateServerStatus(Long id, ServerEntity.ServerStatus status);
}


