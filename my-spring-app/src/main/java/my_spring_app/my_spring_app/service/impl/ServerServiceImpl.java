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

/**
 * Service implementation cho Server
 * Xử lý các nghiệp vụ liên quan đến quản lý server
 */
@Service
@Transactional
public class ServerServiceImpl implements ServerService {

    // Repository để truy vấn Server entities
    @Autowired
    private ServerRepository serverRepository;

    /**
     * Lấy tất cả server từ database
     * @return Danh sách tất cả server
     */
    @Override
    public List<ServerEntity> findAll() {
        System.out.println("[findAll] Lấy tất cả server từ database");
        List<ServerEntity> servers = serverRepository.findAll();
        System.out.println("[findAll] Đã lấy được " + servers.size() + " server");
        return servers;
    }

    /**
     * Tạo server mới
     * @param request Thông tin request để tạo server
     * @return Response chứa thông tin server đã tạo
     * @throws RuntimeException Nếu có lỗi trong quá trình tạo server
     */
    @Override
    public CreateServerResponse createServer(CreateServerRequest request) {
        System.out.println("[createServer] Bắt đầu tạo server mới với name: " + request.getName());
        
        // Validate role (MASTER, WORKER, DOCKER, DATABASE)
        System.out.println("[createServer] Kiểm tra role: " + request.getRole());
        String role = request.getRole().toUpperCase();
        if (!"MASTER".equals(role) && !"WORKER".equals(role) && 
            !"DOCKER".equals(role) && !"DATABASE".equals(role)) {
            System.err.println("[createServer] Lỗi: Role không hợp lệ: " + role);
            throw new RuntimeException("Role không hợp lệ. Chỉ hỗ trợ MASTER, WORKER, DOCKER, DATABASE");
        }
        System.out.println("[createServer] Role hợp lệ: " + role);

        // Validate server status (RUNNING, STOPPED, BUILDING, ERROR)
        System.out.println("[createServer] Kiểm tra server status: " + request.getServerStatus());
        String serverStatus = request.getServerStatus().toUpperCase();
        if (!"RUNNING".equals(serverStatus) && !"STOPPED".equals(serverStatus) && 
            !"BUILDING".equals(serverStatus) && !"ERROR".equals(serverStatus)) {
            System.err.println("[createServer] Lỗi: Server status không hợp lệ: " + serverStatus);
            throw new RuntimeException("Server status không hợp lệ. Chỉ hỗ trợ RUNNING, STOPPED, BUILDING, ERROR");
        }
        System.out.println("[createServer] Server status hợp lệ: " + serverStatus);

        // Validate cluster status (AVAILABLE, UNAVAILABLE)
        System.out.println("[createServer] Kiểm tra cluster status: " + request.getClusterStatus());
        String clusterStatus = request.getClusterStatus().toUpperCase();
        if (!"AVAILABLE".equals(clusterStatus) && !"UNAVAILABLE".equals(clusterStatus)) {
            System.err.println("[createServer] Lỗi: Cluster status không hợp lệ: " + clusterStatus);
            throw new RuntimeException("Cluster status không hợp lệ. Chỉ hỗ trợ AVAILABLE, UNAVAILABLE");
        }
        System.out.println("[createServer] Cluster status hợp lệ: " + clusterStatus);

        // Tạo ServerEntity mới
        System.out.println("[createServer] Tạo ServerEntity mới");
        ServerEntity serverEntity = new ServerEntity();
        serverEntity.setName(request.getName());
        serverEntity.setIp(request.getIp());
        serverEntity.setPort(request.getPort());
        serverEntity.setUsername(request.getUsername());
        serverEntity.setPassword(request.getPassword());
        serverEntity.setRole(role);
        serverEntity.setServerStatus(serverStatus);
        serverEntity.setClusterStatus(clusterStatus);
        System.out.println("[createServer] Đã thiết lập thông tin server: name=" + request.getName() + 
                          ", ip=" + request.getIp() + ", port=" + request.getPort() + 
                          ", role=" + role + ", serverStatus=" + serverStatus + ", clusterStatus=" + clusterStatus);

        // Lưu vào database
        System.out.println("[createServer] Lưu server vào database");
        ServerEntity savedServer = serverRepository.save(serverEntity);
        System.out.println("[createServer] Đã lưu server thành công với ID: " + savedServer.getId());

        // Tạo response
        System.out.println("[createServer] Tạo CreateServerResponse");
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

        System.out.println("[createServer] Hoàn tất tạo server thành công: name=" + savedServer.getName() + 
                          ", id=" + savedServer.getId() + ", role=" + savedServer.getRole());
        return response;
    }
}


