package my_spring_app.my_spring_app.service.impl;

import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import my_spring_app.my_spring_app.dto.reponse.AdminOverviewResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserProjectListResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserProjectSummaryResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserUsageResponse;
import my_spring_app.my_spring_app.entity.ProjectEntity;
import my_spring_app.my_spring_app.entity.ServerEntity;
import my_spring_app.my_spring_app.entity.UserEntity;
import my_spring_app.my_spring_app.repository.ProjectRepository;
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

    private static final String ROLE_USER = "USER";
    private static final double BYTES_PER_GB = 1024d * 1024 * 1024;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ServerRepository serverRepository;

    @Override
    public AdminOverviewResponse getOverview() {
        // 1. Tổng số user có role USER
        long totalUsers = userRepository.countByRole(ROLE_USER);

        // 2. Lấy toàn bộ project vừa để đếm vừa để thu thập namespace
        List<ProjectEntity> projects = projectRepository.findAll();
        long totalProjects = projects.size();

        // 3. Gom các namespace đang được sử dụng
        Set<String> namespaces = collectNamespaces(projects);

        // 4. Chạy kubectl top pods để lấy tổng CPU/Memory
        ResourceUsageMap usageMap = calculateUsagePerNamespace(namespaces);

        AdminOverviewResponse response = new AdminOverviewResponse();
        response.setTotalUsers(totalUsers);
        response.setTotalProjects(totalProjects);
        response.setTotalCpuCores(roundToThreeDecimals(usageMap.totalUsage().getCpuCores()));
        response.setTotalMemoryGb(roundToThreeDecimals(bytesToGb(usageMap.totalUsage().getMemoryBytes())));
        return response;
    }

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

        AdminUserProjectSummaryResponse response = new AdminUserProjectSummaryResponse();
        response.setUserId(user.getId());
        response.setFullname(user.getFullname());
        response.setUsername(user.getUsername());
        response.setProjectCount(userProjects.size());
        response.setCpuCores(roundToThreeDecimals(usageMap.totalUsage().getCpuCores()));
        response.setMemoryGb(roundToThreeDecimals(bytesToGb(usageMap.totalUsage().getMemoryBytes())));
        return response;
    }

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

        AdminUserProjectListResponse response = new AdminUserProjectListResponse();
        response.setUserId(user.getId());
        response.setFullname(user.getFullname());
        response.setUsername(user.getUsername());
        response.setProjects(items);
        return response;
    }

    @Override
    public AdminUserUsageResponse getUserResourceOverview() {
        // 1. Chuẩn bị map chứa thống kê cho từng user có role USER
        List<UserEntity> users = userRepository.findAll();
        Map<Long, AdminUserUsageResponse.UserUsageItem> userStats = new HashMap<>();
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
        Set<String> namespaces = new HashSet<>();
        Map<String, Long> namespaceOwner = new HashMap<>();
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

    private Set<String> collectNamespaces(List<ProjectEntity> projects) {
        Set<String> namespaces = new HashSet<>();
        for (ProjectEntity project : projects) {
            if (project.getNamespace() != null && !project.getNamespace().trim().isEmpty()) {
                namespaces.add(project.getNamespace().trim());
            }
        }
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
            for (String namespace : namespaces) {
                try {
                    String cmd = String.format("kubectl top pods -n %s --no-headers", namespace);
                    String output = executeCommand(clusterSession, cmd, true);
                    if (output == null || output.trim().isEmpty()) {
                        continue;
                    }
                    String[] lines = output.split("\\r?\\n");
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

    private Session createSession(ServerEntity server) throws Exception {
        JSch jsch = new JSch();
        Session session = jsch.getSession(server.getUsername(), server.getIp(), server.getPort());
        session.setPassword(server.getPassword());
        Properties config = new Properties();
        config.put("StrictHostKeyChecking", "no");
        session.setConfig(config);
        session.setTimeout(7000);
        session.connect();
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

    private double parseCpuCores(String cpuStr) {
        if (cpuStr == null || cpuStr.isEmpty()) return 0.0;
        cpuStr = cpuStr.trim().toLowerCase();
        if (cpuStr.endsWith("m")) {
            String value = cpuStr.substring(0, cpuStr.length() - 1);
            return Double.parseDouble(value) / 1000.0;
        }
        return Double.parseDouble(cpuStr);
    }

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

        double value = Double.parseDouble(numericPart);
        return (long) (value * factor);
    }

    private double bytesToGb(long bytes) {
        return bytes / BYTES_PER_GB;
    }

    private double roundToThreeDecimals(double value) {
        return Math.round(value * 1000d) / 1000d;
    }

    private static class ResourceUsage {
        private double cpuCores = 0.0;
        private long memoryBytes = 0L;

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

    private record ResourceUsageMap(ResourceUsage totalUsage, Map<String, ResourceUsage> namespaceUsage) {
    }
}

