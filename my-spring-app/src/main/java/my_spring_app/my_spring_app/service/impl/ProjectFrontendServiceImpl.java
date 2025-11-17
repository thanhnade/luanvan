package my_spring_app.my_spring_app.service.impl;

import com.jcraft.jsch.*;
import my_spring_app.my_spring_app.dto.reponse.DeployFrontendResponse;
import my_spring_app.my_spring_app.dto.reponse.ListProjectFrontendResponse;
import my_spring_app.my_spring_app.dto.request.DeployFrontendRequest;
import my_spring_app.my_spring_app.entity.ProjectEntity;
import my_spring_app.my_spring_app.entity.ProjectFrontendEntity;
import my_spring_app.my_spring_app.entity.ServerEntity;
import my_spring_app.my_spring_app.entity.UserEntity;
import my_spring_app.my_spring_app.repository.ProjectFrontendRepository;
import my_spring_app.my_spring_app.repository.ProjectRepository;
import my_spring_app.my_spring_app.repository.ServerRepository;
import my_spring_app.my_spring_app.repository.UserRepository;
import my_spring_app.my_spring_app.service.ProjectFrontendService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.ApiException;
import io.kubernetes.client.openapi.Configuration;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import io.kubernetes.client.openapi.models.V1Namespace;
import io.kubernetes.client.openapi.models.V1ObjectMeta;
import io.kubernetes.client.util.Config;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileWriter;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.Properties;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service implementation cho ProjectFrontend
 * Xử lý các nghiệp vụ liên quan đến triển khai frontend projects
 */
@Service
@Transactional
public class ProjectFrontendServiceImpl implements ProjectFrontendService {

    // Username DockerHub để push images
    @Value("${app.vars.dockerhub_username}")
    private String dockerhub_username;

    // Repository để truy vấn ProjectFrontend entities
    @Autowired
    private ProjectFrontendRepository projectFrontendRepository;

    // Repository để truy vấn Project entities
    @Autowired
    private ProjectRepository projectRepository;

    // Repository để truy vấn User entities
    @Autowired
    private UserRepository userRepository;

    // Repository để truy vấn Server entities (MASTER, DOCKER, DATABASE)
    @Autowired
    private ServerRepository serverRepository;

    /**
     * Tạo short UUID từ UUID đầy đủ để sử dụng trong Kubernetes
     * UUID đầy đủ có 36 ký tự (với dấu gạch ngang), short UUID sẽ có độ dài cố định 12 ký tự
     * Đảm bảo tính duy nhất bằng cách kiểm tra trong database
     * 
     * @param fullUuid UUID đầy đủ từ UUID.randomUUID().toString()
     * @return Short UUID (12 ký tự) đảm bảo tính duy nhất
     */
    private String generateShortUuid(String fullUuid) {
        // Loại bỏ dấu gạch ngang và lấy 12 ký tự đầu
        String uuidWithoutDashes = fullUuid.replace("-", "");
        String shortUuid = uuidWithoutDashes.substring(0, 12);
        
        // Kiểm tra tính duy nhất trong database
        int attempt = 0;
        while (projectFrontendRepository.existsByUuid_k8s(shortUuid)) {
            attempt++;
            // Nếu trùng, tạo UUID mới và lấy 12 ký tự đầu
            if (attempt > 100) {
                // Nếu quá nhiều lần thử, throw exception
                throw new RuntimeException("Không thể tạo short UUID duy nhất sau " + attempt + " lần thử");
            }
            // Tạo UUID mới
            fullUuid = UUID.randomUUID().toString();
            uuidWithoutDashes = fullUuid.replace("-", "");
            shortUuid = uuidWithoutDashes.substring(0, 12);
        }
        
        return shortUuid;
    }

    /**
     * Helper method để tạo nội dung YAML Kubernetes cho frontend
     * Tạo file YAML bao gồm: Deployment, Service, và Ingress
     * 
     * @param uuid_k8s Short UUID cho deployment
     * @param dockerImage Docker image tag để deploy
     * @param domainName Domain name để cấu hình Ingress
     * @param namespace Namespace để deploy vào Kubernetes
     * @return Nội dung YAML đầy đủ cho Deployment, Service và Ingress
     */
    private String generateFrontendReactYaml(String uuid_k8s, String dockerImage, String domainName, String namespace) {
        // K8s Service/Ingress dùng DNS-1035: phải bắt đầu bằng chữ cái -> prefix 'app-'
        String resourceName = "app-" + uuid_k8s;
        // Tạo YAML với 3 phần: Deployment, Service, Ingress
        return "apiVersion: apps/v1\n" +
                "kind: Deployment\n" +
                "metadata:\n" +
                "  name: " + resourceName + "\n" +
                "  namespace: " + namespace + "\n" +
                "spec:\n" +
                "  replicas: 1\n" +  // Số lượng pod replica
                "  selector:\n" +
                "    matchLabels:\n" +
                "      app: " + resourceName + "\n" +
                "  template:\n" +
                "    metadata:\n" +
                "      labels:\n" +
                "        app: " + resourceName + "\n" +
                "    spec:\n" +
                "      containers:\n" +
                "        - name: " + resourceName + "\n" +
                "          image: " + dockerImage + "\n" +
                "          ports:\n" +
                "            - containerPort: 80\n" +  // Port container frontend
                "---\n" +
                "apiVersion: v1\n" +
                "kind: Service\n" +
                "metadata:\n" +
                "  name: " + resourceName + "-svc\n" +
                "  namespace: " + namespace + "\n" +
                "spec:\n" +
                "  type: ClusterIP\n" +  // Service type ClusterIP để expose trong cluster
                "  selector:\n" +
                "    app: " + resourceName + "\n" +
                "  ports:\n" +
                "    - port: 80\n" +  // Port service
                "      targetPort: 80\n" +  // Port container
                "---\n" +
                "apiVersion: networking.k8s.io/v1\n" +
                "kind: Ingress\n" +
                "metadata:\n" +
                "  name: " + resourceName + "-ing\n" +
                "  namespace: " + namespace + "\n" +
                "  annotations:\n" +
                "    nginx.ingress.kubernetes.io/rewrite-target: /\n" +  // Rewrite path cho nginx ingress
                "spec:\n" +
                "  ingressClassName: nginx\n" +  // Sử dụng nginx ingress controller
                "  rules:\n" +
                "    - host: " + domainName + "\n" +  // Domain name cho ingress
                "      http:\n" +
                "        paths:\n" +
                "          - path: /\n" +
                "            pathType: Prefix\n" +
                "            backend:\n" +
                "              service:\n" +
                "                name: " + resourceName + "-svc\n" +
                "                port:\n" +
                "                  number: 80\n";
    }

     /**
     * Helper method để tạo nội dung YAML Kubernetes cho frontend
     * Tạo file YAML bao gồm: Deployment, Service, và Ingress
     * 
     * @param uuid_k8s Short UUID cho deployment
     * @param dockerImage Docker image tag để deploy
     * @param domainName Domain name để cấu hình Ingress
     * @param namespace Namespace để deploy vào Kubernetes
     * @return Nội dung YAML đầy đủ cho Deployment, Service và Ingress
     */
    private String generateFrontendVueYaml(String uuid_k8s, String dockerImage, String domainName, String namespace) {
        String resourceName = "app-" + uuid_k8s;
        // Tạo YAML với 3 phần: Deployment, Service, Ingress
        return "apiVersion: apps/v1\n" +
                "kind: Deployment\n" +
                "metadata:\n" +
                "  name: " + resourceName + "\n" +
                "  namespace: " + namespace + "\n" +
                "spec:\n" +
                "  replicas: 1\n" +  // Số lượng pod replica
                "  selector:\n" +
                "    matchLabels:\n" +
                "      app: " + resourceName + "\n" +
                "  template:\n" +
                "    metadata:\n" +
                "      labels:\n" +
                "        app: " + resourceName + "\n" +
                "    spec:\n" +
                "      containers:\n" +
                "        - name: " + resourceName + "\n" +
                "          image: " + dockerImage + "\n" +
                "          ports:\n" +
                "            - containerPort: 80\n" +  // Port container frontend
                "---\n" +
                "apiVersion: v1\n" +
                "kind: Service\n" +
                "metadata:\n" +
                "  name: " + resourceName + "-svc\n" +
                "  namespace: " + namespace + "\n" +
                "spec:\n" +
                "  type: ClusterIP\n" +  // Service type ClusterIP để expose trong cluster
                "  selector:\n" +
                "    app: " + resourceName + "\n" +
                "  ports:\n" +
                "    - port: 80\n" +  // Port service
                "      targetPort: 80\n" +  // Port container
                "---\n" +
                "apiVersion: networking.k8s.io/v1\n" +
                "kind: Ingress\n" +
                "metadata:\n" +
                "  name: " + resourceName + "-ing\n" +
                "  namespace: " + namespace + "\n" +
                "  annotations:\n" +
                "    nginx.ingress.kubernetes.io/rewrite-target: /\n" +  // Rewrite path cho nginx ingress
                "spec:\n" +
                "  ingressClassName: nginx\n" +  // Sử dụng nginx ingress controller
                "  rules:\n" +
                "    - host: " + domainName + "\n" +  // Domain name cho ingress
                "      http:\n" +
                "        paths:\n" +
                "          - path: /\n" +
                "            pathType: Prefix\n" +
                "            backend:\n" +
                "              service:\n" +
                "                name: " + resourceName + "-svc\n" +
                "                port:\n" +
                "                  number: 80\n";
    }

     /**
     * Helper method để tạo nội dung YAML Kubernetes cho frontend
     * Tạo file YAML bao gồm: Deployment, Service, và Ingress
     * 
     * @param uuid_k8s Short UUID cho deployment
     * @param dockerImage Docker image tag để deploy
     * @param domainName Domain name để cấu hình Ingress
     * @param namespace Namespace để deploy vào Kubernetes
     * @return Nội dung YAML đầy đủ cho Deployment, Service và Ingress
     */
    private String generateFrontendAngularYaml(String uuid_k8s, String dockerImage, String domainName, String namespace) {
        String resourceName = "app-" + uuid_k8s;
        // Tạo YAML với 3 phần: Deployment, Service, Ingress
        return "apiVersion: apps/v1\n" +
                "kind: Deployment\n" +
                "metadata:\n" +
                "  name: " + resourceName + "\n" +
                "  namespace: " + namespace + "\n" +
                "spec:\n" +
                "  replicas: 1\n" +  // Số lượng pod replica
                "  selector:\n" +
                "    matchLabels:\n" +
                "      app: " + resourceName + "\n" +
                "  template:\n" +
                "    metadata:\n" +
                "      labels:\n" +
                "        app: " + resourceName + "\n" +
                "    spec:\n" +
                "      containers:\n" +
                "        - name: " + resourceName + "\n" +
                "          image: " + dockerImage + "\n" +
                "          ports:\n" +
                "            - containerPort: 80\n" +  // Port container frontend
                "---\n" +
                "apiVersion: v1\n" +
                "kind: Service\n" +
                "metadata:\n" +
                "  name: " + resourceName + "-svc\n" +
                "  namespace: " + namespace + "\n" +
                "spec:\n" +
                "  type: ClusterIP\n" +  // Service type ClusterIP để expose trong cluster
                "  selector:\n" +
                "    app: " + resourceName + "\n" +
                "  ports:\n" +
                "    - port: 80\n" +  // Port service
                "      targetPort: 80\n" +  // Port container
                "---\n" +
                "apiVersion: networking.k8s.io/v1\n" +
                "kind: Ingress\n" +
                "metadata:\n" +
                "  name: " + resourceName + "-ing\n" +
                "  namespace: " + namespace + "\n" +
                "  annotations:\n" +
                "    nginx.ingress.kubernetes.io/rewrite-target: /\n" +  // Rewrite path cho nginx ingress
                "spec:\n" +
                "  ingressClassName: nginx\n" +  // Sử dụng nginx ingress controller
                "  rules:\n" +
                "    - host: " + domainName + "\n" +  // Domain name cho ingress
                "      http:\n" +
                "        paths:\n" +
                "          - path: /\n" +
                "            pathType: Prefix\n" +
                "            backend:\n" +
                "              service:\n" +
                "                name: " + resourceName + "-svc\n" +
                "                port:\n" +
                "                  number: 80\n";
    }

    /**
     * Kiểm tra và tạo namespace trên Kubernetes cluster nếu chưa tồn tại
     * Sử dụng Kubernetes Java Client API
     * 
     * @param session SSH session đến MASTER server để lấy kubeconfig
     * @param namespace Tên namespace cần kiểm tra/tạo
     * @throws Exception Nếu có lỗi khi kiểm tra hoặc tạo namespace
     */
    private void ensureNamespaceExists(Session session, String namespace) throws Exception {
        System.out.println("[ensureNamespaceExists] Kiểm tra namespace: " + namespace);
        
        File tempKubeconfig = null;
        try {
            // Đọc kubeconfig từ master server (thường ở ~/.kube/config)
            String kubeconfigPath = "~/.kube/config";
            System.out.println("[ensureNamespaceExists] Đang đọc kubeconfig từ: " + kubeconfigPath);
            String kubeconfigContent = executeCommand(session, "cat " + kubeconfigPath);
            
            if (kubeconfigContent == null || kubeconfigContent.trim().isEmpty()) {
                throw new RuntimeException("Không thể đọc kubeconfig từ master server");
            }
            
            // Tạo file kubeconfig tạm thời trên local
            tempKubeconfig = File.createTempFile("kubeconfig-", ".yaml");
            tempKubeconfig.deleteOnExit();
            try (FileWriter writer = new FileWriter(tempKubeconfig)) {
                writer.write(kubeconfigContent);
            }
            System.out.println("[ensureNamespaceExists] Đã tạo file kubeconfig tạm thời: " + tempKubeconfig.getAbsolutePath());
            
            // Khởi tạo Kubernetes API client từ kubeconfig
            ApiClient client = Config.fromConfig(tempKubeconfig.getAbsolutePath());
            Configuration.setDefaultApiClient(client);
            CoreV1Api api = new CoreV1Api();
            
            // Kiểm tra namespace đã tồn tại chưa
            try {
                V1Namespace ns = api.readNamespace(namespace, null);
                System.out.println("[ensureNamespaceExists] Namespace đã tồn tại: " + namespace + " (Status: " + 
                    (ns.getStatus() != null && ns.getStatus().getPhase() != null ? ns.getStatus().getPhase() : "Unknown") + ")");
            } catch (ApiException e) {
                if (e.getCode() == 404) {
                    // Namespace chưa tồn tại, tạo mới
                    System.out.println("[ensureNamespaceExists] Namespace chưa tồn tại, đang tạo mới: " + namespace);
                    V1Namespace newNamespace = new V1Namespace();
                    V1ObjectMeta metadata = new V1ObjectMeta();
                    metadata.setName(namespace);
                    newNamespace.setMetadata(metadata);
                    
                    V1Namespace createdNamespace = api.createNamespace(newNamespace, null, null, null, null);
                    System.out.println("[ensureNamespaceExists] Đã tạo namespace thành công: " + namespace);
                } else {
                    System.err.println("[ensureNamespaceExists] Lỗi API khi kiểm tra namespace. Code: " + e.getCode() + ", Message: " + e.getMessage());
                    throw new RuntimeException("Lỗi khi kiểm tra namespace: " + e.getMessage(), e);
                }
            }
            
        } catch (Exception e) {
            System.err.println("[ensureNamespaceExists] Lỗi: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Không thể kiểm tra/tạo namespace: " + e.getMessage(), e);
        } finally {
            // Đảm bảo xóa file tạm thời sau khi sử dụng
            if (tempKubeconfig != null && tempKubeconfig.exists()) {
                try {
                    tempKubeconfig.delete();
                } catch (Exception e) {
                    System.err.println("[ensureNamespaceExists] Không thể xóa file kubeconfig tạm thời: " + e.getMessage());
                }
            }
        }
    }

    /**
     * Helper method để thực thi lệnh qua SSH và trả về output
     * @param session SSH session đã kết nối
     * @param command Lệnh cần thực thi
     * @return Kết quả output của lệnh
     * @throws Exception Nếu có lỗi khi thực thi lệnh
     */
    private String executeCommand(Session session, String command) throws Exception {
        return executeCommand(session, command, false);
    }

    /**
     * Helper method để thực thi lệnh qua SSH và trả về output
     * @param session SSH session đã kết nối
     * @param command Lệnh cần thực thi
     * @param ignoreNonZeroExit Nếu true, sẽ không throw exception khi lệnh trả về exit status != 0
     * @return Kết quả output của lệnh
     * @throws Exception Nếu có lỗi khi thực thi lệnh và ignoreNonZeroExit = false
     */
    private String executeCommand(Session session, String command, boolean ignoreNonZeroExit) throws Exception {
        ChannelExec channelExec = null;

        try {
            // Mở channel thực thi lệnh (exec) từ SSH session
            Channel channel = session.openChannel("exec");
            channelExec = (ChannelExec) channel;

            // Thiết lập lệnh cần thực thi
            channelExec.setCommand(command);
            // Chuyển hướng error stream ra console để dễ debug
            channelExec.setErrStream(System.err);

            // Lấy input stream để đọc output từ lệnh
            InputStream inputStream = channelExec.getInputStream();
            // Kết nối channel để bắt đầu thực thi lệnh
            channelExec.connect();

            // Khởi tạo biến để lưu output
            StringBuilder output = new StringBuilder();
            byte[] buffer = new byte[1024]; // Buffer để đọc dữ liệu

            // Vòng lặp để đọc output từ lệnh
            while (true) {
                // Đọc tất cả dữ liệu có sẵn trong input stream
                while (inputStream.available() > 0) {
                    int bytesRead = inputStream.read(buffer, 0, 1024);
                    // Nếu đọc hết dữ liệu thì dừng
                    if (bytesRead < 0) {
                        break;
                    }
                    // Chuyển đổi bytes sang string và thêm vào output
                    output.append(new String(buffer, 0, bytesRead, StandardCharsets.UTF_8));
                }

                // Kiểm tra xem channel đã đóng chưa (lệnh đã thực thi xong)
                if (channelExec.isClosed()) {
                    // Nếu vẫn còn dữ liệu trong stream, tiếp tục đọc
                    if (inputStream.available() > 0) {
                        continue;
                    }
                    // Nếu không còn dữ liệu và channel đã đóng thì thoát vòng lặp
                    break;
                }

                // Nghỉ 100ms trước khi kiểm tra lại để tránh chiếm CPU
                try {
                    Thread.sleep(100);
                } catch (Exception e) {
                    // Bỏ qua lỗi sleep
                }
            }

            // Lấy exit status của lệnh (0 = thành công, != 0 = lỗi)
            int exitStatus = channelExec.getExitStatus();
            // Chuyển output sang string và loại bỏ khoảng trắng đầu cuối
            String result = output.toString().trim();

            // Xử lý trường hợp lệnh thực thi không thành công (exit status != 0)
            if (exitStatus != 0) {
                if (ignoreNonZeroExit) {
                    // Nếu được phép bỏ qua lỗi, chỉ in ra log
                    System.err.println("[executeCommand] Command exited with status: " + exitStatus + ". Output: " + result + ". Command: " + command);
                } else {
                    // Nếu không được bỏ qua, throw exception với thông báo lỗi
                    throw new RuntimeException("Command exited with status: " + exitStatus + ". Output: " + result);
                }
            }

            // Trả về kết quả output của lệnh
            return result;

        } finally {
            // Đảm bảo đóng channel sau khi thực thi xong để giải phóng tài nguyên
            if (channelExec != null && channelExec.isConnected()) {
                channelExec.disconnect();
            }
        }
    }

    /**
     * Triển khai frontend project lên Kubernetes cluster
     * Hỗ trợ 2 phương thức deploy: DOCKER (từ image có sẵn) và FILE (từ file zip)
     * 
     * @param request Thông tin request để deploy frontend project
     * @return Response chứa thông tin URL, status và domain name của project đã deploy
     * @throws RuntimeException Nếu có lỗi trong quá trình deploy
     */
    @Override
    public DeployFrontendResponse deploy(DeployFrontendRequest request) {
        System.out.println("[deployFrontend] Bắt đầu triển khai frontend project");

        // ========== BƯỚC 1: VALIDATE VÀ CHUẨN BỊ DỮ LIỆU ==========
        
        // Tìm user theo username
        Optional<UserEntity> userOptional = userRepository.findByUsername(request.getUsername());
        if (userOptional.isEmpty()) {
            throw new RuntimeException("User không tồn tại");
        }
        UserEntity user = userOptional.get();
        System.out.println("[deployFrontend] Tier của user: " + user.getTier());

        if ("STANDARD".equalsIgnoreCase(user.getTier())) {
            long frontendCount = projectFrontendRepository.countByProject_User(user);
            System.out.println("[deployFrontend] User STANDARD hiện có " + frontendCount + " frontend project(s)");
            if (frontendCount >= 1) {
                String errorMessage = "Tài khoản STANDARD chỉ được phép triển khai 1 frontend. Vui lòng nâng cấp gói để tiếp tục.";
                System.err.println("[deployFrontend] Lỗi: " + errorMessage);
                throw new RuntimeException(errorMessage);
            }
        }

        // Lấy ProjectEntity từ projectId
        Optional<ProjectEntity> projectOptional = projectRepository.findById(request.getProjectId());
        if (projectOptional.isEmpty()) {
            throw new RuntimeException("Project không tồn tại với id: " + request.getProjectId());
        }
        ProjectEntity project = projectOptional.get();
        
        // Lấy namespace từ ProjectEntity
        String namespace = project.getNamespace();
        if (namespace == null || namespace.trim().isEmpty()) {
            throw new RuntimeException("Project không có namespace. Vui lòng cấu hình namespace cho project.");
        }
        System.out.println("[deployFrontend] Sử dụng namespace từ ProjectEntity: " + namespace);

        // Validate deployment method (chỉ hỗ trợ DOCKER hoặc FILE)
        if (!"DOCKER".equalsIgnoreCase(request.getDeploymentType()) &&
            !"FILE".equalsIgnoreCase(request.getDeploymentType())) {
            throw new RuntimeException("Deployment method không hợp lệ. Chỉ hỗ trợ DOCKER hoặc FILE");
        }

        // Validate framework (chỉ hỗ trợ REACT, VUE, ANGULAR)
        String framework = request.getFrameworkType().toUpperCase();
        if (!"REACT".equals(framework) && !"VUE".equals(framework) && !"ANGULAR".equals(framework)) {
            throw new RuntimeException("Framework không hợp lệ. Chỉ hỗ trợ REACT, VUE, ANGULAR");
        }

        // Chuẩn hóa tên project: chuyển sang lowercase, thay khoảng trắng bằng dấu gạch ngang, loại bỏ ký tự đặc biệt
        String projectName = request.getProjectName().toLowerCase()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9-]", "");

        // Tạo UUID đầy đủ để đảm bảo tính duy nhất
        String fullUuid = UUID.randomUUID().toString();
        // Tạo short UUID từ UUID đầy đủ để sử dụng trong Kubernetes (12 ký tự)
        String uuid_k8s = generateShortUuid(fullUuid);
        System.out.println("[deployFrontend] Tạo UUID đầy đủ: " + fullUuid);
        System.out.println("[deployFrontend] Short UUID cho deployment: " + uuid_k8s + " (độ dài: " + uuid_k8s.length() + " ký tự)");

        // Validate domainNameSystem từ request
        String domainName = request.getDomainNameSystem();
        if (domainName == null || domainName.trim().isEmpty()) {
            throw new RuntimeException("Domain name system không được để trống");
        }
        System.out.println("[deployFrontend] Sử dụng domain name từ request: " + domainName);

        // Tạo ProjectFrontendEntity và thiết lập các thuộc tính cơ bản
        ProjectFrontendEntity projectEntity = new ProjectFrontendEntity();
        projectEntity.setProjectName(request.getProjectName());
        projectEntity.setFrameworkType(framework);
        projectEntity.setDeploymentType(request.getDeploymentType().toUpperCase());
        projectEntity.setStatus("BUILDING"); // Trạng thái ban đầu là BUILDING
        projectEntity.setProject(project);
        // Lưu UUID vào entity để truy vết và tránh trùng tên resource trên K8s
        projectEntity.setUuid_k8s(uuid_k8s);
        // Lưu domain name từ request vào entity
        projectEntity.setDomainNameSystem(domainName);

        // ========== BƯỚC 2: LẤY THÔNG TIN SERVER TỪ DATABASE ==========
        
        // Lấy thông tin các server từ database: MASTER (Kubernetes cluster), DOCKER (build/push images), DATABASE
        Optional<ServerEntity> masterServerOptional = serverRepository.findByRole("MASTER");
        Optional<ServerEntity> dockerServerOptional = serverRepository.findByRole("DOCKER");
        Optional<ServerEntity> databaseServerOptional = serverRepository.findByRole("MASTER");

        // Validate các server bắt buộc
        if (masterServerOptional.isEmpty()) {
            throw new RuntimeException("Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống.");
        }
        if (dockerServerOptional.isEmpty()) {
            throw new RuntimeException("Không tìm thấy server DOCKER. Vui lòng cấu hình server DOCKER trong hệ thống.");
        }
        if (databaseServerOptional.isEmpty()) {
            throw new RuntimeException("Không tìm thấy server DATABASE. Vui lòng cấu hình server DATABASE trong hệ thống.");
        }

        ServerEntity master_server = masterServerOptional.get();
        ServerEntity docker_server = dockerServerOptional.get();
        ServerEntity database_server = databaseServerOptional.get();

        // Khởi tạo các biến để quản lý SSH/SFTP connections
        Session session = null;           // SSH session đến DOCKER server (dùng cho FILE deployment)
        ChannelSftp sftp = null;          // SFTP channel đến DOCKER server
        Session clusterSession = null;    // SSH session đến MASTER server (Kubernetes cluster)
        ChannelSftp sftpYaml = null;      // SFTP channel đến MASTER server để upload YAML

        try {
            // ========== BƯỚC 3: XỬ LÝ DEPLOYMENT THEO PHƯƠNG THỨC ==========
            
            if ("DOCKER".equalsIgnoreCase(request.getDeploymentType())) {
                // ========== PHƯƠNG THỨC 1: DEPLOY TỪ DOCKER IMAGE CÓ SẴN ==========
                
                // Validate Docker image
                if (request.getDockerImage() == null || request.getDockerImage().trim().isEmpty()) {
                    throw new RuntimeException("Docker image không được để trống khi deployment method là DOCKER");
                }

                projectEntity.setDockerImage(request.getDockerImage());

                // Kết nối SSH đến MASTER server (Kubernetes cluster)
                System.out.println("[deployFrontend] Đang kết nối đến MASTER server: " + master_server.getIp() + ":" + master_server.getPort());
                JSch jsch = new JSch();
                clusterSession = jsch.getSession(master_server.getUsername(), master_server.getIp(), master_server.getPort());
                clusterSession.setPassword(master_server.getPassword());
                Properties config = new Properties();
                config.put("StrictHostKeyChecking", "no"); // Không kiểm tra host key
                clusterSession.setConfig(config);
                clusterSession.setTimeout(7000);
                clusterSession.connect();
                System.out.println("[deployFrontend] Kết nối SSH đến MASTER server thành công");

                // Tạo nội dung YAML file (Deployment + Service + Ingress)
                // Sử dụng uuid_k8s để làm tên resource trong K8s, tránh trùng khi projectName bị trùng
                String fileName = uuid_k8s + ".yaml";
                String yamlContent = "";
                if ("REACT".equals(framework)) {
                    yamlContent = generateFrontendReactYaml(uuid_k8s, request.getDockerImage(), domainName, namespace);
                } else if ("VUE".equals(framework)) {
                    yamlContent = generateFrontendVueYaml(uuid_k8s, request.getDockerImage(), domainName, namespace);
                } else if ("ANGULAR".equals(framework)) {
                    yamlContent = generateFrontendAngularYaml(uuid_k8s, request.getDockerImage(), domainName, namespace);
                }

                // Mở SFTP channel để upload YAML file
                Channel sftpYamlCh = clusterSession.openChannel("sftp");
                sftpYamlCh.connect();
                sftpYaml = (ChannelSftp) sftpYamlCh;
                
                // Tạo thư mục đích với UUID để tránh trùng tên: /home/<master_username>/uploads/<username>/<uuid_k8s của project>/frontend/<uuid_k8s>
                String yamlRemoteDir = "/home/" + master_server.getUsername() + "/uploads/" + user.getUsername() + "/" + project.getUuid_k8s() + "/frontend/" + uuid_k8s;
                System.out.println("[deployFrontend] Tạo/cd thư mục YAML: " + yamlRemoteDir);
                String[] yamlDirParts = yamlRemoteDir.split("/");
                String yamlCur = "";
                for (String p : yamlDirParts) {
                    if (p == null || p.isBlank()) continue;
                    yamlCur += "/" + p;
                    try {
                        sftpYaml.cd(yamlCur); // Thử chuyển vào thư mục
                    } catch (Exception e) {
                        sftpYaml.mkdir(yamlCur); // Nếu không tồn tại thì tạo mới
                        sftpYaml.cd(yamlCur);
                    }
                }
                
                // Upload YAML file lên MASTER server (Kubernetes cluster)
                InputStream yamlStream = new ByteArrayInputStream(yamlContent.getBytes(StandardCharsets.UTF_8));
                String yamlRemotePath = yamlRemoteDir + "/" + fileName;
                sftpYaml.put(yamlStream, yamlRemotePath);
                System.out.println("[deployFrontend] Đã upload YAML file: " + yamlRemotePath);

                // Lưu yamlPath (đường dẫn YAML trên MASTER server)
                // Với deployment type là DOCKER: không có sourcePath (null)
                projectEntity.setSourcePath(null);
                projectEntity.setYamlPath(yamlRemotePath);

                // Kiểm tra và tạo namespace nếu chưa tồn tại
                ensureNamespaceExists(clusterSession, namespace);

                // Apply YAML file vào Kubernetes cluster bằng kubectl
                System.out.println("[deployFrontend] Đang apply YAML: kubectl apply -f " + yamlRemotePath);
                executeCommand(clusterSession, "kubectl apply -f '" + yamlRemotePath + "'");

            } else if ("FILE".equalsIgnoreCase(request.getDeploymentType())) {
                // ========== PHƯƠNG THỨC 2: DEPLOY TỪ FILE ZIP ==========
                
                // Validate file upload
                if (request.getFile() == null || request.getFile().isEmpty()) {
                    throw new RuntimeException("File upload không được để trống khi deployment method là FILE");
                }

                System.out.println("[deployFrontend] Kết nối SSH tới DOCKER server: " + docker_server.getIp() + ":" + docker_server.getPort());

                // Bước 1: Kết nối SSH đến DOCKER server (để build và push image)
                JSch jsch = new JSch();
                session = jsch.getSession(docker_server.getUsername(), docker_server.getIp(), docker_server.getPort());
                session.setPassword(docker_server.getPassword());
                Properties cfg = new Properties();
                cfg.put("StrictHostKeyChecking", "no");
                session.setConfig(cfg);
                session.setTimeout(7000);
                session.connect();
                System.out.println("[deployFrontend] Đã kết nối SSH DOCKER server thành công");

                // Bước 2: Upload file .zip lên DOCKER server
                Channel ch = session.openChannel("sftp");
                ch.connect();
                sftp = (ChannelSftp) ch;

                // Tạo thư mục đích trên DOCKER server với UUID để tránh trùng tên: /home/<docker_username>/uploads/<username>/<uuid_k8s của project>/frontend/<uuid_k8s>
                String remoteBase = "/home/" + docker_server.getUsername() + "/uploads/" + user.getUsername() + "/" + project.getUuid_k8s() + "/frontend/" + uuid_k8s;
                System.out.println("[deployFrontend] Tạo/cd thư mục đích: " + remoteBase);
                // Đảm bảo thư mục tồn tại (tạo từng cấp thư mục nếu chưa có)
                String[] parts = remoteBase.split("/");
                String cur = "";
                for (String p : parts) {
                    if (p == null || p.isBlank()) continue;
                    cur += "/" + p;
                    try {
                        sftp.cd(cur);
                    } catch (Exception e) {
                        sftp.mkdir(cur);
                        sftp.cd(cur);
                    }
                }

                // Tạo tên file an toàn (loại bỏ ký tự đặc biệt)
                String originalName = request.getFile().getOriginalFilename();
                String safeName = originalName != null ? originalName.replaceAll("[^a-zA-Z0-9._-]", "_") : (projectName + ".zip");
                String remoteZipPath = remoteBase + "/" + safeName;
                System.out.println("[deployFrontend] Upload file lên: " + remoteZipPath);
                sftp.put(request.getFile().getInputStream(), remoteZipPath);
                
                // Lưu sourcePath (đường dẫn file zip trên DOCKER server)
                projectEntity.setSourcePath(remoteZipPath);

                // Bước 3: Giải nén file .zip trên DOCKER server
                String unzipCmd = "cd " + remoteBase + " && unzip -o '" + safeName + "'";
                System.out.println("[deployFrontend] Giải nén: " + unzipCmd);
                executeCommand(session, unzipCmd);

                // Bước 4: Build và push Docker image
                // Xác định thư mục project sau khi giải nén
                String extractedDir = safeName.endsWith(".zip") ? safeName.substring(0, safeName.length() - 4) : safeName;
                String projectDir = remoteBase + "/" + extractedDir;

                // Kiểm tra Dockerfile có tồn tại không
                String checkDockerfile = "test -f '" + projectDir + "/Dockerfile' && echo OK || echo NO";
                System.out.println("[deployFrontend] Kiểm tra Dockerfile: " + checkDockerfile);
                String check = executeCommand(session, checkDockerfile);
                if (!"OK".equals(check.trim())) {
                    throw new RuntimeException("Không tìm thấy Dockerfile trong gói source đã giải nén");
                }

                // Build Docker image từ Dockerfile
                // Sử dụng uuid_k8s thay vì projectName để tránh trùng tên image
                String imageTag = dockerhub_username + "/" + uuid_k8s + ":latest";
                String buildCmd = "cd '" + projectDir + "' && docker build -t '" + imageTag + "' .";
                System.out.println("[deployFrontend] Docker build: " + buildCmd);
                executeCommand(session, buildCmd);
                
                // Push image lên DockerHub
                String pushCmd = "docker push '" + imageTag + "'";
                System.out.println("[deployFrontend] Docker push: " + pushCmd);
                executeCommand(session, pushCmd);

                projectEntity.setDockerImage(imageTag); // Lưu image tag vào database

                // Bước 5: Tạo YAML và apply lên Kubernetes cluster (MASTER server)
                System.out.println("[deployFrontend] Chuyển sang MASTER server để upload/apply YAML: " + master_server.getIp() + ":" + master_server.getPort());

                // Tạo nội dung YAML file
                // Sử dụng uuid_k8s để làm tên resource trong K8s, tránh trùng khi projectName bị trùng
                String fileName = uuid_k8s + ".yaml";    
                String yamlContent = "";
                if ("REACT".equals(framework)) {
                    yamlContent = generateFrontendReactYaml(uuid_k8s, imageTag, domainName, namespace);
                } else if ("VUE".equals(framework)) {
                    yamlContent = generateFrontendVueYaml(uuid_k8s, imageTag, domainName, namespace);
                } else if ("ANGULAR".equals(framework)) {
                    yamlContent = generateFrontendAngularYaml(uuid_k8s, imageTag, domainName, namespace);
                }

                // Kết nối SSH đến MASTER server
                JSch jschCluster = new JSch();
                clusterSession = jschCluster.getSession(master_server.getUsername(), master_server.getIp(), master_server.getPort());
                clusterSession.setPassword(master_server.getPassword());
                Properties cfgCluster = new Properties();
                cfgCluster.put("StrictHostKeyChecking", "no");
                clusterSession.setConfig(cfgCluster);
                clusterSession.setTimeout(7000);
                clusterSession.connect();
                System.out.println("[deployFrontend] Kết nối SSH tới MASTER server thành công");

                // Mở SFTP channel để upload YAML file
                Channel sftpYamlCh = clusterSession.openChannel("sftp");
                sftpYamlCh.connect();
                sftpYaml = (ChannelSftp) sftpYamlCh;
                
                // Tạo thư mục đích trên MASTER server với UUID để tránh trùng tên: /home/<master_username>/uploads/<username>/<uuid_k8s của project>/frontend/<uuid_k8s>
                String yamlRemoteDir = "/home/" + master_server.getUsername() + "/uploads/" + user.getUsername() + "/" + project.getUuid_k8s() + "/frontend/" + uuid_k8s;
                System.out.println("[deployFrontend] Tạo/cd thư mục YAML: " + yamlRemoteDir);
                String[] yamlDirParts = yamlRemoteDir.split("/");
                String yamlCur = "";
                for (String p : yamlDirParts) {
                    if (p == null || p.isBlank()) continue;
                    yamlCur += "/" + p;
                    try {
                        sftpYaml.cd(yamlCur);
                    } catch (Exception e) {
                        sftpYaml.mkdir(yamlCur);
                        sftpYaml.cd(yamlCur);
                    }
                }
                
                // Upload YAML file lên MASTER server
                InputStream yamlStream = new ByteArrayInputStream(yamlContent.getBytes(StandardCharsets.UTF_8));
                String yamlRemotePath = yamlRemoteDir + "/" + fileName;
                sftpYaml.put(yamlStream, yamlRemotePath);
                System.out.println("[deployFrontend] Upload YAML: " + yamlRemotePath);

                // Lưu yamlPath (đường dẫn YAML trên MASTER server)
                // Với FILE method: đã có sourcePath (đã set ở trên), giờ set thêm yamlPath
                projectEntity.setYamlPath(yamlRemotePath);

                // Kiểm tra và tạo namespace nếu chưa tồn tại
                ensureNamespaceExists(clusterSession, namespace);

                // Apply YAML file vào Kubernetes cluster
                System.out.println("[deployFrontend] Đang apply YAML: kubectl apply -f " + yamlRemotePath);
                executeCommand(clusterSession, "kubectl apply -f '" + yamlRemotePath + "'");
            }

            // ========== BƯỚC 4: CẬP NHẬT TRẠNG THÁI VÀ TRẢ VỀ KẾT QUẢ ==========
            
            // Cập nhật trạng thái project thành RUNNING
            projectEntity.setStatus("RUNNING");
            projectFrontendRepository.save(projectEntity);
            System.out.println("[deployFrontend] Hoàn tất triển khai frontend, projectName=" + projectName + ", domain=" + domainName);

            // Tạo response và trả về
            DeployFrontendResponse response = new DeployFrontendResponse();
            response.setUrl("http://" + domainName);
            response.setStatus(projectEntity.getStatus());
            response.setDomainNameSystem(domainName);
            return response;

        } catch (Exception ex) {
            // ========== XỬ LÝ LỖI ==========
            System.err.println("[deployFrontend] Lỗi: " + ex.getMessage());
            ex.printStackTrace();
            // Cập nhật trạng thái project thành ERROR
            projectEntity.setStatus("ERROR");
            projectFrontendRepository.save(projectEntity);
            throw new RuntimeException("Lỗi khi triển khai frontend: " + ex.getMessage(), ex);
        } finally {
            // ========== DỌN DẸP TÀI NGUYÊN ==========
            // Đảm bảo đóng tất cả các kết nối SSH/SFTP để giải phóng tài nguyên
            if (sftp != null && sftp.isConnected()) sftp.disconnect();
            if (session != null && session.isConnected()) session.disconnect();
            if (sftpYaml != null && sftpYaml.isConnected()) sftpYaml.disconnect();
            if (clusterSession != null && clusterSession.isConnected()) clusterSession.disconnect();
            System.out.println("[deployFrontend] Đã đóng các kết nối SSH/SFTP");
        }
    }
}

