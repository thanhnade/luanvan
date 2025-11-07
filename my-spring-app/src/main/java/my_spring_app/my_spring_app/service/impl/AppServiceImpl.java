package my_spring_app.my_spring_app.service.impl;

import com.jcraft.jsch.*;
import my_spring_app.my_spring_app.dto.reponse.DeployAppDockerResponse;
import my_spring_app.my_spring_app.dto.reponse.DeployAppFileResponse;
import my_spring_app.my_spring_app.dto.reponse.ListAppsResponse;
import my_spring_app.my_spring_app.dto.request.DeployAppDockerRequest;
import my_spring_app.my_spring_app.dto.request.DeployAppFileRequest;
import my_spring_app.my_spring_app.dto.request.GetAppsByUserRequest;
import my_spring_app.my_spring_app.entity.AppEntity;
import my_spring_app.my_spring_app.entity.FileEntity;
import my_spring_app.my_spring_app.entity.UserEntity;
import my_spring_app.my_spring_app.repository.AppRepository;
import my_spring_app.my_spring_app.repository.FileRepository;
import my_spring_app.my_spring_app.repository.UserRepository;
import my_spring_app.my_spring_app.service.AppService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.Properties;

@Service
@Transactional
public class AppServiceImpl implements AppService {

    @Value("${app.vars.cluster_ip}")
    private String cluster_ip;

    @Value("${app.vars.cluster_port}")
    private int cluster_port;

    @Value("${app.vars.cluster_username}")
    private String cluster_username;

    @Value("${app.vars.cluster_password}")
    private String cluster_password;

    @Value("${app.vars.docker_image_ip}")
    private String docker_image_ip;

    @Value("${app.vars.docker_image_port}")
    private int docker_image_port;

    @Value("${app.vars.docker_image_username}")
    private String docker_image_username;

    @Value("${app.vars.docker_image_password}")
    private String docker_image_password;

    @Value("${app.vars.dockerhub_username}")
    private String dockerhub_username;

    @Autowired
    private AppRepository appRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileRepository fileRepository;

    /**
     * Helper method để tạo nội dung YAML Kubernetes (Deployment + Service + Ingress) 
     * gộp thành 1 file dựa trên frameworkType
     * @param appName Tên app đã được chuẩn hóa (lowercase, không có ký tự đặc biệt)
     * @param dockerImage Docker image tag
     * @param frameworkType Loại framework (react, vue, angular, spring, node)
     * @return Nội dung YAML đầy đủ cho Deployment, Service và Ingress
     */
    private String generateKubernetesYaml(String appName, String dockerImage, String frameworkType) {
        switch (frameworkType.toLowerCase()) {
            case "react":
                return generateReactYaml(appName, dockerImage);
            case "vue":
                // TODO: Thêm nội dung YAML cho Vue
                return generateReactYaml(appName, dockerImage); // Tạm thời dùng mẫu React
            case "angular":
                // TODO: Thêm nội dung YAML cho Angular
                return generateReactYaml(appName, dockerImage); // Tạm thời dùng mẫu React
            case "spring":
                // TODO: Thêm nội dung YAML cho Spring Boot
                return generateReactYaml(appName, dockerImage); // Tạm thời dùng mẫu React
            case "node":
                // TODO: Thêm nội dung YAML cho Node.js
                return generateReactYaml(appName, dockerImage); // Tạm thời dùng mẫu React
            default:
                return generateReactYaml(appName, dockerImage);
        }
    }

    /**
     * Tạo YAML mẫu cho React (Deployment + Service + Ingress gộp thành 1 file)
     */
    private String generateReactYaml(String appName, String dockerImage) {
        return "apiVersion: apps/v1\n" +
                "kind: Deployment\n" +
                "metadata:\n" +
                "  name: " + appName + "\n" +
                "  namespace: web\n" +
                "spec:\n" +
                "  replicas: 2\n" +
                "  selector:\n" +
                "    matchLabels:\n" +
                "      app: " + appName + "\n" +
                "  template:\n" +
                "    metadata:\n" +
                "      labels:\n" +
                "        app: " + appName + "\n" +
                "    spec:\n" +
                "      containers:\n" +
                "        - name: " + appName + "\n" +
                "          image: " + dockerImage + "\n" +
                "          ports:\n" +
                "            - containerPort: 80\n" +
                "---\n" +
                "apiVersion: v1\n" +
                "kind: Service\n" +
                "metadata:\n" +
                "  name: " + appName + "-svc\n" +
                "  namespace: web\n" +
                "spec:\n" +
                "  type: ClusterIP\n" +
                "  selector:\n" +
                "    app: " + appName + "\n" +
                "  ports:\n" +
                "    - port: 80\n" +
                "      targetPort: 80\n" +
                "---\n" +
                "apiVersion: networking.k8s.io/v1\n" +
                "kind: Ingress\n" +
                "metadata:\n" +
                "  name: " + appName + "-ing\n" +
                "  namespace: web\n" +
                "  annotations:\n" +
                "    nginx.ingress.kubernetes.io/rewrite-target: /\n" +
                "spec:\n" +
                "  ingressClassName: nginx\n" +
                "  rules:\n" +
                "    - host: " + appName + "\n" +
                "      http:\n" +
                "        paths:\n" +
                "          - path: /\n" +
                "            pathType: Prefix\n" +
                "            backend:\n" +
                "              service:\n" +
                "                name: " + appName + "-svc\n" +
                "                port:\n" +
                "                  number: 80\n";
    }

    /**
     * Helper method để thực thi lệnh qua SSH và trả về output
     */
    private String executeCommand(Session session, String command) throws Exception {
        ChannelExec channelExec = null;
        
        try {
            Channel channel = session.openChannel("exec");
            channelExec = (ChannelExec) channel;
            
            channelExec.setCommand(command);
            channelExec.setErrStream(System.err);
            
            InputStream inputStream = channelExec.getInputStream();
            channelExec.connect();
            
            // Đọc output
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
                    // Bỏ qua
                }
            }
            
            int exitStatus = channelExec.getExitStatus();
            String result = output.toString().trim();
            
            if (exitStatus != 0) {
                throw new RuntimeException("Command exited with status: " + exitStatus + ". Output: " + result);
            }
            
            return result;
            
        } finally {
            if (channelExec != null && channelExec.isConnected()) {
                channelExec.disconnect();
            }
        }
    }

    public DeployAppDockerResponse deployAppDocker(DeployAppDockerRequest request) {
        // Tìm user theo username
        Optional<UserEntity> userOptional = userRepository.findByUsername(request.getUsername());
        if (userOptional.isEmpty()) {
            throw new RuntimeException("User không tồn tại");
        }

        UserEntity user = userOptional.get();

        // Tạo AppEntity mới
        AppEntity appEntity = new AppEntity();
        appEntity.setName(request.getName());
        appEntity.setFrameworkType(request.getFrameworkType());
        appEntity.setDeploymentType(request.getDeploymentType());
        appEntity.setStatus("building");
        appEntity.setUser(user);

        appEntity.setDockerImage(request.getDockerImage());

        String ssh_host = cluster_ip;
        int ssh_port = cluster_port;
        String ssh_username = user.getUsername();
        String ssh_password = user.getUsername();

        Session session = null;
        ChannelSftp sftpChannel = null;

        try {

            System.out.println("[deployAppDocker] Đang kết nối đến Ubuntu server: " + ssh_host + ":" + ssh_port);

            // Bước 1: Tạo kết nối SSH đến máy ảo Ubuntu
            JSch jsch = new JSch();
            session = jsch.getSession(ssh_username, ssh_host, ssh_port);
            session.setPassword(ssh_password);

            // Tắt kiểm tra strict host key
            Properties config = new Properties();
            config.put("StrictHostKeyChecking", "no");
            session.setConfig(config);

            // Thiết lập thời gian chờ kết nối
            session.setTimeout(5000);

            // Kết nối
            session.connect();
            System.out.println("[deployAppDocker] Kết nối SSH thành công!");

            // Bước 2: Chuẩn hóa tên app để dùng trong YAML
            String appName = appEntity.getName().toLowerCase()
                    .replaceAll("\\s+", "-")
                    .replaceAll("[^a-z0-9-]", "");
            
            // Bước 3: Tạo file YAML gộp (Deployment + Service + Ingress) sử dụng hàm helper
            String fileName = appName + ".yaml";
            System.out.println("[deployAppDocker] Đang tạo file: " + fileName);
            
            String fileContent = generateKubernetesYaml(
                    appName, 
                    appEntity.getDockerImage(), 
                    appEntity.getFrameworkType()
            );

            // Bước 4: Mở SFTP channel để upload file
            Channel channel = session.openChannel("sftp");
            channel.connect();
            sftpChannel = (ChannelSftp) channel;

            // Upload file YAML (gộp Deployment + Service + Ingress) lên server
            InputStream fileInputStream = new ByteArrayInputStream(fileContent.getBytes(StandardCharsets.UTF_8));
            String remotePath = "/home/" + ssh_username + "/" + fileName;
            sftpChannel.put(fileInputStream, remotePath);
            
            System.out.println("[deployAppDocker] Đã tạo file " + fileName + " thành công tại: " + remotePath);

            // Đóng SFTP channel
            sftpChannel.disconnect();
            sftpChannel = null;

            // Bước 5: Thực thi lệnh kubectl apply cho file YAML (gộp tất cả)
            String homeDirectory = "/home/" + ssh_username;
            
            System.out.println("[deployAppDocker] Đang thực thi: kubectl apply -f " + fileName);
            String kubectlResult = executeCommand(session, "cd " + homeDirectory + " && kubectl apply -f " + fileName);
            System.out.println("[deployAppDocker] Kết quả apply file YAML: " + kubectlResult);

            // Cập nhật status và URL
            appEntity.setStatus("running");
            String generatedUrl = "http://" + appName;
            appEntity.setUrl(generatedUrl);

            DeployAppDockerResponse response = new DeployAppDockerResponse();
            response.setUrl(generatedUrl);
            response.setStatus(appEntity.getStatus());

            // Lưu AppEntity vào database
            AppEntity savedAppEntity = appRepository.save(appEntity);

            System.out.println("[deployAppDocker] Triển khai Docker thành công! File: " + fileName);
            return response;

        } catch (Exception e) {
            appEntity.setStatus("error");
            System.err.println("[deployAppDocker] Lỗi khi triển khai Docker: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Lỗi khi triển khai Docker: " + e.getMessage(), e);
        } finally {
            // Đóng kết nối
            if (sftpChannel != null && sftpChannel.isConnected()) {
                sftpChannel.disconnect();
            }
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }

    }

    public DeployAppFileResponse deployAppFile(DeployAppFileRequest request) {
        System.out.println("[deployAppFile] Bắt đầu triển khai từ file nén .zip");
        if (request == null || request.getUsername() == null || request.getUsername().isBlank()) {
            throw new RuntimeException("Username không được để trống");
        }
        if (request.getFile() == null || request.getFile().isEmpty()) {
            throw new RuntimeException("File upload trống hoặc không hợp lệ");
        }

        System.out.println("[deployAppFile] Validate tham số thành công. username=" + request.getUsername());
        Optional<UserEntity> userOptional = userRepository.findByUsername(request.getUsername());
        if (userOptional.isEmpty()) {
            throw new RuntimeException("User không tồn tại");
        }
        UserEntity user = userOptional.get();
        System.out.println("[deployAppFile] Tìm thấy user id=" + user.getId());

        // Khởi tạo AppEntity ở trạng thái building
        AppEntity appEntity = new AppEntity();
        appEntity.setName(request.getName());
        appEntity.setFrameworkType(request.getFrameworkType());
        appEntity.setDeploymentType(request.getDeploymentType());
        appEntity.setStatus("building");
        appEntity.setUser(user);

        Session session = null;            // phiên SSH tới máy build/push image (docker_image_*)
        ChannelSftp sftp = null;           // SFTP trên máy build/push image
        Session clusterSession = null;     // phiên SSH tới máy cluster để upload/apply YAML (cluster_*)
        ChannelSftp sftpYaml = null;       // SFTP trên máy cluster để upload YAML
        try {
            System.out.println("[deployAppFile] Kết nối SSH tới server build/push image: " + docker_image_ip + ":" + docker_image_port);
            // 1) Kết nối SSH tới server docker_image_* (đã cấu hình)
            JSch jsch = new JSch();
            session = jsch.getSession(docker_image_username, docker_image_ip, docker_image_port);
            session.setPassword(docker_image_password);
            Properties cfg = new Properties();
            cfg.put("StrictHostKeyChecking", "no");
            session.setConfig(cfg);
            session.setTimeout(7000);
            session.connect();
            System.out.println("[deployAppFile] Đã kết nối SSH server build thành công");

            // 2) Upload file .zip vào /home/<user>/uploads/devops
            Channel ch = session.openChannel("sftp");
            ch.connect();
            sftp = (ChannelSftp) ch;

            String remoteBase = "/home/" + docker_image_username + "/uploads/devops";
            System.out.println("[deployAppFile] Tạo/cd thư mục đích: " + remoteBase);
            // Đảm bảo thư mục tồn tại
            String[] parts = remoteBase.split("/");
            String cur = "";
            for (String p : parts) {
                if (p == null || p.isBlank()) continue;
                cur += "/" + p;
                try { sftp.cd(cur); } catch (Exception e) { sftp.mkdir(cur); sftp.cd(cur); }
            }

            String originalName = request.getFile().getOriginalFilename();
            String safeName = originalName != null ? originalName.replaceAll("[^a-zA-Z0-9._-]", "_") : (request.getName() + ".zip");
            String remoteZipPath = remoteBase + "/" + safeName;
            System.out.println("[deployAppFile] Upload file lên: " + remoteZipPath);
            sftp.put(request.getFile().getInputStream(), remoteZipPath);

            // Lưu FileEntity sau khi upload thành công
            FileEntity fileEntity = new FileEntity();
            fileEntity.setName(safeName);
            fileEntity.setPath(remoteZipPath);
            fileEntity.setUser(user);
            fileRepository.save(fileEntity);
            System.out.println("[deployAppFile] Lưu FileEntity thành công, name=" + safeName);

            // 3) Giải nén file .zip
            String unzipCmd = "cd " + remoteBase + " && unzip -o '" + safeName + "'";
            System.out.println("[deployAppFile] Giải nén: " + unzipCmd);
            executeCommand(session, unzipCmd);

            // 4) Build & push Docker image nếu tồn tại Dockerfile
            String extractedDir = safeName.endsWith(".zip") ? safeName.substring(0, safeName.length() - 4) : safeName;
            String projectDir = remoteBase + "/" + extractedDir;
            // Kiểm tra Dockerfile
            String checkDockerfile = "test -f '" + projectDir + "/Dockerfile' && echo OK || echo NO";
            System.out.println("[deployAppFile] Kiểm tra Dockerfile: " + checkDockerfile);
            String check = executeCommand(session, checkDockerfile);
            if (!"OK".equals(check.trim())) {
                throw new RuntimeException("Không tìm thấy Dockerfile trong gói source đã giải nén");
            }

            // Tạo tag image và build + push
            String appName = request.getName().toLowerCase().replaceAll("\\s+", "-").replaceAll("[^a-z0-9-]", "");
            String imageTag = dockerhub_username + "/" + appName + ":latest";
            String buildCmd = "cd '" + projectDir + "' && docker build -t '" + imageTag + "' .";
            System.out.println("[deployAppFile] Docker build: " + buildCmd);
            executeCommand(session, buildCmd);
            String pushCmd = "docker push '" + imageTag + "'";
            System.out.println("[deployAppFile] Docker push: " + pushCmd);
            executeCommand(session, pushCmd);

            // 5) Tạo YAML (Deployment, Service, Ingress gộp thành 1 file), upload và apply trên server CLUSTER
            System.out.println("[deployAppFile] Chuyển sang server cluster để upload/apply YAML: " + cluster_ip + ":" + cluster_port);
            appEntity.setDockerImage(imageTag);

            // Tạo nội dung YAML gộp (Deployment + Service + Ingress) sử dụng hàm helper
            String fileName = appName + ".yaml";
            String yamlContent = generateKubernetesYaml(
                    appName, 
                    imageTag, 
                    request.getFrameworkType()
            );

            // Tạo phiên kết nối tới server cluster
            JSch jschCluster = new JSch();
            clusterSession = jschCluster.getSession(cluster_username, cluster_ip, cluster_port);
            clusterSession.setPassword(cluster_password);
            Properties cfgCluster = new Properties();
            cfgCluster.put("StrictHostKeyChecking", "no");
            clusterSession.setConfig(cfgCluster);
            clusterSession.setTimeout(7000);
            clusterSession.connect();
            System.out.println("[deployAppFile] Kết nối SSH tới cluster thành công");

            Channel sftpYamlCh = clusterSession.openChannel("sftp");
            sftpYamlCh.connect();
            sftpYaml = (ChannelSftp) sftpYamlCh;
            InputStream yamlStream = new ByteArrayInputStream(yamlContent.getBytes(StandardCharsets.UTF_8));
            String yamlRemotePath = "/home/" + cluster_username + "/" + fileName;
            sftpYaml.put(yamlStream, yamlRemotePath);
            System.out.println("[deployAppFile] Upload YAML (gộp Deployment + Service + Ingress): " + yamlRemotePath);

            // Apply file YAML (gộp tất cả)
            String homeDir = "/home/" + cluster_username;
            System.out.println("[deployAppFile] kubectl apply YAML");
            executeCommand(clusterSession, "cd " + homeDir + " && kubectl apply -f '" + fileName + "'");

            // Thành công
            appEntity.setStatus("running");
            String generatedUrl = "http://" + appName;
            appEntity.setUrl(generatedUrl);
            appRepository.save(appEntity);
            System.out.println("[deployAppFile] Hoàn tất triển khai từ file, appName=" + appName + ", url=" + generatedUrl);

            DeployAppFileResponse resp = new DeployAppFileResponse();
            resp.setUrl(generatedUrl);
            resp.setStatus(appEntity.getStatus());
            return resp;

        } catch (Exception ex) {
            System.err.println("[deployAppFile] Lỗi: " + ex.getMessage());
            appEntity.setStatus("error");
            appRepository.save(appEntity);
            throw new RuntimeException("Lỗi khi triển khai từ file: " + ex.getMessage(), ex);
        } finally {
            if (sftp != null && sftp.isConnected()) sftp.disconnect();
            if (session != null && session.isConnected()) session.disconnect();
            if (sftpYaml != null && sftpYaml.isConnected()) sftpYaml.disconnect();
            if (clusterSession != null && clusterSession.isConnected()) clusterSession.disconnect();
            System.out.println("[deployAppFile] Đã đóng các kết nối SSH/SFTP");
        }
    }

    @Override
    public ListAppsResponse getAppsByUser(GetAppsByUserRequest request) {
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new RuntimeException("Username không được để trống");
        }

        var apps = appRepository.findByUser_Username(request.getUsername());

        var items = apps.stream().map(app -> new ListAppsResponse.AppItem(
                app.getId(),
                app.getName(),
                app.getFrameworkType(),
                app.getDeploymentType(),
                app.getUrl(),
                app.getStatus(),
                app.getCreatedAt()
        )).toList();

        return new ListAppsResponse(items);
    }

}

