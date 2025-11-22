package my_spring_app.my_spring_app.service.impl;

import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import my_spring_app.my_spring_app.dto.reponse.AdminOverviewResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminProjectResourceDetailResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserProjectListResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserProjectSummaryResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserUsageResponse;
import my_spring_app.my_spring_app.dto.reponse.ClusterCapacityResponse;
import my_spring_app.my_spring_app.dto.reponse.ClusterAllocatableResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminDatabaseDetailResponse;
import my_spring_app.my_spring_app.entity.ProjectEntity;
import my_spring_app.my_spring_app.entity.ProjectBackendEntity;
import my_spring_app.my_spring_app.entity.ProjectDatabaseEntity;
import my_spring_app.my_spring_app.entity.ProjectFrontendEntity;
import my_spring_app.my_spring_app.entity.ServerEntity;
import my_spring_app.my_spring_app.entity.UserEntity;
import my_spring_app.my_spring_app.repository.ProjectRepository;
import my_spring_app.my_spring_app.repository.ProjectDatabaseRepository;
import my_spring_app.my_spring_app.repository.ServerRepository;
import my_spring_app.my_spring_app.repository.UserRepository;
import my_spring_app.my_spring_app.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

/**
 * Dịch vụ phục vụ dashboard admin: thống kê tổng quan và usage của từng user.
 */
@Service
@Transactional
public class AdminServiceImpl implements AdminService {

    // Role chuẩn dùng để lọc user thuộc nhóm khách hàng (không phải admin/devops)
    private static final String ROLE_USER = "USER";
    // Hằng số quy đổi bytes -> GB (1024^3) để sử dụng ở nhiều nơi
    private static final double BYTES_PER_GB = 1024d * 1024 * 1024;

    // Repository thao tác bảng user
    @Autowired
    private UserRepository userRepository;

    // Repository thao tác bảng project
    @Autowired
    private ProjectRepository projectRepository;

    // Repository thao tác bảng project database
    @Autowired
    private ProjectDatabaseRepository projectDatabaseRepository;

    // Repository lấy thông tin server (MASTER) để chạy kubectl
    @Autowired
    private ServerRepository serverRepository;

    /**
     * Tổng hợp số lượng user, project và tài nguyên CPU/Memory đang sử dụng trên toàn hệ thống.
     */
    @Override
    public AdminOverviewResponse getOverview() {
        // 1. Đếm tổng user có role USER
        long totalUsers = userRepository.countByRole(ROLE_USER);

        // 2. Lấy toàn bộ project để đếm và gom namespace
        List<ProjectEntity> projects = projectRepository.findAll();
        long totalProjects = projects.size();

        // 3. Gom các namespace đang được sử dụng
        Set<String> namespaces = collectNamespaces(projects);

        // 4. Chạy kubectl top pods để lấy tổng CPU/Memory
        ResourceUsageMap usageMap = calculateUsagePerNamespace(namespaces);

        // 5. Mapping dữ liệu trả về
        AdminOverviewResponse response = new AdminOverviewResponse();
        response.setTotalUsers(totalUsers);
        response.setTotalProjects(totalProjects);
        response.setTotalCpuCores(roundToThreeDecimals(usageMap.totalUsage().getCpuCores()));
        response.setTotalMemoryGb(roundToThreeDecimals(bytesToGb(usageMap.totalUsage().getMemoryBytes())));
        return response;
    }

    /**
     * Lấy tổng quan usage (CPU/Memory) của các project thuộc một user cụ thể.
     */
    @Override
    public AdminUserProjectSummaryResponse getUserProjectSummary(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user với id " + userId));
        if (!ROLE_USER.equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("User không hợp lệ hoặc không có role USER");
        }

        List<ProjectEntity> projects = projectRepository.findAll();
        List<ProjectEntity> userProjects = projects.stream()
                .filter(project -> project.getUser() != null && userId.equals(project.getUser().getId()))
                .toList();

        Set<String> namespaces = collectNamespaces(userProjects);
        ResourceUsageMap usageMap = calculateUsagePerNamespace(namespaces);

        // 4. Build response
        AdminUserProjectSummaryResponse response = new AdminUserProjectSummaryResponse();
        response.setUserId(user.getId());
        response.setFullname(user.getFullname());
        response.setUsername(user.getUsername());
        response.setProjectCount(userProjects.size());
        response.setCpuCores(roundToThreeDecimals(usageMap.totalUsage().getCpuCores()));
        response.setMemoryGb(roundToThreeDecimals(bytesToGb(usageMap.totalUsage().getMemoryBytes())));
        return response;
    }

    /**
     * Lấy danh sách project chi tiết cho một user (số resource theo từng project).
     */
    @Override
    public AdminUserProjectListResponse getUserProjectsDetail(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user với id " + userId));
        if (!ROLE_USER.equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("User không hợp lệ hoặc không có role USER");
        }

        List<ProjectEntity> projects = projectRepository.findAll().stream()
                .filter(project -> project.getUser() != null && userId.equals(project.getUser().getId()))
                .toList();

        Set<String> namespaces = collectNamespaces(projects);
        ResourceUsageMap usageMap = calculateUsagePerNamespace(namespaces);

        List<AdminUserProjectListResponse.ProjectUsageItem> items = new ArrayList<>();
        for (ProjectEntity project : projects) {
            // Tạo item thống kê cho từng project
            AdminUserProjectListResponse.ProjectUsageItem item = new AdminUserProjectListResponse.ProjectUsageItem();
            item.setProjectId(project.getId());
            item.setProjectName(project.getProjectName());
            item.setDatabaseCount(project.getDatabases() != null ? project.getDatabases().size() : 0);
            item.setBackendCount(project.getBackends() != null ? project.getBackends().size() : 0);
            item.setFrontendCount(project.getFrontends() != null ? project.getFrontends().size() : 0);

            ResourceUsage usage = null;
            if (project.getNamespace() != null && !project.getNamespace().trim().isEmpty()) {
                usage = usageMap.namespaceUsage().get(project.getNamespace().trim());
            }
            double cpu = usage != null ? usage.getCpuCores() : 0.0;
            double memoryGb = usage != null ? bytesToGb(usage.getMemoryBytes()) : 0.0;

            item.setCpuCores(roundToThreeDecimals(cpu));
            item.setMemoryGb(roundToThreeDecimals(memoryGb));
            items.add(item);
        }

        // 4. Trả về dữ liệu
        AdminUserProjectListResponse response = new AdminUserProjectListResponse();
        response.setUserId(user.getId());
        response.setFullname(user.getFullname());
        response.setUsername(user.getUsername());
        response.setProjects(items);
        return response;
    }

    /**
     * Lấy chi tiết tài nguyên (CPU/Memory) của một project, bao gồm từng Database/Backend/Frontend.
     */
    @Override
    public AdminProjectResourceDetailResponse getProjectResourceDetail(Long projectId) {
        System.out.println("[AdminService] Bắt đầu lấy metrics cho projectId=" + projectId);
        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy project với id " + projectId));
        String namespace = project.getNamespace();
        if (namespace == null || namespace.trim().isEmpty()) {
            throw new RuntimeException("Project chưa được cấu hình namespace, không thể lấy metrics");
        }
        namespace = namespace.trim();

        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        AdminProjectResourceDetailResponse response = new AdminProjectResourceDetailResponse();
        response.setProjectId(project.getId());               // Lưu lại id để FE biết project nào
        response.setProjectName(project.getProjectName());    // Lưu lại tên hiển thị

        // Các list lưu usage chi tiết theo từng nhóm thành phần
        List<AdminProjectResourceDetailResponse.ComponentUsage> databaseUsages = new ArrayList<>();
        List<AdminProjectResourceDetailResponse.ComponentUsage> backendUsages = new ArrayList<>();
        List<AdminProjectResourceDetailResponse.ComponentUsage> frontendUsages = new ArrayList<>();

        double totalCpu = 0.0;       // Tổng CPU cộng dồn
        double totalMemoryGb = 0.0;  // Tổng Memory cộng dồn

        Session session = null;      // Session SSH tới MASTER để chạy kubectl
        try {
            session = createSession(masterServer);
            System.out.println("[AdminService] Đã kết nối MASTER server để lấy metrics project=" + project.getProjectName());

            if (project.getDatabases() != null) {
                for (ProjectDatabaseEntity database : project.getDatabases()) {
                    if (database.getUuid_k8s() == null || database.getUuid_k8s().trim().isEmpty()) {
                        continue;
                    }
                    String appLabel = "db-" + database.getUuid_k8s().trim(); // Tên app label khi deploy database
                    System.out.println("[AdminService] Đang lấy metrics database app=" + appLabel);
                    ResourceUsage usage = fetchUsageForApp(session, namespace, appLabel);
                    double cpu = usage.getCpuCores();
                    double memoryGb = bytesToGb(usage.getMemoryBytes());

                    databaseUsages.add(new AdminProjectResourceDetailResponse.ComponentUsage(
                            database.getId(),
                            database.getProjectName(),
                            database.getStatus(),
                            roundToThreeDecimals(cpu),
                            roundToThreeDecimals(memoryGb)
                    ));

                    totalCpu += cpu;
                    totalMemoryGb += memoryGb;
                }
            }

            if (project.getBackends() != null) {
                for (ProjectBackendEntity backend : project.getBackends()) {
                    if (backend.getUuid_k8s() == null || backend.getUuid_k8s().trim().isEmpty()) {
                        continue;
                    }
                    String appLabel = "app-" + backend.getUuid_k8s().trim(); // Các backend dùng prefix app-
                    System.out.println("[AdminService] Đang lấy metrics backend app=" + appLabel);
                    ResourceUsage usage = fetchUsageForApp(session, namespace, appLabel);
                    double cpu = usage.getCpuCores();
                    double memoryGb = bytesToGb(usage.getMemoryBytes());

                    backendUsages.add(new AdminProjectResourceDetailResponse.ComponentUsage(
                            backend.getId(),
                            backend.getProjectName(),
                            backend.getStatus(),
                            roundToThreeDecimals(cpu),
                            roundToThreeDecimals(memoryGb)
                    ));

                    totalCpu += cpu;
                    totalMemoryGb += memoryGb;
                }
            }

            if (project.getFrontends() != null) {
                for (ProjectFrontendEntity frontend : project.getFrontends()) {
                    if (frontend.getUuid_k8s() == null || frontend.getUuid_k8s().trim().isEmpty()) {
                        continue;
                    }
                    String appLabel = "app-" + frontend.getUuid_k8s().trim(); // Frontend cũng dùng prefix app-
                    System.out.println("[AdminService] Đang lấy metrics frontend app=" + appLabel);
                    ResourceUsage usage = fetchUsageForApp(session, namespace, appLabel);
                    double cpu = usage.getCpuCores();
                    double memoryGb = bytesToGb(usage.getMemoryBytes());

                    frontendUsages.add(new AdminProjectResourceDetailResponse.ComponentUsage(
                            frontend.getId(),
                            frontend.getProjectName(),
                            frontend.getStatus(),
                            roundToThreeDecimals(cpu),
                            roundToThreeDecimals(memoryGb)
                    ));

                    totalCpu += cpu;
                    totalMemoryGb += memoryGb;
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy metrics cho project: " + e.getMessage(), e);
        } finally {
            if (session != null && session.isConnected()) {
                session.disconnect();
                System.out.println("[AdminService] Đã đóng kết nối MASTER server sau khi lấy metrics project=" + project.getProjectName());
            }
        }

        // 4. Tổng hợp dữ liệu trả về
        response.setDatabases(databaseUsages);
        response.setBackends(backendUsages);
        response.setFrontends(frontendUsages);
        response.setTotalCpuCores(roundToThreeDecimals(totalCpu));
        response.setTotalMemoryGb(roundToThreeDecimals(totalMemoryGb));
        System.out.println("[AdminService] Hoàn tất metrics project=" + project.getProjectName()
                + ", totalCpu=" + response.getTotalCpuCores()
                + ", totalMemoryGb=" + response.getTotalMemoryGb());
        return response;
    }

    /**
     * Lấy usage tổng quan cho từng user (số project, CPU, Memory).
     */
    @Override
    public AdminUserUsageResponse getUserResourceOverview() {
        // 1. Chuẩn bị map chứa thống kê cho từng user có role USER
        List<UserEntity> users = userRepository.findAll();
        Map<Long, AdminUserUsageResponse.UserUsageItem> userStats = new HashMap<>(); // Map userId -> usage tổng hợp
        for (UserEntity user : users) {
            if (!ROLE_USER.equalsIgnoreCase(user.getRole())) {
                continue;
            }
            AdminUserUsageResponse.UserUsageItem item = new AdminUserUsageResponse.UserUsageItem();
            item.setId(user.getId());
            item.setFullname(user.getFullname());
            item.setUsername(user.getUsername());
            item.setTier(user.getTier());
            item.setProjectCount(0);
            item.setCpuCores(0.0);
            item.setMemoryGb(0.0);
            userStats.put(user.getId(), item);
        }

        // 2. Với mỗi project, tăng số dự án và ghi lại namespace thuộc user nào
        List<ProjectEntity> projects = projectRepository.findAll();
        Set<String> namespaces = new HashSet<>();          // Tập namespace cần truy vấn metrics
        Map<String, Long> namespaceOwner = new HashMap<>(); // Map namespace -> userId sở hữu
        for (ProjectEntity project : projects) {
            UserEntity owner = project.getUser();
            if (owner == null) {
                continue;
            }
            AdminUserUsageResponse.UserUsageItem item = userStats.get(owner.getId());
            if (item == null) {
                continue;
            }
            item.setProjectCount(item.getProjectCount() + 1);

            if (project.getNamespace() != null && !project.getNamespace().trim().isEmpty()) {
                String namespace = project.getNamespace().trim();
                namespaces.add(namespace);
                namespaceOwner.put(namespace, owner.getId());
            }
        }

        // 3. Lấy metrics từng namespace rồi cộng ngược vào user tương ứng
        ResourceUsageMap usageMap = calculateUsagePerNamespace(namespaces);
        usageMap.namespaceUsage().forEach((namespace, usage) -> {
            Long ownerId = namespaceOwner.get(namespace);
            if (ownerId == null) {
                return;
            }
            AdminUserUsageResponse.UserUsageItem item = userStats.get(ownerId);
            if (item != null) {
                item.setCpuCores(item.getCpuCores() + usage.getCpuCores());
                item.setMemoryGb(item.getMemoryGb() + bytesToGb(usage.getMemoryBytes()));
            }
        });

        userStats.values().forEach(item -> {
            item.setCpuCores(roundToThreeDecimals(item.getCpuCores()));
            item.setMemoryGb(roundToThreeDecimals(item.getMemoryGb()));
        });

        AdminUserUsageResponse response = new AdminUserUsageResponse();
        response.setUsers(new ArrayList<>(userStats.values()));
        return response;
    }

    /**
     * Gom danh sách namespace từ list project để tránh gọi lặp lại.
     */
    private Set<String> collectNamespaces(List<ProjectEntity> projects) {
        // 1. Khởi tạo set để loại bỏ trùng
        Set<String> namespaces = new HashSet<>();
        // 2. Duyệt từng project và thêm namespace hợp lệ
        for (ProjectEntity project : projects) {
            if (project.getNamespace() != null && !project.getNamespace().trim().isEmpty()) {
                namespaces.add(project.getNamespace().trim());
            }
        }
        // 3. Trả về kết quả
        return namespaces;
    }

    /**
     * Chạy kubectl top pods cho danh sách namespace để thu thập CPU/Memory.
     * Kết quả trả về cả tổng usage và usage theo từng namespace.
     */
    private ResourceUsageMap calculateUsagePerNamespace(Set<String> namespaces) {
        ResourceUsage totalUsage = new ResourceUsage();
        Map<String, ResourceUsage> namespaceUsage = new HashMap<>();

        if (namespaces.isEmpty()) {
            return new ResourceUsageMap(totalUsage, namespaceUsage);
        }

        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        Session clusterSession = null;
        try {
            clusterSession = createSession(masterServer);
            // 1. Lặp qua từng namespace để gọi kubectl top
            for (String namespace : namespaces) {
                try {
                    String cmd = String.format("kubectl top pods -n %s --no-headers", namespace);
                    String output = executeCommand(clusterSession, cmd, true);
                    if (output == null || output.trim().isEmpty()) {
                        continue;
                    }
                    String[] lines = output.split("\\r?\\n");
                    // 2. Parse từng dòng output
                    for (String line : lines) {
                        line = line.trim();
                        if (line.isEmpty()) {
                            continue;
                        }
                        String[] parts = line.split("\\s+");
                        if (parts.length < 3) {
                            continue;
                        }
                        try {
                            double cpu = parseCpuCores(parts[1]);
                            long memory = parseMemoryBytes(parts[2]);

                            totalUsage.addCpu(cpu).addMemory(memory);
                            namespaceUsage
                                    .computeIfAbsent(namespace, key -> new ResourceUsage())
                                    .addCpu(cpu)
                                    .addMemory(memory);
                        } catch (NumberFormatException ex) {
                            System.err.println("[AdminService] Không thể parse metrics từ dòng: " + line);
                        }
                    }
                } catch (Exception e) {
                    System.err.println("[AdminService] Lỗi khi lấy metrics cho namespace " + namespace + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("[AdminService] Lỗi kết nối MASTER server để lấy metrics: " + e.getMessage());
        } finally {
            if (clusterSession != null && clusterSession.isConnected()) {
                clusterSession.disconnect();
            }
        }

        return new ResourceUsageMap(totalUsage, namespaceUsage);
    }

    /**
     * Lấy metrics CPU/Memory cho một nhóm pod theo label "app".
     * Hàm này giúp tái sử dụng logic kubectl top pods -l app=<label>.
     */
    private ResourceUsage fetchUsageForApp(Session session, String namespace, String appLabel) {
        ResourceUsage usage = new ResourceUsage();
        if (session == null || namespace == null || namespace.isBlank() || appLabel == null || appLabel.isBlank()) {
            return usage;
        }
        try {
            String cmd = String.format("kubectl top pods -n %s -l app=%s --no-headers", namespace, appLabel);
            String output = executeCommand(session, cmd, true);
            if (output == null || output.trim().isEmpty()) {
                return usage;
            }
            String[] lines = output.split("\\r?\\n");
            // 1. Lặp qua từng pod thỏa label
            for (String line : lines) {
                line = line.trim();
                if (line.isEmpty()) {
                    continue;
                }
                String[] parts = line.split("\\s+");
                if (parts.length < 3) {
                    continue;
                }
                double cpu = parseCpuCores(parts[1]);
                long memory = parseMemoryBytes(parts[2]);
                usage.addCpu(cpu).addMemory(memory);
            }
        } catch (Exception e) {
            System.err.println("[AdminService] Không thể lấy metrics cho app=" + appLabel + ": " + e.getMessage());
        }
        return usage;
    }

    /**
     * Mở SSH session tới server MASTER để chạy lệnh kubectl.
     */
    private Session createSession(ServerEntity server) throws Exception {
        // 1. Tạo session với thông tin đăng nhập server
        JSch jsch = new JSch();
        Session session = jsch.getSession(server.getUsername(), server.getIp(), server.getPort());
        session.setPassword(server.getPassword());
        Properties config = new Properties();
        config.put("StrictHostKeyChecking", "no");
        session.setConfig(config);
        session.setTimeout(7000);
        session.connect(); // 2. Kết nối thực tế
        return session;
    }

    private String executeCommand(Session session, String command, boolean ignoreNonZeroExit) throws Exception {
        ChannelExec channelExec = null;

        try {
            channelExec = (ChannelExec) session.openChannel("exec");
            channelExec.setCommand(command);
            channelExec.setErrStream(System.err);

            InputStream inputStream = channelExec.getInputStream();
            channelExec.connect();

            StringBuilder output = new StringBuilder();
            byte[] buffer = new byte[1024];

            while (true) {
                // 1. Đọc liên tục đến khi lệnh kết thúc
                while (inputStream.available() > 0) {
                    int bytesRead = inputStream.read(buffer, 0, 1024);
                    if (bytesRead < 0) {
                        break;
                    }
                    output.append(new String(buffer, 0, bytesRead, StandardCharsets.UTF_8));
                }

                if (channelExec.isClosed()) {
                    if (inputStream.available() > 0) {
                        continue;
                    }
                    break;
                }

                Thread.sleep(100);
            }

            int exitStatus = channelExec.getExitStatus();
            String result = output.toString().trim();

            if (exitStatus != 0) {
                if (ignoreNonZeroExit) {
                    System.err.println("[AdminService] Command exited with status: " + exitStatus
                            + ". Output: " + result + ". Command: " + command);
                } else {
                    throw new RuntimeException("Command exited with status: " + exitStatus + ". Output: " + result);
                }
            }

            return result;

        } finally {
            if (channelExec != null && channelExec.isConnected()) {
                channelExec.disconnect();
            }
        }
    }

    /**
     * Parse chuỗi CPU từ kubectl (ví dụ: 15m, 0.2) về đơn vị cores (double).
     */
    private double parseCpuCores(String cpuStr) {
        if (cpuStr == null || cpuStr.isEmpty()) return 0.0;
        cpuStr = cpuStr.trim().toLowerCase();
        if (cpuStr.endsWith("m")) {
            String value = cpuStr.substring(0, cpuStr.length() - 1);
            return Double.parseDouble(value) / 1000.0;
        }
        return Double.parseDouble(cpuStr);
    }

    /**
     * Parse chuỗi Memory (Mi, Gi, Ki, ...) từ kubectl và trả về bytes.
     */
    private long parseMemoryBytes(String memStr) {
        if (memStr == null || memStr.isEmpty()) return 0L;
        memStr = memStr.trim().toUpperCase();

        long factor = 1L;
        String numericPart = memStr;

        if (memStr.endsWith("KI")) {
            factor = 1024L;
            numericPart = memStr.substring(0, memStr.length() - 2);
        } else if (memStr.endsWith("MI")) {
            factor = 1024L * 1024L;
            numericPart = memStr.substring(0, memStr.length() - 2);
        } else if (memStr.endsWith("GI")) {
            factor = 1024L * 1024L * 1024L;
            numericPart = memStr.substring(0, memStr.length() - 2);
        } else if (memStr.endsWith("TI")) {
            factor = 1024L * 1024L * 1024L * 1024L;
            numericPart = memStr.substring(0, memStr.length() - 2);
        } else if (memStr.endsWith("K")) {
            factor = 1000L;
            numericPart = memStr.substring(0, memStr.length() - 1);
        } else if (memStr.endsWith("M")) {
            factor = 1000L * 1000L;
            numericPart = memStr.substring(0, memStr.length() - 1);
        } else if (memStr.endsWith("G")) {
            factor = 1000L * 1000L * 1000L;
            numericPart = memStr.substring(0, memStr.length() - 1);
        }

        // 2. Chuyển về bytes theo đơn vị tương ứng
        double value = Double.parseDouble(numericPart);
        return (long) (value * factor);
    }

    private double bytesToGb(long bytes) {
        // 1 GB = 1024^3 bytes
        return bytes / BYTES_PER_GB;
    }

    private double roundToThreeDecimals(double value) {
        // Giữ tối đa 3 chữ số thập phân để hiển thị gọn hơn
        return Math.round(value * 1000d) / 1000d;
    }

    /**
     * DTO nội bộ lưu trữ CPU/Memory dạng số để dễ cộng dồn.
     */
    private static class ResourceUsage {
        private double cpuCores = 0.0; // Tổng CPU (cores)
        private long memoryBytes = 0L; // Tổng Memory (bytes)

        public ResourceUsage addCpu(double cores) {
            this.cpuCores += cores;
            return this;
        }

        public ResourceUsage addMemory(long bytes) {
            this.memoryBytes += bytes;
            return this;
        }

        public double getCpuCores() {
            return cpuCores;
        }

        public long getMemoryBytes() {
            return memoryBytes;
        }
    }

    // record gom tổng usage và usage theo từng namespace để tái sử dụng ở nhiều hàm
    private record ResourceUsageMap(ResourceUsage totalUsage, Map<String, ResourceUsage> namespaceUsage) {
    }

    /**
     * Lấy tổng CPU và RAM capacity của cluster từ kubectl get nodes.
     * Sử dụng lệnh: kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU:.status.capacity.cpu,RAM:.status.capacity.memory
     */
    @Override
    public ClusterCapacityResponse getClusterCapacity() {
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        Session session = null;
        try {
            session = createSession(masterServer);
            String command = "kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU:.status.capacity.cpu,RAM:.status.capacity.memory";
            String output = executeCommand(session, command, false);

            double totalCpu = 0.0;
            long totalMemoryBytes = 0L;

            if (output != null && !output.trim().isEmpty()) {
                String[] lines = output.split("\\r?\\n");
                // Bỏ qua dòng header (dòng đầu tiên)
                for (int i = 1; i < lines.length; i++) {
                    String line = lines[i].trim();
                    if (line.isEmpty()) {
                        continue;
                    }
                    // Parse dòng: node-name   4   8Gi
                    String[] parts = line.split("\\s+");
                    if (parts.length >= 3) {
                        try {
                            // CPU có thể là số nguyên (cores) hoặc millicores (3950m)
                            double cpu = parseCpuCores(parts[1]);
                            totalCpu += cpu;
                            // RAM có thể là 8Gi, 16Gi, etc.
                            long memoryBytes = parseMemoryBytes(parts[2]);
                            totalMemoryBytes += memoryBytes;
                        } catch (NumberFormatException e) {
                            System.err.println("[AdminService] Không thể parse capacity từ dòng: " + line);
                        }
                    }
                }
            }

            ClusterCapacityResponse response = new ClusterCapacityResponse();
            response.setTotalCpuCores(roundToThreeDecimals(totalCpu));
            response.setTotalMemoryGb(roundToThreeDecimals(bytesToGb(totalMemoryBytes)));
            return response;

        } catch (Exception e) {
            System.err.println("[AdminService] Lỗi khi lấy cluster capacity: " + e.getMessage());
            throw new RuntimeException("Không thể lấy cluster capacity: " + e.getMessage(), e);
        } finally {
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * Lấy tổng CPU và RAM allocatable (khả dụng) của cluster từ kubectl get nodes.
     * Sử dụng lệnh: kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU_ALLOC:.status.allocatable.cpu,RAM_ALLOC:.status.allocatable.memory
     */
    @Override
    public ClusterAllocatableResponse getClusterAllocatable() {
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        Session session = null;
        try {
            session = createSession(masterServer);
            String command = "kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU_ALLOC:.status.allocatable.cpu,RAM_ALLOC:.status.allocatable.memory";
            String output = executeCommand(session, command, false);

            double totalCpu = 0.0;
            long totalMemoryBytes = 0L;

            if (output != null && !output.trim().isEmpty()) {
                String[] lines = output.split("\\r?\\n");
                // Bỏ qua dòng header (dòng đầu tiên)
                for (int i = 1; i < lines.length; i++) {
                    String line = lines[i].trim();
                    if (line.isEmpty()) {
                        continue;
                    }
                    // Parse dòng: node-name   3950m   16Gi
                    String[] parts = line.split("\\s+");
                    if (parts.length >= 3) {
                        try {
                            // CPU có thể là 4 hoặc 3950m (millicores)
                            double cpu = parseCpuCores(parts[1]);
                            totalCpu += cpu;
                            // RAM có thể là 8Gi, 16Gi, etc.
                            long memoryBytes = parseMemoryBytes(parts[2]);
                            totalMemoryBytes += memoryBytes;
                        } catch (NumberFormatException e) {
                            System.err.println("[AdminService] Không thể parse allocatable từ dòng: " + line);
                        }
                    }
                }
            }

            ClusterAllocatableResponse response = new ClusterAllocatableResponse();
            response.setTotalCpuCores(roundToThreeDecimals(totalCpu));
            response.setTotalMemoryGb(roundToThreeDecimals(bytesToGb(totalMemoryBytes)));
            return response;

        } catch (Exception e) {
            System.err.println("[AdminService] Lỗi khi lấy cluster allocatable: " + e.getMessage());
            throw new RuntimeException("Không thể lấy cluster allocatable: " + e.getMessage(), e);
        } finally {
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * Lấy chi tiết database bao gồm thông tin Pod, Service, StatefulSet, PVC, PV
     */
    @Override
    public AdminDatabaseDetailResponse getDatabaseDetail(Long databaseId) {
        System.out.println("[AdminService] Bắt đầu lấy chi tiết database với id=" + databaseId);
        
        // Lấy database entity
        ProjectDatabaseEntity database = projectDatabaseRepository.findById(databaseId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy database với id " + databaseId));
        
        ProjectEntity project = database.getProject();
        if (project == null) {
            throw new RuntimeException("Database không thuộc về project nào");
        }
        
        String namespace = project.getNamespace();
        if (namespace == null || namespace.trim().isEmpty()) {
            throw new RuntimeException("Project không có namespace");
        }
        namespace = namespace.trim();
        
        String uuid_k8s = database.getUuid_k8s();
        if (uuid_k8s == null || uuid_k8s.trim().isEmpty()) {
            throw new RuntimeException("Database không có uuid_k8s");
        }
        uuid_k8s = uuid_k8s.trim();
        
        String resourceName = "db-" + uuid_k8s;
        String serviceName = resourceName + "-svc";
        String statefulSetName = resourceName;
        String podName = resourceName + "-0"; // StatefulSet pod name pattern
        
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));
        
        Session session = null;
        AdminDatabaseDetailResponse response = new AdminDatabaseDetailResponse();
        
        try {
            session = createSession(masterServer);
            
            // Set thông tin database từ entity
            response.setDatabaseId(database.getId());
            response.setDatabaseType(database.getDatabaseType());
            response.setDatabaseIp(database.getDatabaseIp());
            response.setDatabasePort(database.getDatabasePort());
            response.setDatabaseName(database.getDatabaseName());
            response.setDatabaseUsername(database.getDatabaseUsername());
            response.setDatabasePassword(database.getDatabasePassword());
            
            // Lấy thông tin Pod (thử lấy theo pod name trước, nếu không có thì lấy theo label)
            try {
                // Thử lấy pod theo tên chính xác (StatefulSet pod name pattern)
                String podNameCmd = String.format("kubectl get pod %s -n %s -o jsonpath='{.metadata.name}'", podName, namespace);
                String podNameResult = executeCommand(session, podNameCmd, true);
                if (podNameResult != null && !podNameResult.trim().isEmpty()) {
                    response.setPodName(podNameResult.trim());
                    
                    String podNodeCmd = String.format("kubectl get pod %s -n %s -o jsonpath='{.spec.nodeName}'", podName, namespace);
                    String podNodeResult = executeCommand(session, podNodeCmd, true);
                    if (podNodeResult != null && !podNodeResult.trim().isEmpty()) {
                        response.setPodNode(podNodeResult.trim());
                    }
                    
                    String podStatusCmd = String.format("kubectl get pod %s -n %s -o jsonpath='{.status.phase}'", podName, namespace);
                    String podStatusResult = executeCommand(session, podStatusCmd, true);
                    if (podStatusResult != null && !podStatusResult.trim().isEmpty()) {
                        response.setPodStatus(podStatusResult.trim());
                    }
                } else {
                    // Fallback: lấy pod theo label selector
                    String podJsonPath = "{.items[0].metadata.name},{.items[0].spec.nodeName},{.items[0].status.phase}";
                    String podCmd = String.format("kubectl get pod -l app=%s -n %s -o jsonpath='%s'", resourceName, namespace, podJsonPath);
                    String podOutput = executeCommand(session, podCmd, true);
                    if (podOutput != null && !podOutput.trim().isEmpty()) {
                        String[] podParts = podOutput.split(",");
                        if (podParts.length >= 3) {
                            response.setPodName(podParts[0].trim());
                            response.setPodNode(podParts[1].trim());
                            response.setPodStatus(podParts[2].trim());
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("[AdminService] Lỗi khi lấy thông tin Pod: " + e.getMessage());
            }
            
            // Lấy thông tin Service
            try {
                String svcJsonPath = "{.metadata.name},{.status.loadBalancer.ingress[0].ip},{.spec.ports[0].port}";
                String svcCmd = String.format("kubectl get svc %s -n %s -o jsonpath='%s'", serviceName, namespace, svcJsonPath);
                String svcOutput = executeCommand(session, svcCmd, true);
                if (svcOutput != null && !svcOutput.trim().isEmpty()) {
                    String[] svcParts = svcOutput.split(",");
                    if (svcParts.length >= 1) {
                        response.setServiceName(svcParts[0].trim());
                        if (svcParts.length >= 2 && !svcParts[1].trim().isEmpty()) {
                            response.setServiceExternalIp(svcParts[1].trim());
                        }
                        if (svcParts.length >= 3 && !svcParts[2].trim().isEmpty()) {
                            try {
                                response.setServicePort(Integer.parseInt(svcParts[2].trim()));
                            } catch (NumberFormatException e) {
                                // Ignore
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("[AdminService] Lỗi khi lấy thông tin Service: " + e.getMessage());
            }
            
            // Lấy thông tin StatefulSet
            try {
                String stsCmd = String.format("kubectl get statefulset %s -n %s -o jsonpath='{.metadata.name}'", statefulSetName, namespace);
                String stsOutput = executeCommand(session, stsCmd, true);
                if (stsOutput != null && !stsOutput.trim().isEmpty()) {
                    response.setStatefulSetName(stsOutput.trim());
                }
            } catch (Exception e) {
                System.err.println("[AdminService] Lỗi khi lấy thông tin StatefulSet: " + e.getMessage());
            }
            
            // Lấy thông tin PVC (tìm PVC liên quan đến StatefulSet)
            try {
                String pvcNamePattern = database.getDatabaseType().equalsIgnoreCase("MYSQL") 
                    ? "mysql-data-" + statefulSetName + "-0" 
                    : "mongodb-data-" + statefulSetName + "-0";
                String pvcJsonPath = "{.metadata.name},{.status.phase},{.spec.volumeName},{.status.capacity.storage}";
                String pvcCmd = String.format("kubectl get pvc %s -n %s -o jsonpath='%s'", pvcNamePattern, namespace, pvcJsonPath);
                String pvcOutput = executeCommand(session, pvcCmd, true);
                if (pvcOutput != null && !pvcOutput.trim().isEmpty()) {
                    String[] pvcParts = pvcOutput.split(",");
                    if (pvcParts.length >= 1) {
                        response.setPvcName(pvcParts[0].trim());
                        if (pvcParts.length >= 2) {
                            response.setPvcStatus(pvcParts[1].trim());
                        }
                        if (pvcParts.length >= 3) {
                            response.setPvcVolume(pvcParts[2].trim());
                        }
                        if (pvcParts.length >= 4) {
                            response.setPvcCapacity(pvcParts[3].trim());
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("[AdminService] Lỗi khi lấy thông tin PVC: " + e.getMessage());
            }
            
            // Lấy thông tin PV (nếu có PVC volume name)
            if (response.getPvcVolume() != null && !response.getPvcVolume().isEmpty()) {
                try {
                    // Lấy name và capacity
                    String pvNameCmd = String.format("kubectl get pv %s -o jsonpath='{.metadata.name}'", response.getPvcVolume());
                    String pvName = executeCommand(session, pvNameCmd, true);
                    if (pvName != null && !pvName.trim().isEmpty()) {
                        response.setPvName(pvName.trim());
                    }
                    
                    String pvCapacityCmd = String.format("kubectl get pv %s -o jsonpath='{.spec.capacity.storage}'", response.getPvcVolume());
                    String pvCapacity = executeCommand(session, pvCapacityCmd, true);
                    if (pvCapacity != null && !pvCapacity.trim().isEmpty()) {
                        response.setPvCapacity(pvCapacity.trim());
                    }
                    
                    // Thử lấy node từ nodeAffinity (có thể không có)
                    try {
                        String pvNodeCmd = String.format("kubectl get pv %s -o jsonpath='{.spec.nodeAffinity.required.nodeSelectorTerms[0].matchExpressions[0].values[0]}'", response.getPvcVolume());
                        String pvNode = executeCommand(session, pvNodeCmd, true);
                        if (pvNode != null && !pvNode.trim().isEmpty() && !pvNode.trim().equals("<none>")) {
                            response.setPvNode(pvNode.trim());
                        }
                    } catch (Exception e) {
                        // Node info có thể không có, bỏ qua
                        System.out.println("[AdminService] Không thể lấy node từ PV (có thể không có nodeAffinity)");
                    }
                } catch (Exception e) {
                    System.err.println("[AdminService] Lỗi khi lấy thông tin PV: " + e.getMessage());
                }
            }
            
            return response;
            
        } catch (Exception e) {
            System.err.println("[AdminService] Lỗi khi lấy chi tiết database: " + e.getMessage());
            throw new RuntimeException("Không thể lấy chi tiết database: " + e.getMessage(), e);
        } finally {
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }
}

