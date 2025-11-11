package my_spring_app.my_spring_app.service.impl;

import my_spring_app.my_spring_app.dto.reponse.CreateServerResponse;
import my_spring_app.my_spring_app.dto.request.CreateServerRequest;
import my_spring_app.my_spring_app.entity.ServerEntity;
import my_spring_app.my_spring_app.repository.ServerRepository;
import my_spring_app.my_spring_app.service.ServerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ServerServiceImpl implements ServerService {

    @Autowired
    private ServerRepository serverRepository;

    @Override
    public List<ServerEntity> findAll() {
        return serverRepository.findAll();
    }

    @Override
    public CreateServerResponse createServer(CreateServerRequest request) {
        // Validate role
        String role = request.getRole().toUpperCase();
        if (!"MASTER".equals(role) && !"WORKER".equals(role) && 
            !"DOCKER".equals(role) && !"DATABASE".equals(role)) {
            throw new RuntimeException("Role không hợp lệ. Chỉ hỗ trợ MASTER, WORKER, DOCKER, DATABASE");
        }

        // Validate server status
        String serverStatus = request.getServerStatus().toUpperCase();
        if (!"RUNNING".equals(serverStatus) && !"STOPPED".equals(serverStatus) && 
            !"BUILDING".equals(serverStatus) && !"ERROR".equals(serverStatus)) {
            throw new RuntimeException("Server status không hợp lệ. Chỉ hỗ trợ RUNNING, STOPPED, BUILDING, ERROR");
        }

        // Validate cluster status
        String clusterStatus = request.getClusterStatus().toUpperCase();
        if (!"AVAILABLE".equals(clusterStatus) && !"UNAVAILABLE".equals(clusterStatus)) {
            throw new RuntimeException("Cluster status không hợp lệ. Chỉ hỗ trợ AVAILABLE, UNAVAILABLE");
        }

        // Tạo ServerEntity mới
        ServerEntity serverEntity = new ServerEntity();
        serverEntity.setName(request.getName());
        serverEntity.setIp(request.getIp());
        serverEntity.setPort(request.getPort());
        serverEntity.setUsername(request.getUsername());
        serverEntity.setPassword(request.getPassword());
        serverEntity.setRole(role);
        serverEntity.setServerStatus(serverStatus);
        serverEntity.setClusterStatus(clusterStatus);

        // Lưu vào database
        ServerEntity savedServer = serverRepository.save(serverEntity);

        // Tạo response
        CreateServerResponse response = new CreateServerResponse();
        response.setId(savedServer.getId());
        response.setName(savedServer.getName());
        response.setIp(savedServer.getIp());
        response.setPort(savedServer.getPort());
        response.setUsername(savedServer.getUsername());
        response.setRole(savedServer.getRole());
        response.setServerStatus(savedServer.getServerStatus());
        response.setClusterStatus(savedServer.getClusterStatus());
        response.setCreatedAt(savedServer.getCreatedAt());

        return response;
    }
}


