package my_spring_app.my_spring_app.service.impl;

import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.KeyPair;
import com.jcraft.jsch.Session;
import my_spring_app.my_spring_app.dto.reponse.CreateServerResponse;
import my_spring_app.my_spring_app.dto.reponse.ServerResponse;
import my_spring_app.my_spring_app.dto.reponse.TestSshResponse;
import my_spring_app.my_spring_app.dto.request.CreateServerRequest;
import my_spring_app.my_spring_app.dto.request.UpdateServerRequest;
import my_spring_app.my_spring_app.dto.request.TestSshRequest;
import my_spring_app.my_spring_app.entity.ServerEntity;
import my_spring_app.my_spring_app.entity.SshKeyEntity;
import my_spring_app.my_spring_app.repository.ServerRepository;
import my_spring_app.my_spring_app.repository.SshKeyRepository;
import my_spring_app.my_spring_app.service.ServerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

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
    
    @Autowired
    private SshKeyRepository sshKeyRepository;

    /**
     * Lấy tất cả server từ database
     * @return Danh sách tất cả server dưới dạng ServerResponse
     */
    @Override
    public List<ServerResponse> findAll() {
        System.out.println("[findAll] Lấy tất cả server từ database");
        List<ServerEntity> servers = serverRepository.findAll();
        System.out.println("[findAll] Đã lấy được " + servers.size() + " server");
        return servers.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy server theo ID
     * @param id ID của server
     * @return ServerResponse
     * @throws RuntimeException Nếu không tìm thấy server
     */
    @Override
    public ServerResponse findById(Long id) {
        System.out.println("[findById] Tìm server với ID: " + id);
        ServerEntity server = serverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy server với ID: " + id));
        return convertToResponse(server);
    }

    /**
     * Tạo server mới
     * Khi thêm server, hệ thống sẽ:
     * 1. Test SSH connection trước
     * 2. Kiểm tra duplicate
     * 3. Lưu server vào database
     * 4. Tự động generate SSH key và install vào server
     * 5. Configure sudo NOPASSWD cho user
     * 
     * @param request Thông tin request để tạo server
     * @return Response chứa thông tin server đã tạo
     * @throws RuntimeException Nếu có lỗi trong quá trình tạo server
     */
    @Override
    public CreateServerResponse createServer(CreateServerRequest request) {
        System.out.println("[createServer] Bắt đầu tạo server mới với name: " + request.getName());
        
        // Bước 1: Test SSH connection trước
        System.out.println("[createServer] Bước 1: Test SSH connection...");
        boolean canSsh = testSshConnection(request.getIp(), request.getPort(), 
                                           request.getUsername(), request.getPassword());
        if (!canSsh) {
            throw new RuntimeException("Không thể kết nối SSH tới server. Vui lòng kiểm tra IP/Port/Username/Password");
        }
        System.out.println("[createServer] SSH connection thành công");
        
        // Set status = ONLINE nếu SSH connection thành công
        ServerEntity.ServerStatus status = ServerEntity.ServerStatus.ONLINE;
        
        // Bước 2: Kiểm tra duplicate
        System.out.println("[createServer] Bước 2: Kiểm tra duplicate server...");
        if (serverRepository.existsByIpAndPortAndUsername(request.getIp(), request.getPort(), request.getUsername())) {
            throw new RuntimeException("Server đã tồn tại với IP/Port/Username này. Vui lòng sử dụng thông tin khác.");
        }
        System.out.println("[createServer] Không có duplicate");
        
        // Validate role (MASTER, WORKER, DOCKER, ANSIBLE)
        System.out.println("[createServer] Kiểm tra role: " + request.getRole());
        String role = request.getRole().toUpperCase();
        if (!"MASTER".equals(role) && !"WORKER".equals(role) && 
            !"DOCKER".equals(role) && !"ANSIBLE".equals(role)) {
            System.err.println("[createServer] Lỗi: Role không hợp lệ: " + role);
            throw new RuntimeException("Role không hợp lệ. Chỉ hỗ trợ MASTER, WORKER, DOCKER, ANSIBLE");
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

        // Bước 3: Tạo ServerEntity mới và lưu vào database
        System.out.println("[createServer] Bước 3: Tạo ServerEntity mới...");
        ServerEntity serverEntity = new ServerEntity();
        serverEntity.setName(request.getName());
        serverEntity.setIp(request.getIp());
        serverEntity.setPort(request.getPort());
        serverEntity.setUsername(request.getUsername());
        serverEntity.setPassword(request.getPassword());
        serverEntity.setRole(role);
        serverEntity.setStatus(status); // ONLINE vì đã test SSH thành công
        serverEntity.setServerStatus(serverStatus);
        serverEntity.setClusterStatus(clusterStatus);
        System.out.println("[createServer] Đã thiết lập thông tin server: name=" + request.getName() + 
                          ", ip=" + request.getIp() + ", port=" + request.getPort() + 
                          ", role=" + role + ", serverStatus=" + serverStatus + ", clusterStatus=" + clusterStatus);

        // Lưu vào database để có ID
        System.out.println("[createServer] Lưu server vào database...");
        ServerEntity savedServer = serverRepository.saveAndFlush(serverEntity);
        System.out.println("[createServer] Đã lưu server thành công với ID: " + savedServer.getId());

        // Bước 4: Tự động generate SSH key và install vào server
        System.out.println("[createServer] Bước 4: Generate và install SSH key...");
        SshKeyEntity sshKey = null;
        try {
            sshKey = generateAndInstallSshKey(
                request.getIp(), 
                request.getPort(), 
                request.getUsername(), 
                request.getPassword()
            );
            if (sshKey != null) {
                sshKey.setServer(savedServer);
                sshKey = sshKeyRepository.saveAndFlush(sshKey);
                savedServer.setSshKey(sshKey);
                savedServer = serverRepository.saveAndFlush(savedServer);
                System.out.println("[createServer] Đã generate và install SSH key thành công");
            }
        } catch (Exception e) {
            System.err.println("[createServer] Lỗi khi generate SSH key: " + e.getMessage());
            // Không throw exception, vì server đã được lưu, chỉ log lỗi
        }

        // Bước 5: Lấy metrics từ server (CPU, RAM, Disk)
        System.out.println("[createServer] Bước 5: Lấy metrics từ server...");
        try {
            Map<String, String> metrics = getServerMetrics(
                request.getIp(), 
                request.getPort(), 
                request.getUsername(), 
                sshKey != null ? sshKey.getEncryptedPrivateKey() : null,
                request.getPassword()
            );
            if (metrics != null) {
                savedServer.setCpuCores(metrics.get("cpuCores"));
                savedServer.setCpuUsed(metrics.get("cpuUsed"));
                savedServer.setRamTotal(metrics.get("ramTotal"));
                savedServer.setRamUsed(metrics.get("ramUsed"));
                savedServer.setDiskTotal(metrics.get("diskTotal"));
                savedServer.setDiskUsed(metrics.get("diskUsed"));
                savedServer = serverRepository.saveAndFlush(savedServer);
                System.out.println("[createServer] Đã lấy metrics thành công: CPU=" + metrics.get("cpuCores") + 
                                  " (load: " + metrics.get("cpuUsed") + "), RAM=" + metrics.get("ramTotal") + 
                                  " (used: " + metrics.get("ramUsed") + "), Disk=" + metrics.get("diskTotal") + 
                                  " (used: " + metrics.get("diskUsed") + ")");
            }
        } catch (Exception e) {
            System.err.println("[createServer] Lỗi khi lấy metrics: " + e.getMessage());
            // Không throw exception, chỉ log lỗi
        }

        // Tạo response
        System.out.println("[createServer] Tạo CreateServerResponse");
        CreateServerResponse response = new CreateServerResponse();
        response.setId(savedServer.getId());
        response.setName(savedServer.getName());
        response.setIp(savedServer.getIp());
        response.setPort(savedServer.getPort());
        response.setUsername(savedServer.getUsername());
        response.setRole(savedServer.getRole());
        response.setStatus(savedServer.getStatus() != null ? savedServer.getStatus().name() : "OFFLINE");
        response.setServerStatus(savedServer.getServerStatus());
        response.setClusterStatus(savedServer.getClusterStatus());
        response.setCreatedAt(savedServer.getCreatedAt());
        // Thêm metrics vào response nếu có
        response.setCpuCores(savedServer.getCpuCores());
        response.setCpuUsed(savedServer.getCpuUsed());
        response.setRamTotal(savedServer.getRamTotal());
        response.setRamUsed(savedServer.getRamUsed());
        response.setDiskTotal(savedServer.getDiskTotal());
        response.setDiskUsed(savedServer.getDiskUsed());

        System.out.println("[createServer] Hoàn tất tạo server thành công: name=" + savedServer.getName() + 
                          ", id=" + savedServer.getId() + ", role=" + savedServer.getRole());
        return response;
    }
    
    /**
     * Helper method: Test SSH connection
     */
    private boolean testSshConnection(String ip, Integer port, String username, String password) {
        Session session = null;
        try {
            JSch jsch = new JSch();
            session = jsch.getSession(username, ip, port);
            session.setPassword(password);
            Properties config = new Properties();
            config.put("StrictHostKeyChecking", "no");
            session.setConfig(config);
            session.setTimeout(5000);
            session.connect(5000);
            return session.isConnected();
        } catch (Exception e) {
            System.err.println("[testSshConnection] Lỗi: " + e.getMessage());
            return false;
        } finally {
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * Cập nhật thông tin server
     * @param id ID của server cần cập nhật
     * @param request Thông tin request để cập nhật server
     * @return ServerResponse chứa thông tin server đã cập nhật
     * @throws RuntimeException Nếu không tìm thấy server hoặc có lỗi validation
     */
    @Override
    public ServerResponse updateServer(Long id, UpdateServerRequest request) {
        System.out.println("[updateServer] Bắt đầu cập nhật server với ID: " + id);
        
        // Tìm server trong database
        ServerEntity server = serverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy server với ID: " + id));
        
        // Kiểm tra duplicate nếu có thay đổi ip/port/username
        boolean connectionFieldChanged = request.getIp() != null || request.getPort() != null || request.getUsername() != null;
        boolean suppliedNewPassword = request.getPassword() != null && !request.getPassword().isBlank();
        
        if (connectionFieldChanged) {
            String newIp = request.getIp() != null ? request.getIp() : server.getIp();
            Integer newPort = request.getPort() != null ? request.getPort() : server.getPort();
            String newUsername = request.getUsername() != null ? request.getUsername() : server.getUsername();
            
            // Kiểm tra xem có server khác (ID khác) đang dùng cùng ip/port/username không
            if (serverRepository.existsByIpAndPortAndUsername(newIp, newPort, newUsername)) {
                Optional<ServerEntity> existingServer = serverRepository.findByIpAndPortAndUsername(newIp, newPort, newUsername);
                if (existingServer.isPresent() && !existingServer.get().getId().equals(id)) {
                    throw new RuntimeException("Server đã tồn tại với IP/Port/Username này. Vui lòng sử dụng thông tin khác.");
                }
            }
        }
        
        // Nếu có thay đổi connection hoặc password, BẮT BUỘC phải test SSH
        // Nếu không kết nối được thì KHÔNG cho phép update
        boolean sshTested = false;
        if (connectionFieldChanged || suppliedNewPassword) {
            String testIp = request.getIp() != null ? request.getIp() : server.getIp();
            Integer testPort = request.getPort() != null ? request.getPort() : server.getPort();
            String testUsername = request.getUsername() != null ? request.getUsername() : server.getUsername();
            String testPassword = request.getPassword() != null ? request.getPassword() : server.getPassword();
            
            System.out.println("[updateServer] Có thay đổi connection info, bắt buộc test SSH trước khi update");
            System.out.println("[updateServer] Test SSH với: " + testIp + ":" + testPort + " user: " + testUsername);
            
            boolean canSsh = testSshConnection(testIp, testPort, testUsername, testPassword);
            if (!canSsh) {
                System.err.println("[updateServer] SSH test THẤT BẠI - KHÔNG cho phép update");
                throw new RuntimeException("Không thể kết nối SSH tới server với thông tin mới. " +
                        "Vui lòng kiểm tra lại IP/Port/Username/Password. Update bị hủy bỏ.");
            }
            
            // SSH thành công → cho phép update và set status = ONLINE
            server.setStatus(ServerEntity.ServerStatus.ONLINE);
            sshTested = true;
            System.out.println("[updateServer] SSH test thành công, cho phép update và set status = ONLINE");
        }
        
        // Cập nhật các trường nếu có trong request
        if (request.getName() != null && !request.getName().isBlank()) {
            server.setName(request.getName());
        }
        if (request.getIp() != null && !request.getIp().isBlank()) {
            server.setIp(request.getIp());
        }
        if (request.getPort() != null) {
            server.setPort(request.getPort());
        }
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            server.setUsername(request.getUsername());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            server.setPassword(request.getPassword());
        }
        if (request.getRole() != null && !request.getRole().isBlank()) {
            String role = request.getRole().toUpperCase();
            if (!"MASTER".equals(role) && !"WORKER".equals(role) && 
                !"DOCKER".equals(role) && !"ANSIBLE".equals(role)) {
                throw new RuntimeException("Role không hợp lệ. Chỉ hỗ trợ MASTER, WORKER, DOCKER, ANSIBLE");
            }
            server.setRole(role);
        }
        // Chỉ cập nhật status nếu được cung cấp và chưa test SSH
        if (request.getStatus() != null && !request.getStatus().isBlank() && !sshTested) {
            String statusStr = request.getStatus().toUpperCase();
            if (!"ONLINE".equals(statusStr) && !"OFFLINE".equals(statusStr) && 
                !"DISABLED".equals(statusStr)) {
                throw new RuntimeException("Status không hợp lệ. Chỉ hỗ trợ ONLINE, OFFLINE, DISABLED");
            }
            server.setStatus(ServerEntity.ServerStatus.valueOf(statusStr));
        }
        if (request.getServerStatus() != null && !request.getServerStatus().isBlank()) {
            String serverStatus = request.getServerStatus().toUpperCase();
            if (!"RUNNING".equals(serverStatus) && !"STOPPED".equals(serverStatus) && 
                !"BUILDING".equals(serverStatus) && !"ERROR".equals(serverStatus)) {
                throw new RuntimeException("Server status không hợp lệ. Chỉ hỗ trợ RUNNING, STOPPED, BUILDING, ERROR");
            }
            server.setServerStatus(serverStatus);
        }
        if (request.getClusterStatus() != null && !request.getClusterStatus().isBlank()) {
            String clusterStatus = request.getClusterStatus().toUpperCase();
            if (!"AVAILABLE".equals(clusterStatus) && !"UNAVAILABLE".equals(clusterStatus)) {
                throw new RuntimeException("Cluster status không hợp lệ. Chỉ hỗ trợ AVAILABLE, UNAVAILABLE");
            }
            server.setClusterStatus(clusterStatus);
        }
        
        // Cập nhật metrics nếu có
        if (request.getCpuCores() != null) {
            server.setCpuCores(request.getCpuCores().isBlank() ? null : request.getCpuCores());
        }
        if (request.getRamTotal() != null) {
            server.setRamTotal(request.getRamTotal().isBlank() ? null : request.getRamTotal());
        }
        if (request.getDiskTotal() != null) {
            server.setDiskTotal(request.getDiskTotal().isBlank() ? null : request.getDiskTotal());
        }
        
        // Lưu vào database
        System.out.println("[updateServer] Lưu thay đổi vào database");
        ServerEntity updatedServer = serverRepository.save(server);
        System.out.println("[updateServer] Đã cập nhật server thành công với ID: " + updatedServer.getId());
        
        return convertToResponse(updatedServer);
    }

    /**
     * Xóa server
     * Quy trình:
     * 1. Xóa tất cả SSH keys liên quan đến server
     * 2. Xóa SSH key được tham chiếu bởi server (nếu có)
     * 3. Xóa server
     * 
     * @param id ID của server cần xóa
     * @throws RuntimeException Nếu không tìm thấy server
     */
    @Override
    @Transactional
    public void deleteServer(Long id) {
        System.out.println("[deleteServer] Bắt đầu xóa server với ID: " + id);
        
        ServerEntity server = serverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy server với ID: " + id));
        
        // 1) Xóa tất cả SSH keys gắn với server qua ssh_keys.server_id
        try {
            List<SshKeyEntity> keys = sshKeyRepository.findByServer_Id(id);
            if (keys != null && !keys.isEmpty()) {
                System.out.println("[deleteServer] Xóa " + keys.size() + " SSH keys liên quan");
                sshKeyRepository.deleteAll(keys);
            }
        } catch (Exception e) {
            System.err.println("[deleteServer] Lỗi khi xóa SSH keys: " + e.getMessage());
            // Tiếp tục xóa server dù có lỗi
        }
        
        // 2) Xóa SSH key được tham chiếu bởi server.ssh_key_id (nếu có)
        if (server.getSshKey() != null && server.getSshKey().getId() != null) {
            try {
                Long keyId = server.getSshKey().getId();
                server.setSshKey(null);
                server.setClusterStatus("UNAVAILABLE");
                serverRepository.saveAndFlush(server);
                System.out.println("[deleteServer] Xóa SSH key với ID: " + keyId);
                sshKeyRepository.deleteById(keyId);
            } catch (Exception e) {
                System.err.println("[deleteServer] Lỗi khi xóa SSH key: " + e.getMessage());
                // Tiếp tục xóa server dù có lỗi
            }
        }
        
        // 3) Xóa server
        serverRepository.delete(server);
        System.out.println("[deleteServer] Đã xóa server thành công với ID: " + id);
    }

    /**
     * Test SSH connection đến server
     * @param request Thông tin request để test SSH (ip, port, username, password)
     * @return TestSshResponse chứa kết quả test
     */
    @Override
    public TestSshResponse testSsh(TestSshRequest request) {
        System.out.println("[testSsh] Bắt đầu test SSH connection đến: " + request.getIp() + ":" + request.getPort());
        
        TestSshResponse response = new TestSshResponse();
        Session session = null;
        
        try {
            // Tạo JSch instance
            JSch jsch = new JSch();
            
            // Tạo SSH session
            session = jsch.getSession(request.getUsername(), request.getIp(), request.getPort());
            session.setPassword(request.getPassword());
            
            // Cấu hình session
            Properties config = new Properties();
            config.put("StrictHostKeyChecking", "no");
            session.setConfig(config);
            session.setTimeout(5000);
            
            // Kết nối
            session.connect(5000);
            
            System.out.println("[testSsh] Kết nối SSH thành công");
            response.setSuccess(true);
            response.setMessage("Kết nối SSH thành công");
            
        } catch (Exception e) {
            System.err.println("[testSsh] Lỗi khi kết nối SSH: " + e.getMessage());
            response.setSuccess(false);
            response.setMessage("Kết nối SSH thất bại: " + e.getMessage());
        } finally {
            // Đóng session
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
        
        return response;
    }

    /**
     * Helper method: Convert ServerEntity sang ServerResponse
     */
    private ServerResponse convertToResponse(ServerEntity server) {
        ServerResponse response = new ServerResponse();
        response.setId(server.getId());
        response.setName(server.getName());
        response.setIp(server.getIp());
        response.setPort(server.getPort());
        response.setUsername(server.getUsername());
        response.setRole(server.getRole());
        response.setStatus(server.getStatus() != null ? server.getStatus().name() : "OFFLINE");
        response.setServerStatus(server.getServerStatus());
        response.setClusterStatus(server.getClusterStatus());
        response.setCreatedAt(server.getCreatedAt());
        response.setCpuCores(server.getCpuCores());
        response.setCpuUsed(server.getCpuUsed());
        response.setRamTotal(server.getRamTotal());
        response.setRamUsed(server.getRamUsed());
        response.setDiskTotal(server.getDiskTotal());
        response.setDiskUsed(server.getDiskUsed());
        return response;
    }
    
    /**
     * Generate SSH key và install vào server
     * Quy trình:
     * 1. Sinh cặp khóa RSA 2048
     * 2. Cài public key vào ~/.ssh/authorized_keys
     * 3. Cấu hình sudo NOPASSWD cho user
     * 4. Trả về SshKeyEntity để lưu vào database
     */
    private SshKeyEntity generateAndInstallSshKey(String ip, Integer port, String username, String password) 
            throws Exception {
        System.out.println("[generateAndInstallSshKey] Bắt đầu generate SSH key cho " + username + "@" + ip);
        
        JSch jsch = new JSch();
        
        // 1) Sinh cặp khóa RSA 2048
        System.out.println("[generateAndInstallSshKey] Sinh cặp khóa RSA 2048...");
        KeyPair kpair = KeyPair.genKeyPair(jsch, KeyPair.RSA, 2048);
        String comment = username + "@" + ip;
        ByteArrayOutputStream pubOut = new ByteArrayOutputStream();
        kpair.writePublicKey(pubOut, comment);
        String publicKey = pubOut.toString(StandardCharsets.UTF_8);
        ByteArrayOutputStream prvOut = new ByteArrayOutputStream();
        kpair.writePrivateKey(prvOut);
        String privateKeyPem = prvOut.toString(StandardCharsets.UTF_8);
        kpair.dispose();
        System.out.println("[generateAndInstallSshKey] Đã sinh cặp khóa thành công");

        // 2) Cài public key vào ~/.ssh/authorized_keys
        System.out.println("[generateAndInstallSshKey] Cài public key vào server...");
        Session session = jsch.getSession(username, ip, port);
        session.setConfig("StrictHostKeyChecking", "no");
        session.setPassword(password);
        session.connect(5000);
        
        try {
            String escaped = publicKey.replace("'", "'\"'\"'");
            String cmd = "sh -lc \"mkdir -p ~/.ssh && chmod 700 ~/.ssh && touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && printf '%s\\n' '"
                    + escaped + "' >> ~/.ssh/authorized_keys\"";
            ChannelExec ch = (ChannelExec) session.openChannel("exec");
            ch.setCommand(cmd);
            ch.connect(5000);
            while (!ch.isClosed()) {
                try {
                    Thread.sleep(50);
                } catch (InterruptedException ignored) {
                }
            }
            ch.disconnect();
            System.out.println("[generateAndInstallSshKey] Đã cài public key thành công");

            // 3) Cấu hình sudo NOPASSWD cho user
            System.out.println("[generateAndInstallSshKey] Cấu hình sudo NOPASSWD...");
            configureSudoNopasswd(session, username, password);
            System.out.println("[generateAndInstallSshKey] Đã cấu hình sudo NOPASSWD");

        } finally {
            session.disconnect();
        }

        // 4) Tạo SshKeyEntity để lưu vào database
        SshKeyEntity sshKey = new SshKeyEntity();
        sshKey.setKeyType(SshKeyEntity.KeyType.RSA);
        sshKey.setKeyLength(2048);
        sshKey.setPublicKey(publicKey);
        sshKey.setEncryptedPrivateKey(privateKeyPem);
        sshKey.setStatus(SshKeyEntity.KeyStatus.ACTIVE);
        
        System.out.println("[generateAndInstallSshKey] Hoàn tất generate và install SSH key");
        return sshKey;
    }
    
    /**
     * Cấu hình sudo NOPASSWD cho user
     * Cho phép user chạy sudo mà không cần nhập password
     */
    private void configureSudoNopasswd(Session session, String username, String sudoPassword) {
        try {
            System.out.println("[configureSudoNopasswd] Cấu hình sudo NOPASSWD cho user: " + username);

            // 1. Ghi file sudoers
            String sudoersEntry = username + " ALL=(ALL) NOPASSWD:ALL";
            String writeCmd = String.join(" && ",
                    "echo '" + sudoPassword + "' | sudo -S sh -c 'echo \"" + sudoersEntry + "\" > /etc/sudoers.d/"
                            + username + "'",
                    "echo '" + sudoPassword + "' | sudo -S chmod 440 /etc/sudoers.d/" + username,
                    "echo '" + sudoPassword + "' | sudo -S chown root:root /etc/sudoers.d/" + username);
            execSimple(session, writeCmd, 5000);
            System.out.println("[configureSudoNopasswd] Đã ghi file sudoers");

            // 2. Đảm bảo #includedir tồn tại
            String ensureIncludeDir = String.join(" && ",
                    "grep -q '^#includedir /etc/sudoers.d' /etc/sudoers || " +
                            "echo '" + sudoPassword
                            + "' | sudo -S sed -i 's/^@includedir/#includedir/' /etc/sudoers || " +
                            "echo '" + sudoPassword
                            + "' | sudo -S sh -c 'echo \"#includedir /etc/sudoers.d\" >> /etc/sudoers'");
            execSimple(session, ensureIncludeDir, 3000);
            System.out.println("[configureSudoNopasswd] Đã đảm bảo #includedir tồn tại");

            // 3. Kiểm tra cú pháp
            String syntaxCmd = "echo '" + sudoPassword + "' | sudo -S visudo -cf /etc/sudoers.d/" + username
                    + " >/dev/null 2>&1 && echo SYNTAX_OK || echo SYNTAX_ERROR";
            String syntaxResult = execSimple(session, syntaxCmd, 3000).trim();
            System.out.println("[configureSudoNopasswd] Kết quả kiểm tra cú pháp: " + syntaxResult);

            // 4. Kiểm tra thực tế
            String verifyCmd = "sudo -n true && echo 'NOPASSWD_ACTIVE' || echo 'FAIL'";
            String verifyResult = execSimple(session, verifyCmd, 3000).trim();
            System.out.println("[configureSudoNopasswd] Kết quả verify: " + verifyResult);

            if (verifyResult.contains("NOPASSWD_ACTIVE")) {
                System.out.println("[configureSudoNopasswd] Cấu hình sudo NOPASSWD thành công cho " + username);
            } else {
                System.err.println("[configureSudoNopasswd] Cấu hình sudo NOPASSWD thất bại cho " + username);
            }
        } catch (Exception e) {
            System.err.println("[configureSudoNopasswd] Lỗi khi cấu hình sudo NOPASSWD: " + e.getMessage());
            // Không throw exception, chỉ log lỗi
        }
    }
    
    /**
     * Helper method: Thực thi lệnh đơn giản qua SSH và trả về output
     */
    private String execSimple(Session session, String cmd, int timeoutMs) throws Exception {
        ChannelExec ch = (ChannelExec) session.openChannel("exec");
        ch.setCommand(cmd);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ch.setOutputStream(out);
        ch.connect(timeoutMs);
        while (!ch.isClosed()) {
            try {
                Thread.sleep(50);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        ch.disconnect();
        return out.toString(StandardCharsets.UTF_8);
    }
    
    /**
     * Lấy metrics từ server (CPU cores, RAM total, Disk total)
     * Sử dụng SSH key nếu có, nếu không thì dùng password
     * Lấy giá trị chính xác (không làm tròn) từ các lệnh Linux
     */
    private Map<String, String> getServerMetrics(String ip, Integer port, String username, 
                                                   String privateKeyPem, String password) {
        System.out.println("[getServerMetrics] Bắt đầu lấy metrics từ server: " + ip);
        
        // Command để lấy metrics với giá trị chính xác (không dùng -h flag)
        // CPU: nproc trả về số nguyên chính xác, uptime để lấy load average (1-minute)
        // RAM: free -b trả về bytes (total và used), sau đó convert trong Java
        // DISK: df trả về KB (total và used), sau đó convert trong Java
        String metricsCommand = "echo \"CPU_CORES:$(nproc)\"; " +
                "echo \"CPU_LOAD:$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')\"; " +
                "echo \"RAM_TOTAL_BYTES:$(free -b | awk '/^Mem:/{print $2}')\"; " +
                "echo \"RAM_USED_BYTES:$(free -b | awk '/^Mem:/{print $3}')\"; " +
                "echo \"DISK_TOTAL_KB:$(df / | awk 'NR==2{print $2}')\"; " +
                "echo \"DISK_USED_KB:$(df / | awk 'NR==2{print $3}')\"";
        
        Session session = null;
        ChannelExec channel = null;
        
        try {
            JSch jsch = new JSch();
            
            // Ưu tiên dùng SSH key nếu có
            if (privateKeyPem != null && !privateKeyPem.isBlank()) {
                System.out.println("[getServerMetrics] Sử dụng SSH key để kết nối");
                byte[] prv = privateKeyPem.getBytes(StandardCharsets.UTF_8);
                jsch.addIdentity("inmem-key", prv, null, null);
                session = jsch.getSession(username, ip, port);
            } else {
                System.out.println("[getServerMetrics] Sử dụng password để kết nối");
                session = jsch.getSession(username, ip, port);
                session.setPassword(password);
            }
            
            Properties config = new Properties();
            config.put("StrictHostKeyChecking", "no");
            session.setConfig(config);
            session.setTimeout(5000);
            session.connect(5000);
            
            // Thực thi lệnh
            channel = (ChannelExec) session.openChannel("exec");
            channel.setCommand(metricsCommand);
            
            InputStream in = channel.getInputStream();
            channel.connect(5000);
            
            // Đọc output
            ByteArrayOutputStream outBuf = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            long deadline = System.currentTimeMillis() + 5000;
            
            while (true) {
                while (in.available() > 0) {
                    int read = in.read(buffer, 0, buffer.length);
                    if (read < 0) break;
                    outBuf.write(buffer, 0, read);
                }
                if (channel.isClosed()) break;
                if (System.currentTimeMillis() > deadline) break;
                try {
                    Thread.sleep(50);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
            
            String output = outBuf.toString(StandardCharsets.UTF_8).trim();
            System.out.println("[getServerMetrics] Output: " + output);
            
            // Parse output
            return parseMetricsOutput(output);
            
        } catch (Exception e) {
            System.err.println("[getServerMetrics] Lỗi khi lấy metrics: " + e.getMessage());
            return null;
        } finally {
            if (channel != null && channel.isConnected()) {
                channel.disconnect();
            }
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }
    
    /**
     * Parse output từ metrics command và convert sang đơn vị phù hợp
     * Format: CPU_CORES:4\nCPU_LOAD:1.2\nRAM_TOTAL_BYTES:8589934592\nRAM_USED_BYTES:3435973836\nDISK_TOTAL_KB:52428800\nDISK_USED_KB:26214400
     * Convert: RAM từ bytes sang Gi/GiB, Disk từ KB sang G/GB
     */
    private Map<String, String> parseMetricsOutput(String output) {
        Map<String, String> metrics = new HashMap<>();
        String cpuCores = null;
        String cpuUsed = null;
        String ramTotal = null;
        String ramUsed = null;
        String diskTotal = null;
        String diskUsed = null;
        
        try {
            String[] lines = output.split("\n");
            long ramTotalBytes = 0;
            long ramUsedBytes = 0;
            long diskTotalKB = 0;
            long diskUsedKB = 0;
            
            for (String line : lines) {
                line = line.trim();
                if (line.startsWith("CPU_CORES:")) {
                    cpuCores = line.substring(10).trim();
                } else if (line.startsWith("CPU_LOAD:")) {
                    cpuUsed = line.substring(9).trim();
                    // Validate và format CPU load (loại bỏ khoảng trắng)
                    if (cpuUsed != null && !cpuUsed.isEmpty()) {
                        cpuUsed = cpuUsed.trim();
                    }
                } else if (line.startsWith("RAM_TOTAL_BYTES:")) {
                    try {
                        ramTotalBytes = Long.parseLong(line.substring(16).trim());
                        ramTotal = formatBytes(ramTotalBytes);
                    } catch (NumberFormatException e) {
                        System.err.println("[parseMetricsOutput] Lỗi parse RAM total bytes: " + e.getMessage());
                    }
                } else if (line.startsWith("RAM_USED_BYTES:")) {
                    try {
                        ramUsedBytes = Long.parseLong(line.substring(15).trim());
                        ramUsed = formatBytes(ramUsedBytes);
                    } catch (NumberFormatException e) {
                        System.err.println("[parseMetricsOutput] Lỗi parse RAM used bytes: " + e.getMessage());
                    }
                } else if (line.startsWith("DISK_TOTAL_KB:")) {
                    try {
                        diskTotalKB = Long.parseLong(line.substring(14).trim());
                        diskTotal = formatKB(diskTotalKB);
                    } catch (NumberFormatException e) {
                        System.err.println("[parseMetricsOutput] Lỗi parse Disk total KB: " + e.getMessage());
                    }
                } else if (line.startsWith("DISK_USED_KB:")) {
                    try {
                        diskUsedKB = Long.parseLong(line.substring(13).trim());
                        diskUsed = formatKB(diskUsedKB);
                    } catch (NumberFormatException e) {
                        System.err.println("[parseMetricsOutput] Lỗi parse Disk used KB: " + e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[parseMetricsOutput] Lỗi khi parse: " + e.getMessage());
        }
        
        metrics.put("cpuCores", cpuCores != null ? cpuCores : null);
        metrics.put("cpuUsed", cpuUsed != null ? cpuUsed : null);
        metrics.put("ramTotal", ramTotal != null ? ramTotal : null);
        metrics.put("ramUsed", ramUsed != null ? ramUsed : null);
        metrics.put("diskTotal", diskTotal != null ? diskTotal : null);
        metrics.put("diskUsed", diskUsed != null ? diskUsed : null);
        
        return metrics;
    }
    
    /**
     * Convert bytes sang GiB (Gibibyte = 1024^3 bytes)
     * Format: "0.59Gi", "8.5Gi" hoặc "16.2Gi"
     * Luôn hiển thị GiB, kể cả khi < 1 GiB
     */
    private String formatBytes(long bytes) {
        if (bytes <= 0) return "0";
        
        // Convert sang GiB (Gibibyte = 1024^3 bytes)
        double gib = bytes / (1024.0 * 1024.0 * 1024.0);
        
        // Luôn hiển thị GiB với 2 chữ số thập phân
        return String.format("%.2fGi", gib);
    }
    
    /**
     * Convert KB (1KB blocks từ df) sang GiB (Gibibyte)
     * Format: "0.05Gi", "50Gi" hoặc "100.5Gi"
     * Note: df sử dụng 1KB = 1024 bytes (binary), nên convert: kb / (1024^2) = GiB
     * Luôn hiển thị GiB, kể cả khi < 1 GiB
     */
    private String formatKB(long kb) {
        if (kb <= 0) return "0";
        
        // Convert KB (binary, 1KB = 1024 bytes) sang GiB (binary, 1GiB = 1024^3 bytes)
        // Công thức: kb / (1024^2) vì 1KB = 1024 bytes, 1GiB = 1024^3 bytes
        double gib = kb / (1024.0 * 1024.0);
        
        // Luôn hiển thị GiB với 2 chữ số thập phân
        return String.format("%.2fGi", gib);
    }
    
    /**
     * Kiểm tra và cập nhật trạng thái tất cả servers
     * Ping tất cả servers và cập nhật status ONLINE/OFFLINE
     * DISABLED servers sẽ giữ nguyên status
     * 
     * @param timeoutMs Timeout cho mỗi ping (milliseconds)
     * @return Danh sách servers đã được cập nhật
     */
    @Override
    @Transactional
    public List<ServerResponse> checkAllStatuses(int timeoutMs) {
        return checkAllStatuses(timeoutMs, false);
    }
    
    /**
     * Kiểm tra và cập nhật trạng thái tất cả servers
     * Ping tất cả servers và cập nhật status ONLINE/OFFLINE
     * Nếu includeMetrics = true, sẽ lấy metrics cho servers ONLINE
     * DISABLED servers sẽ giữ nguyên status
     * 
     * @param timeoutMs Timeout cho mỗi ping (milliseconds)
     * @param includeMetrics Có lấy metrics không (chỉ cho servers ONLINE)
     * @return Danh sách servers đã được cập nhật
     */
    @Override
    @Transactional
    public List<ServerResponse> checkAllStatuses(int timeoutMs, boolean includeMetrics) {
        System.out.println("[checkAllStatuses] Bắt đầu kiểm tra trạng thái tất cả servers (includeMetrics: " + includeMetrics + ")");
        List<ServerEntity> servers = serverRepository.findAll();
        final int POOL_SIZE = Math.min(servers.size(), 16);
        
        ExecutorService executor = Executors.newFixedThreadPool(POOL_SIZE);
        long start = System.currentTimeMillis();
        List<CompletableFuture<Void>> futures = new ArrayList<>();
        
        for (ServerEntity s : servers) {
            futures.add(CompletableFuture.runAsync(() -> {
                // DISABLED servers: chỉ check status (ping) nhưng giữ nguyên DISABLED
                if (s.getStatus() == ServerEntity.ServerStatus.DISABLED) {
                    // Vẫn ping để check nhưng không thay đổi status
                    try (Socket socket = new Socket()) {
                        InetSocketAddress addr = new InetSocketAddress(s.getIp(), s.getPort() != null ? s.getPort() : 22);
                        socket.connect(addr, timeoutMs);
                        // Giữ nguyên DISABLED, không đổi thành ONLINE
                    } catch (Exception ignored) {
                        // Giữ nguyên DISABLED, không đổi thành OFFLINE
                    }
                    return; // Skip update status
                }
                
                // ONLINE/OFFLINE servers: ping và cập nhật status
                boolean online = false;
                try (Socket socket = new Socket()) {
                    InetSocketAddress addr = new InetSocketAddress(s.getIp(), s.getPort() != null ? s.getPort() : 22);
                    socket.connect(addr, timeoutMs);
                    online = true;
                } catch (Exception ignored) {
                } finally {
                    s.setStatus(online ? ServerEntity.ServerStatus.ONLINE : ServerEntity.ServerStatus.OFFLINE);
                }
                
                // Nếu online và cần lấy metrics
                if (online && includeMetrics) {
                    try {
                        // Lấy SSH key nếu có
                        SshKeyEntity sshKey = s.getSshKey();
                        String privateKeyPem = null;
                        if (sshKey != null && sshKey.getEncryptedPrivateKey() != null) {
                            privateKeyPem = sshKey.getEncryptedPrivateKey();
                        }
                        
                        // Lấy metrics từ server
                        Map<String, String> metrics = getServerMetrics(
                            s.getIp(),
                            s.getPort(),
                            s.getUsername(),
                            privateKeyPem,
                            s.getPassword()
                        );
                        
                        // Cập nhật metrics vào server
                        if (metrics != null) {
                            if (metrics.get("cpuCores") != null) {
                                s.setCpuCores(metrics.get("cpuCores"));
                            }
                            if (metrics.get("cpuUsed") != null) {
                                s.setCpuUsed(metrics.get("cpuUsed"));
                            }
                            if (metrics.get("ramTotal") != null) {
                                s.setRamTotal(metrics.get("ramTotal"));
                            }
                            if (metrics.get("ramUsed") != null) {
                                s.setRamUsed(metrics.get("ramUsed"));
                            }
                            if (metrics.get("diskTotal") != null) {
                                s.setDiskTotal(metrics.get("diskTotal"));
                            }
                            if (metrics.get("diskUsed") != null) {
                                s.setDiskUsed(metrics.get("diskUsed"));
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("[checkAllStatuses] Lỗi khi lấy metrics cho server " + s.getName() + ": " + e.getMessage());
                    }
                }
            }, executor));
        }
        
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        executor.shutdown();
        try {
            executor.awaitTermination(2, TimeUnit.SECONDS);
        } catch (InterruptedException ignored) {
        }
        
        serverRepository.saveAll(servers);
        
        long elapsed = System.currentTimeMillis() - start;
        System.out.println("[checkAllStatuses] Đã kiểm tra " + servers.size() + " servers trong " + elapsed + " ms");
        
        return servers.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Cập nhật trạng thái server (ONLINE/OFFLINE/DISABLED)
     * 
     * @param id ID của server
     * @param status Trạng thái mới
     * @return ServerResponse
     */
    @Override
    @Transactional
    public ServerResponse updateServerStatus(Long id, ServerEntity.ServerStatus status) {
        System.out.println("[updateServerStatus] Cập nhật status server ID: " + id + " thành: " + status);
        
        ServerEntity server = serverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy server với ID: " + id));
        
        server.setStatus(status);
        ServerEntity updatedServer = serverRepository.save(server);
        
        System.out.println("[updateServerStatus] Đã cập nhật status thành công");
        return convertToResponse(updatedServer);
    }
    
}


