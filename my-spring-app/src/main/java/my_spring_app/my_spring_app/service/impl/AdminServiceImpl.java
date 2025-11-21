package my_spring_app.my_spring_app.service.impl;

import com.jcraft.jsch.Channel;
import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import my_spring_app.my_spring_app.dto.reponse.AdminOverviewResponse;
import my_spring_app.my_spring_app.entity.ProjectEntity;
import my_spring_app.my_spring_app.entity.ServerEntity;
import my_spring_app.my_spring_app.repository.ProjectRepository;
import my_spring_app.my_spring_app.repository.ServerRepository;
import my_spring_app.my_spring_app.repository.UserRepository;
import my_spring_app.my_spring_app.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Properties;
import java.util.Set;

/**
 * Dịch vụ dành cho admin dùng để tổng hợp các số liệu thống kê
 * (số user, số project, tổng CPU, tổng Memory) phục vụ hiển thị ở dashboard.
 * Hiện tại số liệu CPU/Memory được lấy thông qua lệnh kubectl.
 */
@Service
@Transactional
public class AdminServiceImpl implements AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ServerRepository serverRepository;

    @Override
    public AdminOverviewResponse getOverview() {
        // Đếm tổng số user với role USER
        long totalUsers = userRepository.countByRole("USER");

        // Lấy toàn bộ project để vừa đếm số lượng vừa trích xuất namespace
        List<ProjectEntity> projects = projectRepository.findAll();
        long totalProjects = projects.size();

        // Thu thập danh sách namespace (mỗi project tương ứng 1 namespace)
        Set<String> namespaces = new HashSet<>();
        for (ProjectEntity project : projects) {
            if (project.getNamespace() != null && !project.getNamespace().trim().isEmpty()) {
                namespaces.add(project.getNamespace().trim());
            }
        }

        double totalCpuCores = 0.0;
        long totalMemoryBytes = 0L;

        if (!namespaces.isEmpty()) {
            // Lấy server MASTER để chạy kubectl
            ServerEntity masterServer = serverRepository.findByRole("MASTER")
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

            Session clusterSession = null;
            try {
                JSch jsch = new JSch();
                clusterSession = jsch.getSession(
                        masterServer.getUsername(),
                        masterServer.getIp(),
                        masterServer.getPort());
                clusterSession.setPassword(masterServer.getPassword());
                Properties config = new Properties();
                config.put("StrictHostKeyChecking", "no");
                clusterSession.setConfig(config);
                clusterSession.setTimeout(7000);
                clusterSession.connect();
                System.out.println("[AdminService] Đã kết nối MASTER server để lấy metrics (kubectl top pods)");

                for (String namespace : namespaces) {
                    try {
                        // kubectl top pods trả về CPU/Memory cho từng pod trong namespace
                        String cmd = String.format("kubectl top pods -n %s --no-headers", namespace);
                        System.out.println("[AdminService] Thực thi: " + cmd);
                        String output = executeCommand(clusterSession, cmd, true);
                        if (output == null || output.trim().isEmpty()) {
                            continue;
                        }
                        String[] lines = output.split("\\r?\\n");
                        for (String line : lines) {
                            line = line.trim();
                            if (line.isEmpty()) continue;
                            String[] parts = line.split("\\s+");
                            if (parts.length < 3) continue;
                            String cpuStr = parts[1];      // CPU(cores)
                            String memStr = parts[2];      // MEMORY(bytes)
                            try {
                                totalCpuCores += parseCpuCores(cpuStr);
                                totalMemoryBytes += parseMemoryBytes(memStr);
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
        }

        AdminOverviewResponse response = new AdminOverviewResponse();
        response.setTotalUsers(totalUsers);
        response.setTotalProjects(totalProjects);
        response.setTotalCpuCores(totalCpuCores);
        response.setTotalMemoryBytes(totalMemoryBytes);

        return response;
    }

    /**
     * Thực thi lệnh qua SSH và trả về output
     */
    private String executeCommand(Session session, String command, boolean ignoreNonZeroExit) throws Exception {
        ChannelExec channelExec = null;

        try {
            Channel channel = session.openChannel("exec");
            channelExec = (ChannelExec) channel;
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

                try {
                    Thread.sleep(100);
                } catch (Exception e) {
                    // ignore
                }
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
     * Parse CPU string từ kubectl (ví dụ: \"10m\" hoặc \"0.1\") sang số cores
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
     * Parse Memory string từ kubectl (ví dụ: \"50Mi\", \"1024Ki\") sang bytes
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

        double value = Double.parseDouble(numericPart);
        return (long) (value * factor);
    }
}

