package my_spring_app.my_spring_app.service.impl;

import com.jcraft.jsch.*;
import my_spring_app.my_spring_app.dto.reponse.DeployAppDockerResponse;
import my_spring_app.my_spring_app.dto.reponse.DeployAppFileResponse;
import my_spring_app.my_spring_app.dto.reponse.ListAppsResponse;
import my_spring_app.my_spring_app.dto.request.DeployAppDockerRequest;
import my_spring_app.my_spring_app.dto.request.DeployAppFileRequest;
import my_spring_app.my_spring_app.dto.request.GetAppsByUserRequest;
import my_spring_app.my_spring_app.entity.AppEntity;
import my_spring_app.my_spring_app.entity.UserEntity;
import my_spring_app.my_spring_app.repository.AppRepository;
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

    @Autowired
    private AppRepository appRepository;

    @Autowired
    private UserRepository userRepository;

//    @Override
//    public DeployAppResponse deployApp(DeployAppRequest request) {
//        // Tìm user theo username
//        Optional<UserEntity> userOptional = userRepository.findByUsername(request.getUsername());
//        if (userOptional.isEmpty()) {
//            throw new RuntimeException("User không tồn tại");
//        }
//
//        UserEntity user = userOptional.get();
//
//        // Tạo AppEntity mới
//        AppEntity appEntity = new AppEntity();
//        appEntity.setName(request.getName());
//        appEntity.setFrameworkType(request.getFrameworkType());
//        appEntity.setDeploymentType(request.getDeploymentType());
//        appEntity.setStatus("building");
//        appEntity.setUser(user);
//
//        // Phân nhánh theo deploymentType
//        DeployAppResponse response;
//        if ("docker".equalsIgnoreCase(request.getDeploymentType())) {
//            // Validate dockerImage
//            if (request.getDockerImage() == null || request.getDockerImage().trim().isEmpty()) {
//                throw new RuntimeException("Docker image không được để trống khi deployment type là docker");
//            }
//
//            appEntity.setDockerImage(request.getDockerImage());
//
//            // Gọi hàm triển khai docker
//            response = deployWithDocker(appEntity, request);
//        } else if ("file".equalsIgnoreCase(request.getDeploymentType())) {
//            // Validate filePath
//            if (request.getFilePath() == null || request.getFilePath().trim().isEmpty()) {
//                throw new RuntimeException("File path không được để trống khi deployment type là file");
//            }
//
//            appEntity.setFilePath(request.getFilePath());
//
//            // Gọi hàm triển khai file
//            response = deployWithFile(appEntity);
//        } else {
//            throw new RuntimeException("Deployment type không hợp lệ. Chỉ chấp nhận 'docker' hoặc 'file'");
//        }
//
//        // Lưu AppEntity vào database
//        AppEntity savedAppEntity = appRepository.save(appEntity);
//
//        // Cập nhật response với thông tin từ database
//        response.setStatus(savedAppEntity.getStatus());
//
//        return response;
//    }
//
//    /**
//     * Hàm triển khai ứng dụng với Docker image
//     */
//    private DeployAppResponse deployWithDocker(AppEntity appEntity, DeployAppRequest request) {
//        Session session = null;
//        ChannelSftp sftpChannel = null;
//
//        try {
//            // Kiểm tra thông tin SSH
//            if (request.getSshHost() == null || request.getSshHost().trim().isEmpty() ||
//                request.getSshUsername() == null || request.getSshUsername().trim().isEmpty() ||
//                request.getSshPassword() == null || request.getSshPassword().trim().isEmpty()) {
//                throw new RuntimeException("Thông tin SSH không đầy đủ. Vui lòng cung cấp sshHost, sshUsername, sshPassword");
//            }
//
//            int sshPort = request.getSshPort() != null ? request.getSshPort() : 22;
//
//            System.out.println("Đang kết nối đến Ubuntu server: " + request.getSshHost() + ":" + sshPort);
//
//            // Bước 1: Tạo kết nối SSH đến máy ảo Ubuntu
//            JSch jsch = new JSch();
//            session = jsch.getSession(request.getSshUsername(), request.getSshHost(), sshPort);
//            session.setPassword(request.getSshPassword());
//
//            // Tắt kiểm tra strict host key
//            Properties config = new Properties();
//            config.put("StrictHostKeyChecking", "no");
//            session.setConfig(config);
//
//            // Thiết lập thời gian chờ kết nối
//            session.setTimeout(5000);
//
//            // Kết nối
//            session.connect();
//            System.out.println("Kết nối SSH thành công!");
//
//            // Bước 2: Tạo file với tên từ appEntity.getName()
//            String fileName = appEntity.getName().toLowerCase()
//                    .replaceAll("\\s+", "-")
//                    .replaceAll("[^a-z0-9-]", "") + ".yaml";
//
//            System.out.println("Đang tạo file: " + fileName);
//
//            // Bước 3: Tạo nội dung file từ dockerImage.md (dòng 2-34)
//            // Chuẩn hóa tên app để dùng trong YAML
//            String appName = appEntity.getName().toLowerCase()
//                    .replaceAll("\\s+", "-")
//                    .replaceAll("[^a-z0-9-]", "");
//
//            String fileContent = "apiVersion: apps/v1\n" +
//                    "kind: Deployment\n" +
//                    "metadata:\n" +
//                    "  name: " + appName + "\n" +
//                    "  namespace: web\n" +
//                    "spec:\n" +
//                    "  replicas: 2\n" +
//                    "  selector:\n" +
//                    "    matchLabels:\n" +
//                    "      app: " + appName + "\n" +
//                    "  template:\n" +
//                    "    metadata:\n" +
//                    "      labels:\n" +
//                    "        app: " + appName + "\n" +
//                    "    spec:\n" +
//                    "      containers:\n" +
//                    "        - name: " + appName + "\n" +
//                    "          image: " + appEntity.getDockerImage() + "\n" +
//                    "          ports:\n" +
//                    "            - containerPort: 80\n" +
//                    "---\n" +
//                    "apiVersion: v1\n" +
//                    "kind: Service\n" +
//                    "metadata:\n" +
//                    "  name: " + appName + "-svc\n" +
//                    "  namespace: web\n" +
//                    "spec:\n" +
//                    "  type: ClusterIP\n" +
//                    "  selector:\n" +
//                    "    app: " + appName + "\n" +
//                    "  ports:\n" +
//                    "    - port: 80\n" +
//                    "      targetPort: 80\n";
//
//            // Bước 4: Mở SFTP channel để upload file
//            Channel channel = session.openChannel("sftp");
//            channel.connect();
//            sftpChannel = (ChannelSftp) channel;
//
//            // Upload file đầu tiên (Deployment + Service) lên server
//            InputStream fileInputStream = new ByteArrayInputStream(fileContent.getBytes(StandardCharsets.UTF_8));
//            String remotePath = "/home/" + request.getSshUsername() + "/" + fileName;
//            sftpChannel.put(fileInputStream, remotePath);
//
//            System.out.println("Đã tạo file " + fileName + "thành công tại: " + remotePath);
//
//            // Bước 5: Tạo file Ingress thứ hai
//            String ingressFileName = appName + "-ingress.yaml";
//            System.out.println("Đang tạo file Ingress: " + ingressFileName);
//
//            // Tạo nội dung file Ingress từ dockerImage.md (dòng 40-59)
//            String ingressContent = "apiVersion: networking.k8s.io/v1\n" +
//                    "kind: Ingress\n" +
//                    "metadata:\n" +
//                    "  name: " + appName + "-ing\n" +
//                    "  namespace: web\n" +
//                    "  annotations:\n" +
//                    "    nginx.ingress.kubernetes.io/rewrite-target: /\n" +
//                    "spec:\n" +
//                    "  ingressClassName: nginx\n" +
//                    "  rules:\n" +
//                    "    - host: " + appName + ".local.test\n" +
//                    "      http:\n" +
//                    "        paths:\n" +
//                    "          - path: /\n" +
//                    "            pathType: Prefix\n" +
//                    "            backend:\n" +
//                    "              service:\n" +
//                    "                name: " + appName + "-svc\n" +
//                    "                port:\n" +
//                    "                  number: 80\n";
//
//            // Upload file Ingress lên server
//            InputStream ingressInputStream = new ByteArrayInputStream(ingressContent.getBytes(StandardCharsets.UTF_8));
//            String ingressRemotePath = "/home/" + request.getSshUsername() + "/" + ingressFileName;
//            sftpChannel.put(ingressInputStream, ingressRemotePath);
//
//            System.out.println("Đã tạo file " + ingressFileName + "thành công tại: " + ingressRemotePath);
//
//            // Đóng SFTP channel
//            sftpChannel.disconnect();
//            sftpChannel = null;
//
//            // Bước 6: Thực thi lệnh kubectl apply cho file đầu tiên
//            String homeDirectory = "/home/" + request.getSshUsername();
//
//            System.out.println("Đang thực thi: kubectl apply -f " + fileName);
//            String kubectlResult1 = executeCommand(session, "cd " + homeDirectory + " && kubectl apply -f " + fileName);
//            System.out.println("Kết quả apply file Deployment/Service: " + kubectlResult1);
//
//            // Bước 7: Thực thi lệnh kubectl apply cho file Ingress
//            System.out.println("Đang thực thi: kubectl apply -f " + ingressFileName);
//            String kubectlResult2 = executeCommand(session, "cd " + homeDirectory + " && kubectl apply -f " + ingressFileName);
//            System.out.println("Kết quả apply file Ingress: " + kubectlResult2);
//
//            // Cập nhật status và URL
//            appEntity.setStatus("running");
//            String generatedUrl = "http://" + request.getSshHost() + "/" + appName;
//
//            DeployAppResponse response = new DeployAppResponse();
//            response.setUrl(generatedUrl);
//            response.setStatus(appEntity.getStatus());
//
//            System.out.println("Triển khai Docker thành công! File: " + fileName);
//            return response;
//
//        } catch (Exception e) {
//            appEntity.setStatus("error");
//            System.err.println("Lỗi khi triển khai Docker: " + e.getMessage());
//            e.printStackTrace();
//            throw new RuntimeException("Lỗi khi triển khai Docker: " + e.getMessage(), e);
//        } finally {
//            // Đóng kết nối
//            if (sftpChannel != null && sftpChannel.isConnected()) {
//                sftpChannel.disconnect();
//            }
//            if (session != null && session.isConnected()) {
//                session.disconnect();
//            }
//        }
//    }
//
//    /**
//     * Hàm triển khai ứng dụng với File upload
//     */
//    private DeployAppResponse deployWithFile(AppEntity appEntity) {
//        // TODO: Implement logic triển khai File
//        // Ví dụ: Build từ source code, deploy lên server, etc.
//
//        // Simulate deployment process
//        try {
//            // Giả lập quá trình deploy File
//            // Trong thực tế sẽ build source code, deploy lên hosting server
//            System.out.println("Đang triển khai File từ path: " + appEntity.getFilePath());
//
//            // Simulate: sau khi deploy thành công
//            appEntity.setStatus("running");
//            String generatedUrl = "https://" + appEntity.getName().toLowerCase().replaceAll("\\s+", "-") + ".example.com";
//
//            DeployAppResponse response = new DeployAppResponse();
//            response.setUrl(generatedUrl);
//            response.setStatus(appEntity.getStatus());
//
//            return response;
//        } catch (Exception e) {
//            appEntity.setStatus("error");
//            throw new RuntimeException("Lỗi khi triển khai File: " + e.getMessage());
//        }
//    }

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

            System.out.println("Đang kết nối đến Ubuntu server: " + ssh_host + ":" + ssh_port);

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
            System.out.println("Kết nối SSH thành công!");

            // Bước 2: Tạo file với tên từ appEntity.getName()
            String fileName = appEntity.getName().toLowerCase()
                    .replaceAll("\\s+", "-")
                    .replaceAll("[^a-z0-9-]", "") + ".yaml";
            
            System.out.println("Đang tạo file: " + fileName);

            // Bước 3: Tạo nội dung file từ dockerImage.md (dòng 2-34)
            // Chuẩn hóa tên app để dùng trong YAML
            String appName = appEntity.getName().toLowerCase()
                    .replaceAll("\\s+", "-")
                    .replaceAll("[^a-z0-9-]", "");
            
            String fileContent = "apiVersion: apps/v1\n" +
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
                    "          image: " + appEntity.getDockerImage() + "\n" +
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
                    "      targetPort: 80\n";

            // Bước 4: Mở SFTP channel để upload file
            Channel channel = session.openChannel("sftp");
            channel.connect();
            sftpChannel = (ChannelSftp) channel;

            // Upload file đầu tiên (Deployment + Service) lên server
            InputStream fileInputStream = new ByteArrayInputStream(fileContent.getBytes(StandardCharsets.UTF_8));
            String remotePath = "/home/" + ssh_username + "/" + fileName;
            sftpChannel.put(fileInputStream, remotePath);
            
            System.out.println("Đã tạo file " + fileName + "thành công tại: " + remotePath);

            // Bước 5: Tạo file Ingress thứ hai
            String ingressFileName = appName + "-ingress.yaml";
            System.out.println("Đang tạo file Ingress: " + ingressFileName);
            
            // Tạo nội dung file Ingress từ dockerImage.md (dòng 40-59)
            String ingressContent = "apiVersion: networking.k8s.io/v1\n" +
                    "kind: Ingress\n" +
                    "metadata:\n" +
                    "  name: " + appName + "-ing\n" +
                    "  namespace: web\n" +
                    "  annotations:\n" +
                    "    nginx.ingress.kubernetes.io/rewrite-target: /\n" +
                    "spec:\n" +
                    "  ingressClassName: nginx\n" +
                    "  rules:\n" +
                    "    - host: " + appName + ".local.test\n" +
                    "      http:\n" +
                    "        paths:\n" +
                    "          - path: /\n" +
                    "            pathType: Prefix\n" +
                    "            backend:\n" +
                    "              service:\n" +
                    "                name: " + appName + "-svc\n" +
                    "                port:\n" +
                    "                  number: 80\n";
            
            // Upload file Ingress lên server
            InputStream ingressInputStream = new ByteArrayInputStream(ingressContent.getBytes(StandardCharsets.UTF_8));
            String ingressRemotePath = "/home/" + ssh_username + "/" + ingressFileName;
            sftpChannel.put(ingressInputStream, ingressRemotePath);
            
            System.out.println("Đã tạo file " + ingressFileName + "thành công tại: " + ingressRemotePath);

            // Đóng SFTP channel
            sftpChannel.disconnect();
            sftpChannel = null;

            // Bước 6: Thực thi lệnh kubectl apply cho file đầu tiên
            String homeDirectory = "/home/" + ssh_username;
            
            System.out.println("Đang thực thi: kubectl apply -f " + fileName);
            String kubectlResult1 = executeCommand(session, "cd " + homeDirectory + " && kubectl apply -f " + fileName);
            System.out.println("Kết quả apply file Deployment/Service: " + kubectlResult1);

            // Bước 7: Thực thi lệnh kubectl apply cho file Ingress
            System.out.println("Đang thực thi: kubectl apply -f " + ingressFileName);
            String kubectlResult2 = executeCommand(session, "cd " + homeDirectory + " && kubectl apply -f " + ingressFileName);
            System.out.println("Kết quả apply file Ingress: " + kubectlResult2);

            // Cập nhật status và URL
            appEntity.setStatus("running");
            String generatedUrl = "http://" + appName + ".local.test";
            appEntity.setUrl(generatedUrl);

            DeployAppDockerResponse response = new DeployAppDockerResponse();
            response.setUrl(generatedUrl);
            response.setStatus(appEntity.getStatus());

            // Lưu AppEntity vào database
            AppEntity savedAppEntity = appRepository.save(appEntity);

            System.out.println("Triển khai Docker thành công! File: " + fileName);
            return response;

        } catch (Exception e) {
            appEntity.setStatus("error");
            System.err.println("Lỗi khi triển khai Docker: " + e.getMessage());
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
        return null;
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

