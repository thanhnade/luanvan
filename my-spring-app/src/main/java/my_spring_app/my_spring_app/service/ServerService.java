package my_spring_app.my_spring_app.service;

import my_spring_app.my_spring_app.dto.reponse.CreateServerResponse;
import my_spring_app.my_spring_app.dto.reponse.ServerResponse;
import my_spring_app.my_spring_app.dto.reponse.ServerAuthStatusResponse;
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
    
    List<ServerResponse> checkAllServers();
    
    ServerResponse updateServerStatus(Long id, ServerEntity.ServerStatus status);
    
    /**
     * Reconnect đến server và tự động generate SSH key nếu chưa có
     * @param id Server ID
     * @param password Password để kết nối (optional nếu đã có SSH key)
     * @return ServerResponse với status đã được cập nhật
     */
    ServerResponse reconnectServer(Long id, String password);
    
    /**
     * Disconnect server (set status = DISABLED)
     * @param id Server ID
     * @return ServerResponse với status = DISABLED
     */
    ServerResponse disconnectServer(Long id);
    
    /**
     * Thực thi command trên server qua SSH
     * @param id Server ID
     * @param command Command cần thực thi
     * @param timeoutMs Timeout (milliseconds)
     * @return Output của command
     */
    String execCommand(Long id, String command, int timeoutMs);
    
    /**
     * Shutdown server qua SSH
     * @param id Server ID
     * @return Output của shutdown command
     */
    String shutdownServer(Long id);
    
    /**
     * Restart server qua SSH
     * @param id Server ID
     * @return Output của restart command
     */
    String restartServer(Long id);
    
    /**
     * Lấy private key PEM của server
     * @param serverId Server ID
     * @return Private key PEM hoặc null nếu không có
     */
    String resolveServerPrivateKeyPem(Long serverId);
    
    /**
     * Ping một server cụ thể để kiểm tra kết nối
     * @param id Server ID
     * @param timeoutMs Timeout (milliseconds)
     * @return true nếu ping thành công, false nếu không
     */
    boolean pingServer(Long id, int timeoutMs);
    
    /**
     * Kiểm tra trạng thái xác thực của server (SSH key và sudo NOPASSWD)
     * @param id Server ID
     * @return ServerAuthStatusResponse chứa thông tin về SSH key và sudo NOPASSWD
     */
    ServerAuthStatusResponse checkServerAuthStatus(Long id);
}


