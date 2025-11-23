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
import my_spring_app.my_spring_app.dto.reponse.AdminBackendDetailResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminFrontendDetailResponse;
import my_spring_app.my_spring_app.dto.reponse.DashboardMetricsResponse;
import my_spring_app.my_spring_app.dto.reponse.NodeListResponse;
import my_spring_app.my_spring_app.dto.reponse.NodeResponse;
import my_spring_app.my_spring_app.dto.reponse.NamespaceListResponse;
import my_spring_app.my_spring_app.dto.reponse.NamespaceResponse;
import my_spring_app.my_spring_app.dto.reponse.DeploymentListResponse;
import my_spring_app.my_spring_app.dto.reponse.DeploymentResponse;
import my_spring_app.my_spring_app.dto.reponse.PodListResponse;
import my_spring_app.my_spring_app.dto.reponse.PodResponse;
import my_spring_app.my_spring_app.dto.reponse.StatefulsetListResponse;
import my_spring_app.my_spring_app.dto.reponse.StatefulsetResponse;
import my_spring_app.my_spring_app.dto.reponse.ServiceListResponse;
import my_spring_app.my_spring_app.dto.reponse.ServiceResponse;
import my_spring_app.my_spring_app.dto.reponse.IngressListResponse;
import my_spring_app.my_spring_app.dto.reponse.IngressResponse;
import my_spring_app.my_spring_app.dto.reponse.PVCListResponse;
import my_spring_app.my_spring_app.dto.reponse.PVCResponse;
import my_spring_app.my_spring_app.dto.reponse.PVListResponse;
import my_spring_app.my_spring_app.dto.reponse.PVResponse;
import my_spring_app.my_spring_app.entity.ProjectEntity;
import my_spring_app.my_spring_app.entity.ProjectBackendEntity;
import my_spring_app.my_spring_app.entity.ProjectDatabaseEntity;
import my_spring_app.my_spring_app.entity.ProjectFrontendEntity;
import my_spring_app.my_spring_app.entity.ServerEntity;
import my_spring_app.my_spring_app.entity.UserEntity;
import my_spring_app.my_spring_app.repository.ProjectRepository;
import my_spring_app.my_spring_app.repository.ProjectDatabaseRepository;
import my_spring_app.my_spring_app.repository.ProjectBackendRepository;
import my_spring_app.my_spring_app.repository.ProjectFrontendRepository;
import my_spring_app.my_spring_app.repository.ServerRepository;
import my_spring_app.my_spring_app.repository.UserRepository;
import my_spring_app.my_spring_app.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.ApiException;
import io.kubernetes.client.openapi.Configuration;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import io.kubernetes.client.openapi.apis.AppsV1Api;
import io.kubernetes.client.openapi.apis.NetworkingV1Api;
import io.kubernetes.client.openapi.models.V1ContainerStatus;
import io.kubernetes.client.openapi.models.V1Pod;
import io.kubernetes.client.openapi.models.V1PodStatus;
import io.kubernetes.client.openapi.models.V1Namespace;
import io.kubernetes.client.openapi.models.V1NamespaceStatus;
import io.kubernetes.client.openapi.models.V1Service;
import io.kubernetes.client.openapi.models.V1ServiceSpec;
import io.kubernetes.client.openapi.models.V1ServicePort;
import io.kubernetes.client.openapi.models.V1ServiceStatus;
import io.kubernetes.client.openapi.models.V1Ingress;
import io.kubernetes.client.openapi.models.V1IngressSpec;
import io.kubernetes.client.openapi.models.V1IngressRule;
import io.kubernetes.client.openapi.models.V1IngressStatus;
import io.kubernetes.client.openapi.models.V1IngressLoadBalancerIngress;
import io.kubernetes.client.openapi.models.V1PersistentVolumeClaim;
import io.kubernetes.client.openapi.models.V1PersistentVolumeClaimSpec;
import io.kubernetes.client.openapi.models.V1PersistentVolumeClaimStatus;
import io.kubernetes.client.openapi.models.V1PersistentVolume;
import io.kubernetes.client.openapi.models.V1PersistentVolumeSpec;
import io.kubernetes.client.openapi.models.V1PersistentVolumeStatus;
import io.kubernetes.client.openapi.models.V1ObjectReference;
import io.kubernetes.client.openapi.models.V1StatefulSet;
import io.kubernetes.client.openapi.models.V1StatefulSetStatus;
import io.kubernetes.client.openapi.models.V1StatefulSetCondition;
import io.kubernetes.client.openapi.models.V1Container;
import io.kubernetes.client.openapi.models.V1Deployment;
import io.kubernetes.client.openapi.models.V1DeploymentStatus;
import io.kubernetes.client.openapi.models.V1DeploymentCondition;
import io.kubernetes.client.openapi.models.V1LabelSelector;
import io.kubernetes.client.util.Config;
import java.io.File;
import java.io.FileWriter;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

/**
 * Dịch vụ phục vụ dashboard admin: thống kê tổng quan và usage của từng user.
 * 
 * Class này cung cấp các chức năng:
 * - Lấy tổng quan hệ thống (số user, project, CPU/Memory đang dùng)
 * - Lấy thống kê usage theo từng user
 * - Lấy chi tiết tài nguyên của project (Database/Backend/Frontend)
 * - Lấy thông tin cluster capacity và allocatable
 * - Lấy chi tiết thông tin Kubernetes cho Database/Backend/Frontend
 * 
 * Tất cả các thao tác với Kubernetes được thực hiện qua SSH đến server MASTER.
 */
@Service
@Transactional
public class AdminServiceImpl implements AdminService {

    /**
     * Role chuẩn dùng để lọc user thuộc nhóm khách hàng (không phải admin/devops).
     * Chỉ các user có role "USER" mới được tính vào thống kê.
     */
    private static final String ROLE_USER = "USER";
    
    /**
     * Hằng số quy đổi bytes -> GB (1024^3 = 1,073,741,824 bytes).
     * Sử dụng để chuyển đổi memory từ bytes sang GB để hiển thị.
     */
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

    // Repository thao tác bảng project backend
    @Autowired
    private ProjectBackendRepository projectBackendRepository;

    // Repository thao tác bảng project frontend
    @Autowired
    private ProjectFrontendRepository projectFrontendRepository;

    // Repository lấy thông tin server (MASTER) để chạy kubectl
    @Autowired
    private ServerRepository serverRepository;

    /**
     * Tổng hợp số lượng user, project và tài nguyên CPU/Memory đang sử dụng trên toàn hệ thống.
     * 
     * Quy trình xử lý:
     * 1. Đếm tổng số user có role USER (loại trừ admin/devops)
     * 2. Lấy toàn bộ project từ database và đếm tổng số
     * 3. Gom các namespace đang được sử dụng (tránh trùng lặp)
     * 4. Chạy kubectl top pods để lấy tổng CPU/Memory đang sử dụng
     * 5. Chuyển đổi và làm tròn dữ liệu để trả về
     * 
     * @return AdminOverviewResponse chứa tổng số user, project, CPU cores và Memory GB đang dùng
     */
    @Override
    public AdminOverviewResponse getOverview() {
        // Bước 1: Đếm tổng user có role USER (không bao gồm admin/devops)
        long totalUsers = userRepository.countByRole(ROLE_USER);

        // Bước 2: Lấy toàn bộ project từ database để đếm và gom namespace
        List<ProjectEntity> projects = projectRepository.findAll();
        long totalProjects = projects.size();

        // Bước 3: Gom các namespace đang được sử dụng (loại bỏ trùng lặp)
        Set<String> namespaces = collectNamespaces(projects);

        // Bước 4: Chạy kubectl top pods để lấy tổng CPU/Memory đang sử dụng
        // Hàm này sẽ SSH đến MASTER server và thực thi lệnh kubectl top pods cho từng namespace
        ResourceUsageMap usageMap = calculateUsagePerNamespace(namespaces);

        // Bước 5: Mapping dữ liệu vào response object
        AdminOverviewResponse response = new AdminOverviewResponse();
        response.setTotalUsers(totalUsers);
        response.setTotalProjects(totalProjects);
        // Làm tròn CPU cores và chuyển Memory từ bytes sang GB, làm tròn 3 chữ số thập phân
        response.setTotalCpuCores(roundToThreeDecimals(usageMap.totalUsage().getCpuCores()));
        response.setTotalMemoryGb(roundToThreeDecimals(bytesToGb(usageMap.totalUsage().getMemoryBytes())));
        
        return response;
    }

    /**
     * Lấy tổng quan usage (CPU/Memory) của các project thuộc một user cụ thể.
     * 
     * Quy trình xử lý:
     * 1. Kiểm tra user có tồn tại và có role USER không
     * 2. Lọc các project thuộc về user này
     * 3. Gom các namespace của các project đó
     * 4. Tính tổng CPU/Memory đang sử dụng từ các namespace
     * 5. Trả về thông tin tổng hợp
     * 
     * @param userId ID của user cần lấy thống kê
     * @return AdminUserProjectSummaryResponse chứa thông tin user và tổng CPU/Memory đang dùng
     * @throws RuntimeException nếu user không tồn tại hoặc không có role USER
     */
    @Override
    public AdminUserProjectSummaryResponse getUserProjectSummary(Long userId) {
        // Bước 1: Kiểm tra user có tồn tại không
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user với id " + userId));
        
        // Bước 2: Kiểm tra user có role USER không (chỉ user role USER mới được tính)
        if (!ROLE_USER.equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("User không hợp lệ hoặc không có role USER");
        }

        // Bước 3: Lọc các project thuộc về user này
        List<ProjectEntity> projects = projectRepository.findAll();
        List<ProjectEntity> userProjects = projects.stream()
                .filter(project -> project.getUser() != null && userId.equals(project.getUser().getId()))
                .toList();

        // Bước 4: Gom các namespace của các project này (tránh trùng lặp)
        Set<String> namespaces = collectNamespaces(userProjects);

        // Bước 5: Tính tổng CPU/Memory đang sử dụng từ các namespace
        ResourceUsageMap usageMap = calculateUsagePerNamespace(namespaces);

        // Bước 6: Build response object
        AdminUserProjectSummaryResponse response = new AdminUserProjectSummaryResponse();
        response.setUserId(user.getId());
        response.setFullname(user.getFullname());
        response.setUsername(user.getUsername());
        response.setProjectCount(userProjects.size());
        // Làm tròn CPU cores và chuyển Memory từ bytes sang GB
        response.setCpuCores(roundToThreeDecimals(usageMap.totalUsage().getCpuCores()));
        response.setMemoryGb(roundToThreeDecimals(bytesToGb(usageMap.totalUsage().getMemoryBytes())));
        
        return response;
    }

    /**
     * Lấy danh sách project chi tiết cho một user (số resource theo từng project).
     * 
     * Quy trình xử lý:
     * 1. Kiểm tra user có tồn tại và có role USER không
     * 2. Lọc các project thuộc về user này
     * 3. Gom các namespace và tính usage cho từng namespace
     * 4. Với mỗi project, tạo một item thống kê bao gồm:
     *    - Số lượng Database/Backend/Frontend
     *    - CPU và Memory đang sử dụng (lấy từ namespace của project)
     * 5. Trả về danh sách các project với thông tin chi tiết
     * 
     * @param userId ID của user cần lấy danh sách project
     * @return AdminUserProjectListResponse chứa danh sách project với thông tin chi tiết
     * @throws RuntimeException nếu user không tồn tại hoặc không có role USER
     */
    @Override
    public AdminUserProjectListResponse getUserProjectsDetail(Long userId) {
        // Bước 1: Kiểm tra user có tồn tại không
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user với id " + userId));
        
        // Bước 2: Kiểm tra user có role USER không
        if (!ROLE_USER.equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("User không hợp lệ hoặc không có role USER");
        }

        // Bước 3: Lọc các project thuộc về user này
        List<ProjectEntity> projects = projectRepository.findAll().stream()
                .filter(project -> project.getUser() != null && userId.equals(project.getUser().getId()))
                .toList();

        // Bước 4: Gom các namespace và tính usage cho từng namespace
        Set<String> namespaces = collectNamespaces(projects);
        ResourceUsageMap usageMap = calculateUsagePerNamespace(namespaces);

        // Bước 5: Tạo item thống kê cho từng project
        List<AdminUserProjectListResponse.ProjectUsageItem> items = new ArrayList<>();
        for (ProjectEntity project : projects) {
            // Tạo item thống kê cho project này
            AdminUserProjectListResponse.ProjectUsageItem item = new AdminUserProjectListResponse.ProjectUsageItem();
            item.setProjectId(project.getId());
            item.setProjectName(project.getProjectName());
            
            // Đếm số lượng Database/Backend/Frontend (xử lý null-safe)
            item.setDatabaseCount(project.getDatabases() != null ? project.getDatabases().size() : 0);
            item.setBackendCount(project.getBackends() != null ? project.getBackends().size() : 0);
            item.setFrontendCount(project.getFrontends() != null ? project.getFrontends().size() : 0);

            // Lấy usage từ namespace của project (nếu có)
            ResourceUsage usage = null;
            if (project.getNamespace() != null && !project.getNamespace().trim().isEmpty()) {
                usage = usageMap.namespaceUsage().get(project.getNamespace().trim());
            }
            
            // Tính CPU và Memory (nếu không có usage thì mặc định là 0)
            double cpu = usage != null ? usage.getCpuCores() : 0.0;
            double memoryGb = usage != null ? bytesToGb(usage.getMemoryBytes()) : 0.0;
            
            // Làm tròn và set vào item
            item.setCpuCores(roundToThreeDecimals(cpu));
            item.setMemoryGb(roundToThreeDecimals(memoryGb));
            
            items.add(item);
        }

        // Bước 6: Tạo response object và trả về
        AdminUserProjectListResponse response = new AdminUserProjectListResponse();
        response.setUserId(user.getId());
        response.setFullname(user.getFullname());
        response.setUsername(user.getUsername());
        response.setProjects(items);
        
        return response;
    }

    /**
     * Lấy chi tiết tài nguyên (CPU/Memory) của một project, bao gồm từng Database/Backend/Frontend.
     * 
     * Quy trình xử lý:
     * 1. Kiểm tra project có tồn tại và có namespace không
     * 2. Kết nối SSH đến MASTER server
     * 3. Với mỗi Database/Backend/Frontend trong project:
     *    - Lấy uuid_k8s để tạo app label
     *    - Chạy kubectl top pods với label selector để lấy CPU/Memory
     *    - Cộng dồn vào tổng
     * 4. Trả về chi tiết usage cho từng thành phần và tổng
     * 
     * @param projectId ID của project cần lấy chi tiết
     * @return AdminProjectResourceDetailResponse chứa chi tiết CPU/Memory của từng Database/Backend/Frontend
     * @throws RuntimeException nếu project không tồn tại hoặc không có namespace
     */
    @Override
    public AdminProjectResourceDetailResponse getProjectResourceDetail(Long projectId) {
        
        // Bước 1: Kiểm tra project có tồn tại không
        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy project với id " + projectId));
        
        // Bước 2: Kiểm tra project có namespace không (namespace là bắt buộc để truy vấn Kubernetes)
        String namespace = project.getNamespace();
        if (namespace == null || namespace.trim().isEmpty()) {
            throw new RuntimeException("Project chưa được cấu hình namespace, không thể lấy metrics");
        }
        namespace = namespace.trim();

        // Bước 3: Lấy thông tin server MASTER để kết nối SSH
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        // Bước 4: Khởi tạo response object
        AdminProjectResourceDetailResponse response = new AdminProjectResourceDetailResponse();
        response.setProjectId(project.getId());               // Lưu lại id để FE biết project nào
        response.setProjectName(project.getProjectName());    // Lưu lại tên hiển thị

        // Các list lưu usage chi tiết theo từng nhóm thành phần (Database/Backend/Frontend)
        List<AdminProjectResourceDetailResponse.ComponentUsage> databaseUsages = new ArrayList<>();
        List<AdminProjectResourceDetailResponse.ComponentUsage> backendUsages = new ArrayList<>();
        List<AdminProjectResourceDetailResponse.ComponentUsage> frontendUsages = new ArrayList<>();

        // Biến để cộng dồn tổng CPU và Memory của toàn bộ project
        double totalCpu = 0.0;       // Tổng CPU cộng dồn (đơn vị: cores)
        double totalMemoryGb = 0.0;  // Tổng Memory cộng dồn (đơn vị: GB)

        // Session SSH tới MASTER server để chạy các lệnh kubectl
        Session session = null;
        try {
            // Bước 5: Tạo SSH session và kết nối đến MASTER server
            session = createSession(masterServer);

            // Bước 6: Xử lý các Database trong project
            if (project.getDatabases() != null) {
                for (ProjectDatabaseEntity database : project.getDatabases()) {
                    // Bỏ qua database không có uuid_k8s (chưa được deploy)
                    if (database.getUuid_k8s() == null || database.getUuid_k8s().trim().isEmpty()) {
                        continue;
                    }
                    
                    // Tạo app label theo format: "db-{uuid_k8s}" (format chuẩn khi deploy database)
                    String appLabel = "db-" + database.getUuid_k8s().trim();
                    
                    // Gọi kubectl top pods với label selector để lấy CPU/Memory của các pod có label này
                    ResourceUsage usage = fetchUsageForApp(session, namespace, appLabel);
                    double cpu = usage.getCpuCores();
                    double memoryGb = bytesToGb(usage.getMemoryBytes());

                    // Tạo ComponentUsage object và thêm vào danh sách
                    databaseUsages.add(new AdminProjectResourceDetailResponse.ComponentUsage(
                            database.getId(),
                            database.getProjectName(),
                            database.getStatus(),
                            roundToThreeDecimals(cpu),      // Làm tròn 3 chữ số thập phân
                            roundToThreeDecimals(memoryGb)   // Làm tròn 3 chữ số thập phân
                    ));

                    // Cộng dồn vào tổng
                    totalCpu += cpu;
                    totalMemoryGb += memoryGb;
                }
            }

            // Bước 7: Xử lý các Backend trong project
            if (project.getBackends() != null) {
                for (ProjectBackendEntity backend : project.getBackends()) {
                    // Bỏ qua backend không có uuid_k8s (chưa được deploy)
                    if (backend.getUuid_k8s() == null || backend.getUuid_k8s().trim().isEmpty()) {
                        continue;
                    }
                    
                    // Tạo app label theo format: "app-{uuid_k8s}" (format chuẩn khi deploy backend)
                    String appLabel = "app-" + backend.getUuid_k8s().trim();
                    
                    // Gọi kubectl top pods với label selector để lấy CPU/Memory
                    ResourceUsage usage = fetchUsageForApp(session, namespace, appLabel);
                    double cpu = usage.getCpuCores();
                    double memoryGb = bytesToGb(usage.getMemoryBytes());

                    // Tạo ComponentUsage object và thêm vào danh sách
                    backendUsages.add(new AdminProjectResourceDetailResponse.ComponentUsage(
                            backend.getId(),
                            backend.getProjectName(),
                            backend.getStatus(),
                            roundToThreeDecimals(cpu),
                            roundToThreeDecimals(memoryGb)
                    ));

                    // Cộng dồn vào tổng
                    totalCpu += cpu;
                    totalMemoryGb += memoryGb;
                }
            }

            // Bước 8: Xử lý các Frontend trong project
            if (project.getFrontends() != null) {
                for (ProjectFrontendEntity frontend : project.getFrontends()) {
                    // Bỏ qua frontend không có uuid_k8s (chưa được deploy)
                    if (frontend.getUuid_k8s() == null || frontend.getUuid_k8s().trim().isEmpty()) {
                        continue;
                    }
                    
                    // Tạo app label theo format: "app-{uuid_k8s}" (format chuẩn khi deploy frontend, giống backend)
                    String appLabel = "app-" + frontend.getUuid_k8s().trim();
                    
                    // Gọi kubectl top pods với label selector để lấy CPU/Memory
                    ResourceUsage usage = fetchUsageForApp(session, namespace, appLabel);
                    double cpu = usage.getCpuCores();
                    double memoryGb = bytesToGb(usage.getMemoryBytes());

                    // Tạo ComponentUsage object và thêm vào danh sách
                    frontendUsages.add(new AdminProjectResourceDetailResponse.ComponentUsage(
                            frontend.getId(),
                            frontend.getProjectName(),
                            frontend.getStatus(),
                            roundToThreeDecimals(cpu),
                            roundToThreeDecimals(memoryGb)
                    ));

                    // Cộng dồn vào tổng
                    totalCpu += cpu;
                    totalMemoryGb += memoryGb;
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy metrics cho project: " + e.getMessage(), e);
        } finally {
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }

        // 4. Tổng hợp dữ liệu trả về
        response.setDatabases(databaseUsages);
        response.setBackends(backendUsages);
        response.setFrontends(frontendUsages);
        response.setTotalCpuCores(roundToThreeDecimals(totalCpu));
        response.setTotalMemoryGb(roundToThreeDecimals(totalMemoryGb));
        return response;
    }

    /**
     * Lấy usage tổng quan cho từng user (số project, CPU, Memory).
     * 
     * Quy trình xử lý:
     * 1. Khởi tạo map chứa thống kê cho từng user có role USER
     * 2. Duyệt tất cả project, đếm số project và ghi lại namespace thuộc user nào
     * 3. Gom các namespace và tính usage cho từng namespace
     * 4. Phân bổ usage của namespace về user sở hữu namespace đó
     * 5. Làm tròn dữ liệu và trả về
     * 
     * @return AdminUserUsageResponse chứa danh sách user với thống kê usage
     */
    @Override
    public AdminUserUsageResponse getUserResourceOverview() {
        // Bước 1: Chuẩn bị map chứa thống kê cho từng user có role USER
        List<UserEntity> users = userRepository.findAll();
        Map<Long, AdminUserUsageResponse.UserUsageItem> userStats = new HashMap<>(); // Map userId -> usage tổng hợp
        
        for (UserEntity user : users) {
            // Chỉ xử lý user có role USER (bỏ qua admin/devops)
            if (!ROLE_USER.equalsIgnoreCase(user.getRole())) {
                continue;
            }
            
            // Khởi tạo UserUsageItem với giá trị mặc định (0 project, 0 CPU, 0 Memory)
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

        // Bước 2: Với mỗi project, tăng số dự án và ghi lại namespace thuộc user nào
        List<ProjectEntity> projects = projectRepository.findAll();
        Set<String> namespaces = new HashSet<>();          // Tập namespace cần truy vấn metrics (loại bỏ trùng)
        Map<String, Long> namespaceOwner = new HashMap<>(); // Map namespace -> userId sở hữu (để phân bổ usage)
        
        for (ProjectEntity project : projects) {
            UserEntity owner = project.getUser();
            // Bỏ qua project không có owner
            if (owner == null) {
                continue;
            }
            
            // Lấy UserUsageItem của owner
            AdminUserUsageResponse.UserUsageItem item = userStats.get(owner.getId());
            // Nếu owner không có trong userStats (không phải role USER), bỏ qua
            if (item == null) {
                continue;
            }
            
            // Tăng số project của user
            item.setProjectCount(item.getProjectCount() + 1);

            // Nếu project có namespace, thêm vào danh sách và ghi lại owner
            if (project.getNamespace() != null && !project.getNamespace().trim().isEmpty()) {
                String namespace = project.getNamespace().trim();
                namespaces.add(namespace);
                namespaceOwner.put(namespace, owner.getId());
            }
        }

        // Bước 3: Lấy metrics từng namespace rồi cộng ngược vào user tương ứng
        ResourceUsageMap usageMap = calculateUsagePerNamespace(namespaces);
        
        // Phân bổ usage của từng namespace về user sở hữu namespace đó
        usageMap.namespaceUsage().forEach((namespace, usage) -> {
            Long ownerId = namespaceOwner.get(namespace);
            if (ownerId == null) {
                return;
            }
            
            AdminUserUsageResponse.UserUsageItem item = userStats.get(ownerId);
            if (item != null) {
                // Cộng dồn CPU và Memory vào user
                item.setCpuCores(item.getCpuCores() + usage.getCpuCores());
                item.setMemoryGb(item.getMemoryGb() + bytesToGb(usage.getMemoryBytes()));
            }
        });

        // Bước 4: Làm tròn CPU và Memory cho từng user (3 chữ số thập phân)
        userStats.values().forEach(item -> {
            item.setCpuCores(roundToThreeDecimals(item.getCpuCores()));
            item.setMemoryGb(roundToThreeDecimals(item.getMemoryGb()));
        });

        // Bước 5: Tạo response và trả về
        AdminUserUsageResponse response = new AdminUserUsageResponse();
        response.setUsers(new ArrayList<>(userStats.values()));
        
        return response;
    }

    /**
     * Gom danh sách namespace từ list project để tránh gọi lặp lại.
     * 
     * Mục đích: Khi có nhiều project cùng sử dụng một namespace, ta chỉ cần truy vấn metrics một lần
     * thay vì truy vấn nhiều lần cho cùng namespace. Điều này giúp tối ưu hiệu suất.
     * 
     * Logic xử lý:
     * 1. Khởi tạo Set để tự động loại bỏ namespace trùng lặp
     * 2. Duyệt từng project trong danh sách
     * 3. Kiểm tra project có namespace hợp lệ (không null, không rỗng) không
     * 4. Nếu có, thêm namespace vào Set (đã trim để loại bỏ khoảng trắng thừa)
     * 5. Trả về Set các namespace duy nhất
     * 
     * @param projects Danh sách các project cần lấy namespace
     * @return Set<String> chứa các namespace duy nhất (không trùng lặp)
     */
    private Set<String> collectNamespaces(List<ProjectEntity> projects) {
        // Bước 1: Khởi tạo Set để tự động loại bỏ namespace trùng lặp
        Set<String> namespaces = new HashSet<>();
        
        // Bước 2: Duyệt từng project và thêm namespace hợp lệ vào Set
        for (ProjectEntity project : projects) {
            // Kiểm tra project có namespace hợp lệ không (không null và không rỗng)
            if (project.getNamespace() != null && !project.getNamespace().trim().isEmpty()) {
                String namespace = project.getNamespace().trim(); // Trim để loại bỏ khoảng trắng thừa
                namespaces.add(namespace);
            }
        }
        
        // Bước 3: Trả về Set các namespace duy nhất
        return namespaces;
    }

    /**
     * Chạy kubectl top pods cho danh sách namespace để thu thập CPU/Memory.
     * Kết quả trả về cả tổng usage và usage theo từng namespace.
     * 
     * Quy trình xử lý:
     * 1. Kiểm tra danh sách namespace có rỗng không
     * 2. Kết nối SSH đến MASTER server
     * 3. Với mỗi namespace:
     *    - Chạy lệnh: kubectl top pods -n {namespace} --no-headers
     *    - Parse output để lấy CPU và Memory của từng pod
     *    - Cộng dồn vào tổng và vào namespace tương ứng
     * 4. Trả về ResourceUsageMap chứa tổng usage và usage theo namespace
     * 
     * @param namespaces Set các namespace cần truy vấn metrics
     * @return ResourceUsageMap chứa tổng usage và usage theo từng namespace
     */
    private ResourceUsageMap calculateUsagePerNamespace(Set<String> namespaces) {
        // Khởi tạo các biến để lưu kết quả
        ResourceUsage totalUsage = new ResourceUsage();  // Tổng usage của tất cả namespace
        Map<String, ResourceUsage> namespaceUsage = new HashMap<>();  // Usage theo từng namespace

        // Nếu không có namespace nào, trả về kết quả rỗng
        if (namespaces.isEmpty()) {
            return new ResourceUsageMap(totalUsage, namespaceUsage);
        }

        // Lấy thông tin server MASTER để kết nối SSH
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        Session clusterSession = null;
        try {
            // Tạo SSH session và kết nối đến MASTER server
            clusterSession = createSession(masterServer);
            
            // Bước 1: Lặp qua từng namespace để gọi kubectl top pods
            for (String namespace : namespaces) {
                try {
                    // Tạo lệnh kubectl top pods cho namespace này (--no-headers để bỏ dòng header)
                    String cmd = String.format("kubectl top pods -n %s --no-headers", namespace);
                    
                    // Thực thi lệnh (ignoreNonZeroExit=true để không throw exception nếu lệnh fail)
                    String output = executeCommand(clusterSession, cmd, true);
                    
                    // Nếu không có output (namespace không có pod hoặc lỗi), bỏ qua
                    if (output == null || output.trim().isEmpty()) {
                        continue;
                    }
                    
                    // Chia output thành các dòng (mỗi dòng là một pod)
                    String[] lines = output.split("\\r?\\n");
                    
                    // Bước 2: Parse từng dòng output để lấy CPU và Memory
                    for (String line : lines) {
                        line = line.trim();
                        // Bỏ qua dòng rỗng
                        if (line.isEmpty()) {
                            continue;
                        }
                        
                        // Chia dòng thành các phần: [pod-name] [CPU] [Memory]
                        String[] parts = line.split("\\s+");
                        if (parts.length < 3) {
                            continue;
                        }
                        
                        try {
                            // Parse CPU từ phần thứ 2 (có thể là "15m", "0.2", etc.)
                            double cpu = parseCpuCores(parts[1]);
                            // Parse Memory từ phần thứ 3 (có thể là "100Mi", "2Gi", etc.)
                            long memory = parseMemoryBytes(parts[2]);

                            // Cộng dồn vào tổng usage
                            totalUsage.addCpu(cpu).addMemory(memory);
                            
                            // Cộng dồn vào usage của namespace này
                            // computeIfAbsent: nếu namespace chưa có trong map, tạo mới ResourceUsage
                            namespaceUsage
                                    .computeIfAbsent(namespace, key -> new ResourceUsage())
                                    .addCpu(cpu)
                                    .addMemory(memory);
                        } catch (NumberFormatException ex) {
                            // Nếu không parse được, log lỗi nhưng tiếp tục xử lý pod khác
                        }
                    }
                } catch (Exception e) {
                    // Nếu lỗi khi xử lý một namespace, log nhưng tiếp tục xử lý namespace khác
                }
            }
        } catch (Exception e) {
            // Lỗi khi kết nối SSH hoặc lỗi chung
        } finally {
            // Đảm bảo đóng SSH session
            if (clusterSession != null && clusterSession.isConnected()) {
                clusterSession.disconnect();
            }
        }

        return new ResourceUsageMap(totalUsage, namespaceUsage);
    }

    /**
     * Lấy metrics CPU/Memory cho một nhóm pod theo label "app".
     * Hàm này giúp tái sử dụng logic kubectl top pods -l app=<label>.
     * 
     * Mục đích: Lấy tổng CPU và Memory của tất cả pod có label app={appLabel} trong namespace.
     * Được sử dụng để lấy metrics cho một Database/Backend/Frontend cụ thể.
     * 
     * Quy trình xử lý:
     * 1. Kiểm tra tham số đầu vào hợp lệ
     * 2. Chạy lệnh: kubectl top pods -n {namespace} -l app={appLabel} --no-headers
     * 3. Parse output để lấy CPU và Memory của từng pod
     * 4. Cộng dồn vào ResourceUsage và trả về
     * 
     * @param session SSH session đã kết nối đến MASTER server
     * @param namespace Namespace chứa các pod cần truy vấn
     * @param appLabel Label "app" để filter pod (ví dụ: "db-abc123", "app-xyz789")
     * @return ResourceUsage chứa tổng CPU (cores) và Memory (bytes) của các pod thỏa label
     */
    private ResourceUsage fetchUsageForApp(Session session, String namespace, String appLabel) {
        // Khởi tạo ResourceUsage rỗng (CPU=0, Memory=0)
        ResourceUsage usage = new ResourceUsage();
        
        // Kiểm tra tham số đầu vào hợp lệ
        if (session == null || namespace == null || namespace.isBlank() || appLabel == null || appLabel.isBlank()) {
            return usage;
        }
        
        try {
            // Tạo lệnh kubectl top pods với label selector
            // -l app={appLabel}: chỉ lấy pod có label app={appLabel}
            // --no-headers: bỏ dòng header để dễ parse
            String cmd = String.format("kubectl top pods -n %s -l app=%s --no-headers", namespace, appLabel);
            
            // Thực thi lệnh (ignoreNonZeroExit=true để không throw exception nếu không có pod)
            String output = executeCommand(session, cmd, true);
            
            // Nếu không có output (không có pod thỏa label), trả về usage rỗng
            if (output == null || output.trim().isEmpty()) {
                return usage;
            }
            
            // Chia output thành các dòng (mỗi dòng là một pod)
            String[] lines = output.split("\\r?\\n");
            
            // Bước 1: Lặp qua từng pod thỏa label để parse CPU và Memory
            for (String line : lines) {
                line = line.trim();
                // Bỏ qua dòng rỗng
                if (line.isEmpty()) {
                    continue;
                }
                
                // Chia dòng thành các phần: [pod-name] [CPU] [Memory]
                String[] parts = line.split("\\s+");
                if (parts.length < 3) {
                    continue;
                }
                
                // Parse CPU và Memory từ output
                double cpu = parseCpuCores(parts[1]);
                long memory = parseMemoryBytes(parts[2]);
                
                // Cộng dồn vào usage
                usage.addCpu(cpu).addMemory(memory);
            }
        } catch (Exception e) {
            // Nếu có lỗi, log nhưng vẫn trả về usage (có thể là 0 nếu chưa parse được gì)
        }
        return usage;
    }

    /**
     * Mở SSH session tới server MASTER để chạy lệnh kubectl.
     * 
     * Quy trình xử lý:
     * 1. Tạo JSch object để quản lý SSH connection
     * 2. Tạo session với thông tin đăng nhập (username, IP, port)
     * 3. Set password cho authentication
     * 4. Cấu hình session (tắt StrictHostKeyChecking để không cần xác nhận host key)
     * 5. Set timeout 7 giây
     * 6. Kết nối thực tế đến server
     * 
     * @param server ServerEntity chứa thông tin server MASTER (IP, port, username, password)
     * @return Session đã kết nối thành công, sẵn sàng để thực thi lệnh
     * @throws Exception nếu không thể kết nối (sai thông tin đăng nhập, server không khả dụng, etc.)
     */
    private Session createSession(ServerEntity server) throws Exception {
        // Bước 1: Tạo JSch object để quản lý SSH connection
        JSch jsch = new JSch();
        
        // Bước 2: Tạo session với thông tin đăng nhập server
        Session session = jsch.getSession(server.getUsername(), server.getIp(), server.getPort());
        
        // Bước 3: Set password cho authentication
        session.setPassword(server.getPassword());
        
        // Bước 4: Cấu hình session
        Properties config = new Properties();
        config.put("StrictHostKeyChecking", "no");  // Tắt kiểm tra host key (cho phép kết nối mà không cần xác nhận)
        session.setConfig(config);
        session.setTimeout(7000);  // Timeout 7 giây
        
        // Bước 5: Kết nối thực tế đến server
        session.connect();
        
        return session;
    }

    /**
     * Thực thi lệnh shell trên server MASTER thông qua SSH.
     * 
     * Quy trình xử lý:
     * 1. Mở channel "exec" để thực thi lệnh
     * 2. Set lệnh cần thực thi
     * 3. Redirect stderr để log lỗi
     * 4. Kết nối channel và bắt đầu thực thi
     * 5. Đọc output từ inputStream liên tục cho đến khi lệnh kết thúc
     * 6. Kiểm tra exit status và xử lý lỗi nếu cần
     * 7. Đóng channel và trả về output
     * 
     * @param session SSH session đã kết nối
     * @param command Lệnh shell cần thực thi (ví dụ: "kubectl get pods -n default")
     * @param ignoreNonZeroExit Nếu true, không throw exception khi lệnh trả về exit code != 0 (chỉ log)
     * @return String chứa output của lệnh (đã trim)
     * @throws Exception nếu có lỗi khi thực thi hoặc exit code != 0 và ignoreNonZeroExit=false
     */
    private String executeCommand(Session session, String command, boolean ignoreNonZeroExit) throws Exception {
        ChannelExec channelExec = null;

        try {
            // Bước 1: Mở channel "exec" để thực thi lệnh shell
            channelExec = (ChannelExec) session.openChannel("exec");
            
            // Bước 2: Set lệnh cần thực thi
            channelExec.setCommand(command);
            
            // Bước 3: Redirect stderr để log lỗi ra console
            channelExec.setErrStream(System.err);

            // Bước 4: Lấy inputStream để đọc output của lệnh
            InputStream inputStream = channelExec.getInputStream();
            
            // Bước 5: Kết nối channel và bắt đầu thực thi lệnh
            channelExec.connect();

            // Bước 6: Đọc output từ inputStream
            StringBuilder output = new StringBuilder();
            byte[] buffer = new byte[1024];  // Buffer 1KB để đọc dữ liệu

            // Vòng lặp đọc output cho đến khi lệnh kết thúc hoàn toàn
            while (true) {
                // Đọc liên tục tất cả dữ liệu có sẵn trong inputStream
                while (inputStream.available() > 0) {
                    int bytesRead = inputStream.read(buffer, 0, 1024);
                    if (bytesRead < 0) {
                        break;  // Không còn dữ liệu để đọc
                    }
                    // Chuyển đổi bytes sang String (UTF-8) và append vào output
                    output.append(new String(buffer, 0, bytesRead, StandardCharsets.UTF_8));
                }

                // Kiểm tra channel đã đóng chưa (lệnh đã kết thúc)
                if (channelExec.isClosed()) {
                    // Nếu vẫn còn dữ liệu trong inputStream, tiếp tục đọc
                    if (inputStream.available() > 0) {
                        continue;
                    }
                    // Nếu không còn dữ liệu, thoát vòng lặp
                    break;
                }

                // Nghỉ 100ms trước khi kiểm tra lại (tránh busy waiting)
                Thread.sleep(100);
            }

            // Bước 7: Lấy exit status của lệnh (0 = thành công, != 0 = lỗi)
            int exitStatus = channelExec.getExitStatus();
            String result = output.toString().trim();

            // Bước 8: Xử lý exit status
            if (exitStatus != 0) {
                if (ignoreNonZeroExit) {
                    // Nếu cho phép ignore, bỏ qua lỗi (không throw exception)
                } else {
                    // Nếu không cho phép ignore, throw exception
                    throw new RuntimeException("Command exited with status: " + exitStatus + ". Output: " + result);
                }
            }

            return result;

        } finally {
            // Bước 9: Đảm bảo đóng channel dù có lỗi hay không
            if (channelExec != null && channelExec.isConnected()) {
                channelExec.disconnect();
            }
        }
    }

    /**
     * Parse chuỗi CPU từ kubectl về đơn vị cores (double).
     * 
     * Kubernetes có thể trả về CPU theo 2 định dạng:
     * - Millicores: "15m", "3950m" (m = millicores, 1000m = 1 core)
     * - Cores: "0.2", "4", "1.5" (số cores trực tiếp)
     * 
     * Logic xử lý:
     * 1. Kiểm tra chuỗi có rỗng không
     * 2. Chuyển về lowercase để xử lý
     * 3. Nếu kết thúc bằng "m" → millicores, chia cho 1000 để chuyển sang cores
     * 4. Nếu không → cores trực tiếp, parse thành double
     * 
     * Ví dụ:
     * - "15m" → 0.015 cores
     * - "3950m" → 3.95 cores
     * - "0.2" → 0.2 cores
     * - "4" → 4.0 cores
     * 
     * @param cpuStr Chuỗi CPU từ kubectl (ví dụ: "15m", "0.2", "3950m")
     * @return double số cores (ví dụ: 0.015, 0.2, 3.95)
     */
    private double parseCpuCores(String cpuStr) {
        // Kiểm tra chuỗi rỗng
        if (cpuStr == null || cpuStr.isEmpty()) {
            return 0.0;
        }
        
        // Chuyển về lowercase và trim để xử lý
        cpuStr = cpuStr.trim().toLowerCase();
        
        // Kiểm tra nếu là millicores (kết thúc bằng "m")
        if (cpuStr.endsWith("m")) {
            // Lấy phần số (bỏ ký tự "m" cuối)
            String value = cpuStr.substring(0, cpuStr.length() - 1);
            // Chuyển millicores sang cores: chia cho 1000
            return Double.parseDouble(value) / 1000.0;
        }
        
        // Nếu không có "m", đó là cores trực tiếp
        return Double.parseDouble(cpuStr);
    }

    /**
     * Parse chuỗi Memory từ kubectl và trả về bytes.
     * 
     * Kubernetes có thể trả về Memory theo nhiều định dạng:
     * - Binary units (1024-based): Ki (Kibibytes), Mi (Mebibytes), Gi (Gibibytes), Ti (Tebibytes)
     * - Decimal units (1000-based): K (Kilobytes), M (Megabytes), G (Gigabytes)
     * - Không có đơn vị: được coi là bytes
     * 
     * Logic xử lý:
     * 1. Kiểm tra chuỗi rỗng
     * 2. Chuyển về uppercase để xử lý
     * 3. Kiểm tra đơn vị (KI, MI, GI, TI, K, M, G)
     * 4. Tính factor tương ứng (số bytes trong 1 đơn vị)
     * 5. Lấy phần số (bỏ đơn vị)
     * 6. Nhân số với factor để chuyển sang bytes
     * 
     * Ví dụ:
     * - "100Ki" → 100 * 1024 = 102,400 bytes
     * - "512Mi" → 512 * 1024^2 = 536,870,912 bytes
     * - "2Gi" → 2 * 1024^3 = 2,147,483,648 bytes
     * - "1G" → 1 * 1000^3 = 1,000,000,000 bytes
     * 
     * @param memStr Chuỗi Memory từ kubectl (ví dụ: "100Mi", "2Gi", "512Ki")
     * @return long số bytes tương ứng
     */
    private long parseMemoryBytes(String memStr) {
        // Kiểm tra chuỗi rỗng
        if (memStr == null || memStr.isEmpty()) {
            return 0L;
        }
        
        // Chuyển về uppercase và trim để xử lý
        memStr = memStr.trim().toUpperCase();

        // Khởi tạo factor mặc định là 1 (nếu không có đơn vị, coi là bytes)
        long factor = 1L;
        String numericPart = memStr;

        // Kiểm tra các đơn vị binary (1024-based) - thường dùng trong Kubernetes
        if (memStr.endsWith("KI")) {
            // Kibibytes: 1 Ki = 1024 bytes
            factor = 1024L;
            numericPart = memStr.substring(0, memStr.length() - 2);
        } else if (memStr.endsWith("MI")) {
            // Mebibytes: 1 Mi = 1024^2 = 1,048,576 bytes
            factor = 1024L * 1024L;
            numericPart = memStr.substring(0, memStr.length() - 2);
        } else if (memStr.endsWith("GI")) {
            // Gibibytes: 1 Gi = 1024^3 = 1,073,741,824 bytes
            factor = 1024L * 1024L * 1024L;
            numericPart = memStr.substring(0, memStr.length() - 2);
        } else if (memStr.endsWith("TI")) {
            // Tebibytes: 1 Ti = 1024^4 = 1,099,511,627,776 bytes
            factor = 1024L * 1024L * 1024L * 1024L;
            numericPart = memStr.substring(0, memStr.length() - 2);
        } 
        // Kiểm tra các đơn vị decimal (1000-based) - ít dùng hơn
        else if (memStr.endsWith("K")) {
            // Kilobytes: 1 K = 1000 bytes
            factor = 1000L;
            numericPart = memStr.substring(0, memStr.length() - 1);
        } else if (memStr.endsWith("M")) {
            // Megabytes: 1 M = 1,000,000 bytes
            factor = 1000L * 1000L;
            numericPart = memStr.substring(0, memStr.length() - 1);
        } else if (memStr.endsWith("G")) {
            // Gigabytes: 1 G = 1,000,000,000 bytes
            factor = 1000L * 1000L * 1000L;
            numericPart = memStr.substring(0, memStr.length() - 1);
        }
        // Nếu không có đơn vị, factor = 1 (coi là bytes)

        // Bước 2: Parse phần số và nhân với factor để chuyển về bytes
        double value = Double.parseDouble(numericPart);
        return (long) (value * factor);
    }

    /**
     * Chuyển đổi bytes sang GB (Gigabytes).
     * 
     * Sử dụng hệ số quy đổi binary: 1 GB = 1024^3 bytes = 1,073,741,824 bytes
     * 
     * @param bytes Số bytes cần chuyển đổi
     * @return double số GB tương ứng (có thể có phần thập phân)
     */
    private double bytesToGb(long bytes) {
        // 1 GB = 1024^3 bytes = BYTES_PER_GB
        return bytes / BYTES_PER_GB;
    }

    /**
     * Parse Quantity object từ Kubernetes và chuyển sang GB (Gigabytes).
     * 
     * Quantity trong Kubernetes có thể có format khác nhau:
     * - BINARY_SI: Binary units (1024-based) - number đã là bytes
     * - DECIMAL_SI: Decimal units (1000-based) - number đã là bytes
     * 
     * Logic:
     * 1. Parse từ toString() của Quantity object (format: "Quantity{number=1073741824, format=BINARY_SI}")
     * 2. Lấy number từ string (đã là bytes)
     * 3. Chuyển sang GB bằng bytesToGb()
     * 4. Format thành string với "GB"
     * 
     * @param quantity Quantity object từ Kubernetes (có thể là Object)
     * @return String capacity dạng "X.XXX GB" hoặc "" nếu quantity null
     */
    private String parseQuantityToGB(Object quantity) {
        if (quantity == null) {
            return "";
        }
        
        try {
            // Parse từ toString() của Quantity object
            // Format: "Quantity{number=1073741824, format=BINARY_SI}"
            String quantityStr = quantity.toString();
            
            // Extract number từ string: "Quantity{number=1073741824, format=...}"
            // Pattern: number=(\d+)
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("number=(-?\\d+)");
            java.util.regex.Matcher matcher = pattern.matcher(quantityStr);
            
            if (matcher.find()) {
                String numberStr = matcher.group(1);
                long bytes = Long.parseLong(numberStr);
                
                // Chuyển sang GB
                double gb = bytesToGb(bytes);
                
                // Làm tròn đến 3 chữ số thập phân và format
                double roundedGb = roundToThreeDecimals(gb);
                
                // Format thành string với "GB", loại bỏ số 0 thừa
                String result = String.format("%.3f GB", roundedGb);
                return result.replaceAll("\\.?0+ GB$", " GB");
            } else {
                // Nếu không parse được, thử parse trực tiếp từ string (có thể đã là format khác)
                // Ví dụ: "1Gi", "1073741824", etc.
                return "";
            }
        } catch (Exception e) {
            // Nếu có lỗi, trả về empty string
            return "";
        }
    }

    /**
     * Làm tròn số về 3 chữ số thập phân.
     * 
     * Mục đích: Giữ format hiển thị gọn gàng, dễ đọc (ví dụ: 1.234 thay vì 1.23456789)
     * 
     * Logic: Nhân với 1000, làm tròn, rồi chia lại cho 1000
     * 
     * Ví dụ:
     * - 1.23456789 → 1.235
     * - 0.123456 → 0.123
     * - 5.0 → 5.0
     * 
     * @param value Số cần làm tròn
     * @return double đã làm tròn đến 3 chữ số thập phân
     */
    private double roundToThreeDecimals(double value) {
        // Giữ tối đa 3 chữ số thập phân để hiển thị gọn hơn
        // Math.round(value * 1000d) làm tròn đến số nguyên gần nhất
        // Chia cho 1000d để có lại số thập phân với 3 chữ số
        return Math.round(value * 1000d) / 1000d;
    }

    /**
     * DTO nội bộ lưu trữ CPU/Memory dạng số để dễ cộng dồn.
     * 
     * Class này được sử dụng để:
     * - Lưu trữ CPU (cores) và Memory (bytes) dưới dạng số để dễ tính toán
     * - Hỗ trợ method chaining để cộng dồn giá trị một cách tiện lợi
     * - Tái sử dụng trong nhiều method để tính tổng usage
     * 
     * Các field:
     * - cpuCores: Tổng CPU cores (double, có thể có phần thập phân)
     * - memoryBytes: Tổng Memory bytes (long, số nguyên)
     */
    private static class ResourceUsage {
        /**
         * Tổng CPU cores đang sử dụng.
         * Đơn vị: cores (có thể có phần thập phân, ví dụ: 1.5 cores)
         */
        private double cpuCores = 0.0;
        
        /**
         * Tổng Memory bytes đang sử dụng.
         * Đơn vị: bytes (số nguyên, ví dụ: 1073741824 bytes = 1 GB)
         */
        private long memoryBytes = 0L;

        /**
         * Cộng thêm CPU cores vào tổng hiện tại.
         * 
         * @param cores Số cores cần cộng thêm
         * @return ResourceUsage chính nó để hỗ trợ method chaining
         */
        public ResourceUsage addCpu(double cores) {
            this.cpuCores += cores;
            return this;
        }

        /**
         * Cộng thêm Memory bytes vào tổng hiện tại.
         * 
         * @param bytes Số bytes cần cộng thêm
         * @return ResourceUsage chính nó để hỗ trợ method chaining
         */
        public ResourceUsage addMemory(long bytes) {
            this.memoryBytes += bytes;
            return this;
        }

        /**
         * Lấy tổng CPU cores.
         * 
         * @return double tổng CPU cores
         */
        public double getCpuCores() {
            return cpuCores;
        }

        /**
         * Lấy tổng Memory bytes.
         * 
         * @return long tổng Memory bytes
         */
        public long getMemoryBytes() {
            return memoryBytes;
        }
    }

    /**
     * Record gom tổng usage và usage theo từng namespace để tái sử dụng ở nhiều hàm.
     * 
     * Record này chứa:
     * - totalUsage: ResourceUsage chứa tổng CPU/Memory của tất cả namespace
     * - namespaceUsage: Map<String, ResourceUsage> chứa CPU/Memory theo từng namespace
     * 
     * Mục đích: Tránh phải truy vấn Kubernetes nhiều lần cho cùng một tập namespace.
     * Một lần tính toán có thể được sử dụng cho nhiều mục đích khác nhau.
     * 
     * @param totalUsage Tổng usage của tất cả namespace cộng lại
     * @param namespaceUsage Map namespace -> ResourceUsage của namespace đó
     */
    private record ResourceUsageMap(ResourceUsage totalUsage, Map<String, ResourceUsage> namespaceUsage) {
    }

    /**
     * Lấy tổng CPU và RAM capacity (tổng dung lượng) của cluster từ kubectl get nodes.
     * 
     * Capacity là tổng tài nguyên vật lý của cluster (tất cả node cộng lại).
     * 
     * Quy trình xử lý:
     * 1. Kết nối SSH đến MASTER server
     * 2. Chạy lệnh: kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU:.status.capacity.cpu,RAM:.status.capacity.memory
     * 3. Parse output để lấy CPU và Memory của từng node
     * 4. Cộng dồn tất cả node để có tổng capacity
     * 5. Chuyển đổi và làm tròn dữ liệu
     * 
     * @return ClusterCapacityResponse chứa tổng CPU cores và Memory GB của cluster
     * @throws RuntimeException nếu không thể kết nối MASTER hoặc lỗi khi thực thi lệnh
     */
    @Override
    public ClusterCapacityResponse getClusterCapacity() {
        // Lấy thông tin server MASTER
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        Session session = null;
        try {
            // Kết nối SSH đến MASTER server
            session = createSession(masterServer);
            
            // Tạo lệnh kubectl get nodes với custom columns để lấy CPU và Memory capacity
            // Output format: NAME    CPU    RAM
            //                node1   4      8Gi
            //                node2   4      8Gi
            String command = "kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU:.status.capacity.cpu,RAM:.status.capacity.memory";
            
            // Thực thi lệnh (ignoreNonZeroExit=false vì lệnh này phải thành công)
            String output = executeCommand(session, command, false);

            // Khởi tạo biến để cộng dồn
            double totalCpu = 0.0;        // Tổng CPU cores
            long totalMemoryBytes = 0L;   // Tổng Memory bytes

            // Parse output nếu có
            if (output != null && !output.trim().isEmpty()) {
                String[] lines = output.split("\\r?\\n");
                
                // Bỏ qua dòng header (dòng đầu tiên: "NAME    CPU    RAM")
                for (int i = 1; i < lines.length; i++) {
                    String line = lines[i].trim();
                    if (line.isEmpty()) {
                        continue;
                    }
                    
                    // Parse dòng: node-name   4   8Gi
                    // Format: [node-name] [CPU] [Memory]
                    String[] parts = line.split("\\s+");
                    if (parts.length >= 3) {
                        try {
                            // CPU có thể là số nguyên (cores) hoặc millicores (3950m)
                            double cpu = parseCpuCores(parts[1]);
                            // RAM có thể là 8Gi, 16Gi, etc.
                            long memoryBytes = parseMemoryBytes(parts[2]);
                            
                            // Cộng dồn vào tổng
                            totalCpu += cpu;
                            totalMemoryBytes += memoryBytes;
                        } catch (NumberFormatException e) {
                        }
                    }
                }
            }

            // Tạo response và set dữ liệu
            ClusterCapacityResponse response = new ClusterCapacityResponse();
            response.setTotalCpuCores(roundToThreeDecimals(totalCpu));
            response.setTotalMemoryGb(roundToThreeDecimals(bytesToGb(totalMemoryBytes)));
            
            return response;

        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy cluster capacity: " + e.getMessage(), e);
        } finally {
            // Đảm bảo đóng SSH session
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * Lấy tổng CPU và RAM allocatable (khả dụng) của cluster từ kubectl get nodes.
     * 
     * Allocatable là tài nguyên khả dụng sau khi trừ đi phần dành cho hệ thống (system reserved).
     * Thường nhỏ hơn capacity vì một phần tài nguyên được dành cho OS và các thành phần hệ thống.
     * 
     * Quy trình xử lý:
     * 1. Kết nối SSH đến MASTER server
     * 2. Chạy lệnh: kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU_ALLOC:.status.allocatable.cpu,RAM_ALLOC:.status.allocatable.memory
     * 3. Parse output để lấy CPU và Memory allocatable của từng node
     * 4. Cộng dồn tất cả node để có tổng allocatable
     * 5. Chuyển đổi và làm tròn dữ liệu
     * 
     * @return ClusterAllocatableResponse chứa tổng CPU cores và Memory GB allocatable của cluster
     * @throws RuntimeException nếu không thể kết nối MASTER hoặc lỗi khi thực thi lệnh
     */
    @Override
    public ClusterAllocatableResponse getClusterAllocatable() {
        
        // Lấy thông tin server MASTER
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        Session session = null;
        try {
            // Kết nối SSH đến MASTER server
            session = createSession(masterServer);
            
            // Tạo lệnh kubectl get nodes với custom columns để lấy CPU và Memory allocatable
            // Output format: NAME    CPU_ALLOC    RAM_ALLOC
            //                node1   3950m        16Gi
            //                node2   3950m        16Gi
            String command = "kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU_ALLOC:.status.allocatable.cpu,RAM_ALLOC:.status.allocatable.memory";
            
            // Thực thi lệnh (ignoreNonZeroExit=false vì lệnh này phải thành công)
            String output = executeCommand(session, command, false);

            // Khởi tạo biến để cộng dồn
            double totalCpu = 0.0;        // Tổng CPU cores allocatable
            long totalMemoryBytes = 0L;   // Tổng Memory bytes allocatable

            // Parse output nếu có
            if (output != null && !output.trim().isEmpty()) {
                String[] lines = output.split("\\r?\\n");
                
                // Bỏ qua dòng header (dòng đầu tiên: "NAME    CPU_ALLOC    RAM_ALLOC")
                for (int i = 1; i < lines.length; i++) {
                    String line = lines[i].trim();
                    if (line.isEmpty()) {
                        continue;
                    }
                    
                    // Parse dòng: node-name   3950m   16Gi
                    // Format: [node-name] [CPU_ALLOC] [Memory_ALLOC]
                    String[] parts = line.split("\\s+");
                    if (parts.length >= 3) {
                        try {
                            // CPU có thể là 4 hoặc 3950m (millicores)
                            double cpu = parseCpuCores(parts[1]);
                            // RAM có thể là 8Gi, 16Gi, etc.
                            long memoryBytes = parseMemoryBytes(parts[2]);
                            
                            // Cộng dồn vào tổng
                            totalCpu += cpu;
                            totalMemoryBytes += memoryBytes;
                        } catch (NumberFormatException e) {
                            // Bỏ qua dòng không parse được
                        }
                    }
                }
            }

            // Tạo response và set dữ liệu
            ClusterAllocatableResponse response = new ClusterAllocatableResponse();
            response.setTotalCpuCores(roundToThreeDecimals(totalCpu));
            response.setTotalMemoryGb(roundToThreeDecimals(bytesToGb(totalMemoryBytes)));
            
            return response;

        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy cluster allocatable: " + e.getMessage(), e);
        } finally {
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * Lấy chi tiết database bao gồm thông tin Pod, Service, StatefulSet, PVC, PV.
     * 
     * Quy trình xử lý:
     * 1. Lấy database entity từ database và kiểm tra thông tin cơ bản (project, namespace, uuid_k8s)
     * 2. Tạo tên các Kubernetes resource dựa trên uuid_k8s:
     *    - Pod: db-{uuid}-0 (StatefulSet pattern)
     *    - Service: db-{uuid}-svc
     *    - StatefulSet: db-{uuid}
     *    - PVC: mysql-data-db-{uuid}-0 hoặc mongodb-data-db-{uuid}-0
     * 3. Kết nối SSH đến MASTER server
     * 4. Set thông tin database từ entity (IP, Port, name, username, password, type)
     * 5. Lấy thông tin Pod (name, node, status) - thử theo tên trước, fallback theo label
     * 6. Lấy thông tin Service (name, external IP, port)
     * 7. Lấy thông tin StatefulSet (name)
     * 8. Lấy thông tin PVC (name, status, volume, capacity)
     * 9. Lấy thông tin PV từ volume name (name, capacity, node)
     * 
     * @param databaseId ID của database cần lấy chi tiết
     * @return AdminDatabaseDetailResponse chứa đầy đủ thông tin database và Kubernetes resources
     * @throws RuntimeException nếu database không tồn tại hoặc thiếu thông tin cần thiết
     */
    @Override
    public AdminDatabaseDetailResponse getDatabaseDetail(Long databaseId) {
        
        // Bước 1: Lấy database entity từ database
        ProjectDatabaseEntity database = projectDatabaseRepository.findById(databaseId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy database với id " + databaseId));
        
        // Bước 2: Kiểm tra database có thuộc về project không
        ProjectEntity project = database.getProject();
        if (project == null) {
            throw new RuntimeException("Database không thuộc về project nào");
        }
        
        // Bước 3: Kiểm tra project có namespace không (bắt buộc để truy vấn Kubernetes)
        String namespace = project.getNamespace();
        if (namespace == null || namespace.trim().isEmpty()) {
            throw new RuntimeException("Project không có namespace");
        }
        namespace = namespace.trim();
        
        // Bước 4: Kiểm tra database có uuid_k8s không (bắt buộc để tạo tên resource)
        String uuid_k8s = database.getUuid_k8s();
        if (uuid_k8s == null || uuid_k8s.trim().isEmpty()) {
            throw new RuntimeException("Database không có uuid_k8s");
        }
        uuid_k8s = uuid_k8s.trim();
        
        // Bước 5: Tạo tên các Kubernetes resource dựa trên uuid_k8s
        String resourceName = "db-" + uuid_k8s;           // Tên chung cho database resource
        String serviceName = resourceName + "-svc";       // Service name: db-{uuid}-svc
        String statefulSetName = resourceName;            // StatefulSet name: db-{uuid}
        String podName = resourceName + "-0";             // Pod name: db-{uuid}-0 (StatefulSet pattern: {name}-{ordinal})
        
        // Bước 6: Lấy thông tin server MASTER để kết nối SSH
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));
        
        Session session = null;
        AdminDatabaseDetailResponse response = new AdminDatabaseDetailResponse();
        
        try {
            // Bước 7: Kết nối SSH đến MASTER server
            session = createSession(masterServer);
            
            // Bước 8: Set thông tin database từ entity (không cần truy vấn Kubernetes)
            response.setDatabaseId(database.getId());
            response.setDatabaseType(database.getDatabaseType());
            response.setDatabaseIp(database.getDatabaseIp());
            response.setDatabasePort(database.getDatabasePort());
            response.setDatabaseName(database.getDatabaseName());
            response.setDatabaseUsername(database.getDatabaseUsername());
            response.setDatabasePassword(database.getDatabasePassword());
            
            // Bước 9: Lấy thông tin Pod (name, node, status)
            // Strategy: Thử lấy theo pod name trước (StatefulSet pattern), nếu không có thì lấy theo label selector
            try {
                
                // Strategy 1: Thử lấy pod theo tên chính xác (StatefulSet pod name pattern: db-{uuid}-0)
                String podNameCmd = String.format("kubectl get pod %s -n %s -o jsonpath='{.metadata.name}'", podName, namespace);
                String podNameResult = executeCommand(session, podNameCmd, true);
                
                if (podNameResult != null && !podNameResult.trim().isEmpty()) {
                    // Tìm thấy pod theo tên, lấy thêm thông tin node và status
                    response.setPodName(podNameResult.trim());
                    
                    // Lấy node mà pod đang chạy
                    String podNodeCmd = String.format("kubectl get pod %s -n %s -o jsonpath='{.spec.nodeName}'", podName, namespace);
                    String podNodeResult = executeCommand(session, podNodeCmd, true);
                    if (podNodeResult != null && !podNodeResult.trim().isEmpty()) {
                        response.setPodNode(podNodeResult.trim());
                    }
                    
                    // Lấy trạng thái pod (Running, Pending, Error, etc.)
                    String podStatusCmd = String.format("kubectl get pod %s -n %s -o jsonpath='{.status.phase}'", podName, namespace);
                    String podStatusResult = executeCommand(session, podStatusCmd, true);
                    if (podStatusResult != null && !podStatusResult.trim().isEmpty()) {
                        response.setPodStatus(podStatusResult.trim());
                    }
                } else {
                    // Strategy 2: Fallback - lấy pod theo label selector (app=db-{uuid})
                    String podJsonPath = "{.items[0].metadata.name},{.items[0].spec.nodeName},{.items[0].status.phase}";
                    String podCmd = String.format("kubectl get pod -l app=%s -n %s -o jsonpath='%s'", resourceName, namespace, podJsonPath);
                    String podOutput = executeCommand(session, podCmd, true);
                    
                    if (podOutput != null && !podOutput.trim().isEmpty()) {
                        // Parse output: name,node,status
                        String[] podParts = podOutput.split(",");
                        if (podParts.length >= 3) {
                            response.setPodName(podParts[0].trim());
                            response.setPodNode(podParts[1].trim());
                            response.setPodStatus(podParts[2].trim());
                        }
                    }
                }
            } catch (Exception e) {
                // Bỏ qua lỗi khi lấy thông tin Pod
            }
            
            // Bước 10: Lấy thông tin Service (name, external IP, port)
            try {
                // Lấy name, external IP (nếu có LoadBalancer), và port trong một lệnh
                String svcJsonPath = "{.metadata.name},{.status.loadBalancer.ingress[0].ip},{.spec.ports[0].port}";
                String svcCmd = String.format("kubectl get svc %s -n %s -o jsonpath='%s'", serviceName, namespace, svcJsonPath);
                String svcOutput = executeCommand(session, svcCmd, true);
                
                if (svcOutput != null && !svcOutput.trim().isEmpty()) {
                    // Parse output: name,externalIp,port
                    String[] svcParts = svcOutput.split(",");
                    if (svcParts.length >= 1) {
                        response.setServiceName(svcParts[0].trim());
                        
                        // External IP chỉ có nếu Service type là LoadBalancer
                        if (svcParts.length >= 2 && !svcParts[1].trim().isEmpty()) {
                            response.setServiceExternalIp(svcParts[1].trim());
                        }
                        
                        // Port của service
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
                // Bỏ qua lỗi khi lấy thông tin Service
            }
            
            // Bước 11: Lấy thông tin StatefulSet (name)
            try {
                String stsCmd = String.format("kubectl get statefulset %s -n %s -o jsonpath='{.metadata.name}'", statefulSetName, namespace);
                String stsOutput = executeCommand(session, stsCmd, true);
                if (stsOutput != null && !stsOutput.trim().isEmpty()) {
                    response.setStatefulSetName(stsOutput.trim());
                }
            } catch (Exception e) {
                // Bỏ qua lỗi khi lấy thông tin StatefulSet
            }
            
            // Bước 12: Lấy thông tin PVC (PersistentVolumeClaim) - tìm PVC liên quan đến StatefulSet
            // PVC name pattern: mysql-data-db-{uuid}-0 hoặc mongodb-data-db-{uuid}-0
            try {
                
                // Tạo tên PVC dựa trên database type
                String pvcNamePattern = database.getDatabaseType().equalsIgnoreCase("MYSQL") 
                    ? "mysql-data-" + statefulSetName + "-0"   // MySQL: mysql-data-db-{uuid}-0
                    : "mongodb-data-" + statefulSetName + "-0"; // MongoDB: mongodb-data-db-{uuid}-0
                
                // Lấy name, status, volume name, và capacity trong một lệnh
                String pvcJsonPath = "{.metadata.name},{.status.phase},{.spec.volumeName},{.status.capacity.storage}";
                String pvcCmd = String.format("kubectl get pvc %s -n %s -o jsonpath='%s'", pvcNamePattern, namespace, pvcJsonPath);
                String pvcOutput = executeCommand(session, pvcCmd, true);
                
                if (pvcOutput != null && !pvcOutput.trim().isEmpty()) {
                    // Parse output: name,status,volumeName,capacity
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
                // Bỏ qua lỗi khi lấy thông tin PVC
            }
            
            // Bước 13: Lấy thông tin PV (PersistentVolume) - chỉ lấy nếu có PVC volume name
            // PV là tài nguyên cluster-level, không thuộc namespace
            if (response.getPvcVolume() != null && !response.getPvcVolume().isEmpty()) {
                try {
                    
                    // Lấy PV name (thường trùng với volume name)
                    String pvNameCmd = String.format("kubectl get pv %s -o jsonpath='{.metadata.name}'", response.getPvcVolume());
                    String pvName = executeCommand(session, pvNameCmd, true);
                    if (pvName != null && !pvName.trim().isEmpty()) {
                        response.setPvName(pvName.trim());
                    }
                    
                    // Lấy PV capacity (dung lượng storage)
                    String pvCapacityCmd = String.format("kubectl get pv %s -o jsonpath='{.spec.capacity.storage}'", response.getPvcVolume());
                    String pvCapacity = executeCommand(session, pvCapacityCmd, true);
                    if (pvCapacity != null && !pvCapacity.trim().isEmpty()) {
                        response.setPvCapacity(pvCapacity.trim());
                    }
                    
                    // Thử lấy node từ nodeAffinity (chỉ có với local storage, có thể không có)
                    // nodeAffinity chỉ tồn tại khi PV được bind với một node cụ thể (local storage)
                    try {
                        String pvNodeCmd = String.format("kubectl get pv %s -o jsonpath='{.spec.nodeAffinity.required.nodeSelectorTerms[0].matchExpressions[0].values[0]}'", response.getPvcVolume());
                        String pvNode = executeCommand(session, pvNodeCmd, true);
                        if (pvNode != null && !pvNode.trim().isEmpty() && !pvNode.trim().equals("<none>")) {
                            response.setPvNode(pvNode.trim());
                        }
                    } catch (Exception e) {
                        // Node info có thể không có, bỏ qua
                    }
                } catch (Exception e) {
                    // Bỏ qua lỗi khi lấy thông tin PV
                }
            }
            
            return response;
            
        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy chi tiết database: " + e.getMessage(), e);
        } finally {
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * Lấy chi tiết backend bao gồm thông tin Deployment, Pod, Service, Ingress.
     * 
     * Quy trình xử lý:
     * 1. Lấy backend entity và kiểm tra thông tin cơ bản (project, namespace, uuid_k8s)
     * 2. Tạo tên các Kubernetes resource:
     *    - Deployment: app-{uuid}
     *    - Service: app-{uuid}-svc
     *    - Ingress: app-{uuid}-ing
     * 3. Kết nối SSH đến MASTER server
     * 4. Set thông tin backend từ entity (deployment type, framework, domain, docker image, database connection)
     * 5. Lấy thông tin Deployment (name, replicas)
     * 6. Lấy thông tin Pod (name, node, status) - lấy pod đầu tiên từ deployment
     * 7. Lấy thông tin Service (name, type, port)
     * 8. Lấy thông tin Ingress (name, hosts, address, port, class) - có fallback nếu không tìm thấy theo tên
     * 
     * @param backendId ID của backend cần lấy chi tiết
     * @return AdminBackendDetailResponse chứa đầy đủ thông tin backend và Kubernetes resources
     * @throws RuntimeException nếu backend không tồn tại hoặc thiếu thông tin cần thiết
     */
    @Override
    public AdminBackendDetailResponse getBackendDetail(Long backendId) {
        // Bước 1: Lấy backend entity từ database
        ProjectBackendEntity backend = projectBackendRepository.findById(backendId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy backend với id " + backendId));
        
        // Bước 2: Kiểm tra backend có thuộc về project không
        ProjectEntity project = backend.getProject();
        if (project == null) {
            throw new RuntimeException("Backend không thuộc về project nào");
        }
        
        // Bước 3: Kiểm tra project có namespace không
        String namespace = project.getNamespace();
        if (namespace == null || namespace.trim().isEmpty()) {
            throw new RuntimeException("Project không có namespace");
        }
        namespace = namespace.trim();
        
        // Bước 4: Kiểm tra backend có uuid_k8s không
        String uuid_k8s = backend.getUuid_k8s();
        if (uuid_k8s == null || uuid_k8s.trim().isEmpty()) {
            throw new RuntimeException("Backend không có uuid_k8s");
        }
        uuid_k8s = uuid_k8s.trim();
        
        // Bước 5: Tạo tên các Kubernetes resource dựa trên uuid_k8s
        String resourceName = "app-" + uuid_k8s;           // Tên chung cho backend resource
        String deploymentName = resourceName;               // Deployment name: app-{uuid}
        String serviceName = resourceName + "-svc";          // Service name: app-{uuid}-svc
        String ingressName = resourceName + "-ing";         // Ingress name: app-{uuid}-ing
        
        // Bước 6: Lấy thông tin server MASTER
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));
        
        Session session = null;
        AdminBackendDetailResponse response = new AdminBackendDetailResponse();
        
        try {
            // Bước 7: Kết nối SSH đến MASTER server
            session = createSession(masterServer);
            
            // Bước 8: Set thông tin backend từ entity (không cần truy vấn Kubernetes)
            response.setBackendId(backend.getId());
            response.setProjectName(backend.getProjectName());
            response.setDeploymentType(backend.getDeploymentType());
            response.setFrameworkType(backend.getFrameworkType());
            response.setDomainNameSystem(backend.getDomainNameSystem());
            response.setDockerImage(backend.getDockerImage());
            
            // Bước 9: Set thông tin kết nối database (backend sử dụng để kết nối database)
            response.setDatabaseIp(backend.getDatabaseIp());
            response.setDatabasePort(backend.getDatabasePort());
            response.setDatabaseName(backend.getDatabaseName());
            response.setDatabaseUsername(backend.getDatabaseUsername());
            response.setDatabasePassword(backend.getDatabasePassword());
            
            // Bước 10: Lấy thông tin Deployment (name, replicas)
            try {
                String deployNameCmd = String.format("kubectl get deployment %s -n %s -o jsonpath='{.metadata.name}'", deploymentName, namespace);
                String deployName = executeCommand(session, deployNameCmd, true);
                if (deployName != null && !deployName.trim().isEmpty()) {
                    response.setDeploymentName(deployName.trim());
                }
                
                String deployReplicasCmd = String.format("kubectl get deployment %s -n %s -o jsonpath='{.spec.replicas}'", deploymentName, namespace);
                String deployReplicas = executeCommand(session, deployReplicasCmd, true);
                if (deployReplicas != null && !deployReplicas.trim().isEmpty()) {
                    try {
                        response.setReplicas(Integer.parseInt(deployReplicas.trim()));
                    } catch (NumberFormatException e) {
                        // Fallback: sử dụng replicas từ entity
                        response.setReplicas(backend.getReplicas());
                    }
                } else {
                    response.setReplicas(backend.getReplicas());
                }
            } catch (Exception e) {
                // Bỏ qua lỗi khi lấy thông tin Deployment, sử dụng giá trị mặc định
                response.setDeploymentName(deploymentName);
                response.setReplicas(backend.getReplicas());
            }
            
            // Lấy thông tin Pod (lấy pod đầu tiên từ deployment)
            try {
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
            } catch (Exception e) {
            }
            
            // Lấy thông tin Service
            try {
                String svcNameCmd = String.format("kubectl get svc %s -n %s -o jsonpath='{.metadata.name}'", serviceName, namespace);
                String svcName = executeCommand(session, svcNameCmd, true);
                if (svcName != null && !svcName.trim().isEmpty()) {
                    response.setServiceName(svcName.trim());
                }
                
                String svcTypeCmd = String.format("kubectl get svc %s -n %s -o jsonpath='{.spec.type}'", serviceName, namespace);
                String svcType = executeCommand(session, svcTypeCmd, true);
                if (svcType != null && !svcType.trim().isEmpty()) {
                    response.setServiceType(svcType.trim());
                }
                
                String svcPortCmd = String.format("kubectl get svc %s -n %s -o jsonpath='{.spec.ports[0].port}'", serviceName, namespace);
                String svcPort = executeCommand(session, svcPortCmd, true);
                if (svcPort != null && !svcPort.trim().isEmpty()) {
                    response.setServicePort(svcPort.trim());
                }
            } catch (Exception e) {
            }
            
            // Bước 13: Lấy thông tin Ingress (name, hosts, address, port, class)
            // Strategy: Thử tìm theo tên trước, nếu không có thì tìm tất cả ingress và filter theo service name
            try {
                
                // Strategy 1: Kiểm tra xem ingress có tồn tại không (theo tên chuẩn)
                String checkIngressCmd = String.format("kubectl get ingress %s -n %s --ignore-not-found -o name", ingressName, namespace);
                String ingressExists = executeCommand(session, checkIngressCmd, true);
                
                if (ingressExists != null && !ingressExists.trim().isEmpty() && ingressExists.contains("ingress")) {
                    // Tìm thấy ingress theo tên chuẩn
                    response.setIngressName(ingressName);
                    
                    // Lấy hosts (danh sách domain names được cấu hình)
                    String ingressHostsCmd = String.format("kubectl get ingress %s -n %s -o jsonpath='{.spec.rules[*].host}'", ingressName, namespace);
                    String ingressHosts = executeCommand(session, ingressHostsCmd, true);
                    if (ingressHosts != null && !ingressHosts.trim().isEmpty()) {
                        response.setIngressHosts(ingressHosts.trim());
                    }
                    
                    // Lấy address (có thể là IP hoặc hostname từ LoadBalancer)
                    String ingressAddressCmd = String.format("kubectl get ingress %s -n %s -o jsonpath='{.status.loadBalancer.ingress[0].ip}{.status.loadBalancer.ingress[0].hostname}'", ingressName, namespace);
                    String ingressAddress = executeCommand(session, ingressAddressCmd, true);
                    if (ingressAddress != null && !ingressAddress.trim().isEmpty() && !ingressAddress.trim().equals("<none>")) {
                        response.setIngressAddress(ingressAddress.trim());
                    }
                    
                    // Lấy port (từ backend service port được cấu hình trong ingress)
                    String ingressPortCmd = String.format("kubectl get ingress %s -n %s -o jsonpath='{.spec.rules[*].http.paths[*].backend.service.port.number}'", ingressName, namespace);
                    String ingressPort = executeCommand(session, ingressPortCmd, true);
                    if (ingressPort != null && !ingressPort.trim().isEmpty()) {
                        // Lấy port đầu tiên nếu có nhiều port (split bằng khoảng trắng)
                        String[] ports = ingressPort.trim().split("\\s+");
                        if (ports.length > 0) {
                            response.setIngressPort(ports[0]);
                        }
                    }
                    
                    // Lấy ingress class (ví dụ: nginx, traefik, etc.)
                    String ingressClassCmd = String.format("kubectl get ingress %s -n %s -o jsonpath='{.spec.ingressClassName}'", ingressName, namespace);
                    String ingressClass = executeCommand(session, ingressClassCmd, true);
                    if (ingressClass != null && !ingressClass.trim().isEmpty()) {
                        response.setIngressClass(ingressClass.trim());
                    }
                } else {
                    // Strategy 2: Fallback - tìm tất cả ingress trong namespace và filter theo service name
                    String findIngressCmd = String.format("kubectl get ingress -n %s -o jsonpath='{range .items[*]}{.metadata.name}{\\\"\\t\\\"}{.spec.rules[*].http.paths[*].backend.service.name}{\\\"\\n\\\"}{end}'", namespace);
                    String allIngresses = executeCommand(session, findIngressCmd, true);
                    
                    if (allIngresses != null && !allIngresses.trim().isEmpty()) {
                        String[] lines = allIngresses.split("\n");
                        
                        // Tìm ingress có backend service trùng với serviceName
                        for (String line : lines) {
                            if (line.contains(serviceName)) {
                                String[] parts = line.split("\t");
                                if (parts.length > 0) {
                                    String foundIngressName = parts[0].trim();
                                    response.setIngressName(foundIngressName);
                                    
                                    // Lấy các thông tin tương tự như Strategy 1
                                    String ingressHostsCmd = String.format("kubectl get ingress %s -n %s -o jsonpath='{.spec.rules[*].host}'", foundIngressName, namespace);
                                    String ingressHosts = executeCommand(session, ingressHostsCmd, true);
                                    if (ingressHosts != null && !ingressHosts.trim().isEmpty()) {
                                        response.setIngressHosts(ingressHosts.trim());
                                    }
                                    
                                    String ingressAddressCmd = String.format("kubectl get ingress %s -n %s -o jsonpath='{.status.loadBalancer.ingress[0].ip}{.status.loadBalancer.ingress[0].hostname}'", foundIngressName, namespace);
                                    String ingressAddress = executeCommand(session, ingressAddressCmd, true);
                                    if (ingressAddress != null && !ingressAddress.trim().isEmpty() && !ingressAddress.trim().equals("<none>")) {
                                        response.setIngressAddress(ingressAddress.trim());
                                    }
                                    
                                    String ingressPortCmd = String.format("kubectl get ingress %s -n %s -o jsonpath='{.spec.rules[*].http.paths[*].backend.service.port.number}'", foundIngressName, namespace);
                                    String ingressPort = executeCommand(session, ingressPortCmd, true);
                                    if (ingressPort != null && !ingressPort.trim().isEmpty()) {
                                        String[] ports = ingressPort.trim().split("\\s+");
                                        if (ports.length > 0) {
                                            response.setIngressPort(ports[0]);
                                        }
                                    }
                                    
                                    String ingressClassCmd = String.format("kubectl get ingress %s -n %s -o jsonpath='{.spec.ingressClassName}'", foundIngressName, namespace);
                                    String ingressClass = executeCommand(session, ingressClassCmd, true);
                                    if (ingressClass != null && !ingressClass.trim().isEmpty()) {
                                        response.setIngressClass(ingressClass.trim());
                                    }
                                    break;  // Tìm thấy rồi, không cần tìm tiếp
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                // Bỏ qua lỗi khi lấy thông tin Ingress
            }
            
            return response;
            
        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy chi tiết backend: " + e.getMessage(), e);
        } finally {
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * Lấy chi tiết frontend bao gồm thông tin Deployment, Pod, Service, Ingress.
     * 
     * Quy trình xử lý tương tự getBackendDetail, nhưng frontend không có thông tin kết nối database.
     * 
     * Quy trình xử lý:
     * 1. Lấy frontend entity và kiểm tra thông tin cơ bản (project, namespace, uuid_k8s)
     * 2. Tạo tên các Kubernetes resource (giống backend: app-{uuid})
     * 3. Kết nối SSH đến MASTER server
     * 4. Set thông tin frontend từ entity (deployment type, framework, domain, docker image)
     * 5. Lấy thông tin Deployment, Pod, Service, Ingress (tương tự backend)
     * 
     * @param frontendId ID của frontend cần lấy chi tiết
     * @return AdminFrontendDetailResponse chứa đầy đủ thông tin frontend và Kubernetes resources
     * @throws RuntimeException nếu frontend không tồn tại hoặc thiếu thông tin cần thiết
     */
    @Override
    public AdminFrontendDetailResponse getFrontendDetail(Long frontendId) {
        // Bước 1: Lấy frontend entity từ database
        ProjectFrontendEntity frontend = projectFrontendRepository.findById(frontendId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy frontend với id " + frontendId));
        
        // Bước 2: Kiểm tra frontend có thuộc về project không
        ProjectEntity project = frontend.getProject();
        if (project == null) {
            throw new RuntimeException("Frontend không thuộc về project nào");
        }
        
        // Bước 3: Kiểm tra project có namespace không
        String namespace = project.getNamespace();
        if (namespace == null || namespace.trim().isEmpty()) {
            throw new RuntimeException("Project không có namespace");
        }
        namespace = namespace.trim();
        
        // Bước 4: Kiểm tra frontend có uuid_k8s không
        String uuid_k8s = frontend.getUuid_k8s();
        if (uuid_k8s == null || uuid_k8s.trim().isEmpty()) {
            throw new RuntimeException("Frontend không có uuid_k8s");
        }
        uuid_k8s = uuid_k8s.trim();
        
        // Bước 5: Tạo tên các Kubernetes resource (giống backend)
        String resourceName = "app-" + uuid_k8s;           // Tên chung cho frontend resource
        String deploymentName = resourceName;               // Deployment name: app-{uuid}
        String serviceName = resourceName + "-svc";          // Service name: app-{uuid}-svc
        String ingressName = resourceName + "-ing";         // Ingress name: app-{uuid}-ing
        
        // Bước 6: Lấy thông tin server MASTER
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));
        
        Session session = null;
        AdminFrontendDetailResponse response = new AdminFrontendDetailResponse();
        
        try {
            // Bước 7: Kết nối SSH đến MASTER server
            session = createSession(masterServer);
            
            // Bước 8: Set thông tin frontend từ entity (không cần truy vấn Kubernetes)
            response.setFrontendId(frontend.getId());
            response.setProjectName(frontend.getProjectName());
            response.setDeploymentType(frontend.getDeploymentType());
            response.setFrameworkType(frontend.getFrameworkType());
            response.setDomainNameSystem(frontend.getDomainNameSystem());
            response.setDockerImage(frontend.getDockerImage());
            
            // Bước 9: Lấy thông tin Deployment (name, replicas) - tương tự backend
            try {
                String deployNameCmd = String.format("kubectl get deployment %s -n %s -o jsonpath='{.metadata.name}'", deploymentName, namespace);
                String deployName = executeCommand(session, deployNameCmd, true);
                if (deployName != null && !deployName.trim().isEmpty()) {
                    response.setDeploymentName(deployName.trim());
                }
                
                String deployReplicasCmd = String.format("kubectl get deployment %s -n %s -o jsonpath='{.spec.replicas}'", deploymentName, namespace);
                String deployReplicas = executeCommand(session, deployReplicasCmd, true);
                if (deployReplicas != null && !deployReplicas.trim().isEmpty()) {
                    try {
                        response.setReplicas(Integer.parseInt(deployReplicas.trim()));
                    } catch (NumberFormatException e) {
                        // Fallback: sử dụng replicas từ entity
                        response.setReplicas(frontend.getReplicas());
                    }
                } else {
                    response.setReplicas(frontend.getReplicas());
                }
            } catch (Exception e) {
                // Bỏ qua lỗi khi lấy thông tin Deployment, sử dụng giá trị mặc định
                response.setDeploymentName(deploymentName);
                response.setReplicas(frontend.getReplicas());
            }
            
            // Bước 10: Lấy thông tin Pod (name, node, status) - tương tự backend
            try {
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
            } catch (Exception e) {
                // Bỏ qua lỗi khi lấy thông tin Pod
            }
            
            // Bước 11: Lấy thông tin Service (name, type, port) - tương tự backend
            try {
                String svcNameCmd = String.format("kubectl get svc %s -n %s -o jsonpath='{.metadata.name}'", serviceName, namespace);
                String svcName = executeCommand(session, svcNameCmd, true);
                if (svcName != null && !svcName.trim().isEmpty()) {
                    response.setServiceName(svcName.trim());
                }
                
                String svcTypeCmd = String.format("kubectl get svc %s -n %s -o jsonpath='{.spec.type}'", serviceName, namespace);
                String svcType = executeCommand(session, svcTypeCmd, true);
                if (svcType != null && !svcType.trim().isEmpty()) {
                    response.setServiceType(svcType.trim());
                }
                
                String svcPortCmd = String.format("kubectl get svc %s -n %s -o jsonpath='{.spec.ports[0].port}'", serviceName, namespace);
                String svcPort = executeCommand(session, svcPortCmd, true);
                if (svcPort != null && !svcPort.trim().isEmpty()) {
                    response.setServicePort(svcPort.trim());
                }
            } catch (Exception e) {
                // Bỏ qua lỗi khi lấy thông tin Service
            }
            
            // Bước 12: Lấy thông tin Ingress (name, hosts, address, port, class) - tương tự backend
            // Strategy: Thử tìm theo tên trước, nếu không có thì tìm tất cả ingress và filter theo service name
            try {
                // Strategy 1: Kiểm tra ingress có tồn tại không (theo tên chuẩn)
                String checkIngressCmd = String.format("kubectl get ingress %s -n %s --ignore-not-found -o name", ingressName, namespace);
                String ingressExists = executeCommand(session, checkIngressCmd, true);
                
                if (ingressExists != null && !ingressExists.trim().isEmpty() && ingressExists.contains("ingress")) {
                    // Tìm thấy ingress theo tên chuẩn
                    response.setIngressName(ingressName);
                    
                    // Lấy hosts
                    String ingressHostsCmd = String.format("kubectl get ingress %s -n %s -o jsonpath='{.spec.rules[*].host}'", ingressName, namespace);
                    String ingressHosts = executeCommand(session, ingressHostsCmd, true);
                    if (ingressHosts != null && !ingressHosts.trim().isEmpty()) {
                        response.setIngressHosts(ingressHosts.trim());
                    }
                    
                    // Lấy address
                    String ingressAddressCmd = String.format("kubectl get ingress %s -n %s -o jsonpath='{.status.loadBalancer.ingress[0].ip}{.status.loadBalancer.ingress[0].hostname}'", ingressName, namespace);
                    String ingressAddress = executeCommand(session, ingressAddressCmd, true);
                    if (ingressAddress != null && !ingressAddress.trim().isEmpty() && !ingressAddress.trim().equals("<none>")) {
                        response.setIngressAddress(ingressAddress.trim());
                    }
                    
                    // Lấy port
                    String ingressPortCmd = String.format("kubectl get ingress %s -n %s -o jsonpath='{.spec.rules[*].http.paths[*].backend.service.port.number}'", ingressName, namespace);
                    String ingressPort = executeCommand(session, ingressPortCmd, true);
                    if (ingressPort != null && !ingressPort.trim().isEmpty()) {
                        String[] ports = ingressPort.trim().split("\\s+");
                        if (ports.length > 0) {
                            response.setIngressPort(ports[0]);
                        }
                    }
                    
                    // Lấy ingress class
                    String ingressClassCmd = String.format("kubectl get ingress %s -n %s -o jsonpath='{.spec.ingressClassName}'", ingressName, namespace);
                    String ingressClass = executeCommand(session, ingressClassCmd, true);
                    if (ingressClass != null && !ingressClass.trim().isEmpty()) {
                        response.setIngressClass(ingressClass.trim());
                    }
                } else {
                    // Strategy 2: Fallback - tìm tất cả ingress và filter theo service name
                    String findIngressCmd = String.format("kubectl get ingress -n %s -o jsonpath='{range .items[*]}{.metadata.name}{\\\"\\t\\\"}{.spec.rules[*].http.paths[*].backend.service.name}{\\\"\\n\\\"}{end}'", namespace);
                    String allIngresses = executeCommand(session, findIngressCmd, true);
                    if (allIngresses != null && !allIngresses.trim().isEmpty()) {
                        String[] lines = allIngresses.split("\n");
                        for (String line : lines) {
                            if (line.contains(serviceName)) {
                                String[] parts = line.split("\t");
                                if (parts.length > 0) {
                                    String foundIngressName = parts[0].trim();
                                    response.setIngressName(foundIngressName);
                                    
                                    // Lấy các thông tin tương tự như Strategy 1
                                    String ingressHostsCmd = String.format("kubectl get ingress %s -n %s -o jsonpath='{.spec.rules[*].host}'", foundIngressName, namespace);
                                    String ingressHosts = executeCommand(session, ingressHostsCmd, true);
                                    if (ingressHosts != null && !ingressHosts.trim().isEmpty()) {
                                        response.setIngressHosts(ingressHosts.trim());
                                    }
                                    
                                    String ingressAddressCmd = String.format("kubectl get ingress %s -n %s -o jsonpath='{.status.loadBalancer.ingress[0].ip}{.status.loadBalancer.ingress[0].hostname}'", foundIngressName, namespace);
                                    String ingressAddress = executeCommand(session, ingressAddressCmd, true);
                                    if (ingressAddress != null && !ingressAddress.trim().isEmpty() && !ingressAddress.trim().equals("<none>")) {
                                        response.setIngressAddress(ingressAddress.trim());
                                    }
                                    
                                    String ingressPortCmd = String.format("kubectl get ingress %s -n %s -o jsonpath='{.spec.rules[*].http.paths[*].backend.service.port.number}'", foundIngressName, namespace);
                                    String ingressPort = executeCommand(session, ingressPortCmd, true);
                                    if (ingressPort != null && !ingressPort.trim().isEmpty()) {
                                        String[] ports = ingressPort.trim().split("\\s+");
                                        if (ports.length > 0) {
                                            response.setIngressPort(ports[0]);
                                        }
                                    }
                                    
                                    String ingressClassCmd = String.format("kubectl get ingress %s -n %s -o jsonpath='{.spec.ingressClassName}'", foundIngressName, namespace);
                                    String ingressClass = executeCommand(session, ingressClassCmd, true);
                                    if (ingressClass != null && !ingressClass.trim().isEmpty()) {
                                        response.setIngressClass(ingressClass.trim());
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                // Bỏ qua lỗi khi lấy thông tin Ingress
            }
            
            return response;
            
        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy chi tiết frontend: " + e.getMessage(), e);
        } finally {
            // Đảm bảo đóng SSH session
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * Lấy thông tin tổng quan về cluster metrics (Nodes, Pods, Deployments, CPU/Memory usage).
     * 
     * Quy trình xử lý:
     * 1. Kết nối SSH đến MASTER server
     * 2. Lấy thông tin Nodes: kubectl get nodes - đếm total, healthy (Ready), unhealthy (NotReady)
     * 3. Lấy thông tin Pods: kubectl get pods --all-namespaces - đếm total, running, pending, failed
     * 4. Lấy thông tin Deployments: kubectl get deployments --all-namespaces - đếm total, active (ready > 0), error (ready = 0)
     * 5. Lấy CPU/Memory usage từ overview API (tái sử dụng logic có sẵn)
     * 6. Tổng hợp và trả về DashboardMetricsResponse
     * 
     * @return DashboardMetricsResponse chứa thông tin nodes, pods, deployments, cpuUsage, memoryUsage
     * @throws RuntimeException nếu không thể kết nối MASTER hoặc lỗi khi thực thi lệnh
     */
    @Override
    public DashboardMetricsResponse getDashboardMetrics() {
        // Lấy thông tin server MASTER
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        Session session = null;
        try {
            // Kết nối SSH đến MASTER server
            session = createSession(masterServer);
            
            DashboardMetricsResponse response = new DashboardMetricsResponse();
            
            // Bước 1: Lấy thông tin Nodes
            try {
                // Lấy danh sách nodes với status - dùng output mặc định và parse từ cột STATUS
                String nodesCmd = "kubectl get nodes --no-headers";
                String nodesOutput = executeCommand(session, nodesCmd, true);
                
                int totalNodes = 0;
                int healthyNodes = 0;
                int unhealthyNodes = 0;
                
                if (nodesOutput != null && !nodesOutput.trim().isEmpty()) {
                    String[] lines = nodesOutput.trim().split("\n");
                    for (String line : lines) {
                        if (line.trim().isEmpty()) continue;
                        totalNodes++;
                        // Parse status từ output: format "NAME STATUS ROLES AGE VERSION"
                        // STATUS thường là "Ready" hoặc "NotReady"
                        String[] parts = line.trim().split("\\s+");
                        if (parts.length >= 2) {
                            String status = parts[1].trim();
                            if (status.equals("Ready")) {
                                healthyNodes++;
                            } else {
                                unhealthyNodes++;
                            }
                        } else {
                            // Nếu không parse được, coi như unhealthy
                            unhealthyNodes++;
                        }
                    }
                }
                
                response.setNodes(new DashboardMetricsResponse.NodeMetrics(totalNodes, healthyNodes, unhealthyNodes));
            } catch (Exception e) {
                // Nếu lỗi, set giá trị mặc định
                response.setNodes(new DashboardMetricsResponse.NodeMetrics(0, 0, 0));
            }
            
            // Bước 2: Lấy thông tin Pods
            try {
                // Lấy danh sách pods với status từ tất cả namespaces
                String podsCmd = "kubectl get pods --all-namespaces -o custom-columns=NAMESPACE:.metadata.namespace,NAME:.metadata.name,STATUS:.status.phase --no-headers";
                String podsOutput = executeCommand(session, podsCmd, true);
                
                int totalPods = 0;
                int runningPods = 0;
                int pendingPods = 0;
                int failedPods = 0;
                
                if (podsOutput != null && !podsOutput.trim().isEmpty()) {
                    String[] lines = podsOutput.trim().split("\n");
                    for (String line : lines) {
                        if (line.trim().isEmpty()) continue;
                        totalPods++;
                        // Parse status từ cột thứ 3 (sau namespace và name)
                        String[] parts = line.trim().split("\\s+");
                        if (parts.length >= 3) {
                            String status = parts[2].trim();
                            if (status.equalsIgnoreCase("Running")) {
                                runningPods++;
                            } else if (status.equalsIgnoreCase("Pending")) {
                                pendingPods++;
                            } else if (status.equalsIgnoreCase("Failed") || status.equalsIgnoreCase("Error")) {
                                failedPods++;
                            }
                        }
                    }
                }
                
                response.setPods(new DashboardMetricsResponse.PodMetrics(totalPods, runningPods, pendingPods, failedPods));
            } catch (Exception e) {
                // Nếu lỗi, set giá trị mặc định
                response.setPods(new DashboardMetricsResponse.PodMetrics(0, 0, 0, 0));
            }
            
            // Bước 3: Lấy thông tin Deployments
            try {
                // Lấy danh sách deployments với ready replicas từ tất cả namespaces
                String deploymentsCmd = "kubectl get deployments --all-namespaces -o custom-columns=NAMESPACE:.metadata.namespace,NAME:.metadata.name,READY:.status.readyReplicas,DESIRED:.spec.replicas --no-headers";
                String deploymentsOutput = executeCommand(session, deploymentsCmd, true);
                
                int totalDeployments = 0;
                int activeDeployments = 0;
                int errorDeployments = 0;
                
                if (deploymentsOutput != null && !deploymentsOutput.trim().isEmpty()) {
                    String[] lines = deploymentsOutput.trim().split("\n");
                    for (String line : lines) {
                        if (line.trim().isEmpty()) continue;
                        totalDeployments++;
                        // Parse ready và desired replicas
                        String[] parts = line.trim().split("\\s+");
                        if (parts.length >= 4) {
                            try {
                                int ready = Integer.parseInt(parts[2].trim().equals("<none>") ? "0" : parts[2].trim());
                                int desired = Integer.parseInt(parts[3].trim());
                                
                                // Active: có ít nhất 1 replica ready
                                if (ready > 0) {
                                    activeDeployments++;
                                } else if (desired > 0) {
                                    // Error: desired > 0 nhưng ready = 0
                                    errorDeployments++;
                                }
                            } catch (NumberFormatException e) {
                                // Bỏ qua dòng không parse được
                            }
                        }
                    }
                }
                
                response.setDeployments(new DashboardMetricsResponse.DeploymentMetrics(totalDeployments, activeDeployments, errorDeployments));
            } catch (Exception e) {
                // Nếu lỗi, set giá trị mặc định
                response.setDeployments(new DashboardMetricsResponse.DeploymentMetrics(0, 0, 0));
            }
            
            // Bước 4: Lấy CPU/Memory usage từ tất cả pods trong cluster (--all-namespaces)
            try {
                // Lấy allocatable để làm total
                ClusterAllocatableResponse allocatable = getClusterAllocatable();
                
                // Tính tổng CPU/Memory từ tất cả pods trong cluster
                String topPodsCmd = "kubectl top pods --all-namespaces --no-headers";
                String topPodsOutput = executeCommand(session, topPodsCmd, true);
                
                double totalCpuUsed = 0.0;
                long totalMemoryBytes = 0L;
                
                if (topPodsOutput != null && !topPodsOutput.trim().isEmpty()) {
                    String[] lines = topPodsOutput.trim().split("\n");
                    for (String line : lines) {
                        if (line.trim().isEmpty()) continue;
                        
                        // Format: NAMESPACE POD_NAME CPU MEMORY
                        // Ví dụ: default nginx-pod 15m 100Mi
                        String[] parts = line.trim().split("\\s+");
                        if (parts.length >= 4) {
                            try {
                                // Parse CPU từ cột thứ 3 (index 2)
                                double cpu = parseCpuCores(parts[2]);
                                // Parse Memory từ cột thứ 4 (index 3)
                                long memory = parseMemoryBytes(parts[3]);
                                
                                totalCpuUsed += cpu;
                                totalMemoryBytes += memory;
                            } catch (NumberFormatException e) {
                                // Bỏ qua dòng không parse được
                            }
                        }
                    }
                }
                
                // Chuyển đổi Memory từ bytes sang GB
                double totalMemoryGb = bytesToGb(totalMemoryBytes);
                
                response.setCpuUsage(new DashboardMetricsResponse.ResourceUsage(
                    roundToThreeDecimals(totalCpuUsed),
                    allocatable.getTotalCpuCores()
                ));
                
                response.setMemoryUsage(new DashboardMetricsResponse.ResourceUsage(
                    roundToThreeDecimals(totalMemoryGb),
                    allocatable.getTotalMemoryGb()
                ));
            } catch (Exception e) {
                // Nếu lỗi, set giá trị mặc định
                response.setCpuUsage(new DashboardMetricsResponse.ResourceUsage(0.0, 0.0));
                response.setMemoryUsage(new DashboardMetricsResponse.ResourceUsage(0.0, 0.0));
            }
            
            return response;
            
        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy dashboard metrics: " + e.getMessage(), e);
        } finally {
            // Đảm bảo đóng SSH session
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * Lấy danh sách tất cả nodes trong cluster với thông tin chi tiết về CPU, Memory, Disk, Pods.
     * 
     * Quy trình xử lý:
     * 1. Kết nối SSH đến MASTER server
     * 2. Lấy danh sách nodes với thông tin cơ bản: kubectl get nodes -o wide
     * 3. Lấy capacity và allocatable cho từng node: kubectl get nodes -o jsonpath
     * 4. Lấy usage (requested) từ kubectl top nodes
     * 5. Đếm số pods trên mỗi node: kubectl get pods --all-namespaces --field-selector
     * 6. Lấy thông tin OS và Kernel từ node info
     * 7. Tổng hợp và trả về NodeListResponse
     * 
     * @return NodeListResponse chứa danh sách nodes với đầy đủ thông tin
     * @throws RuntimeException nếu không thể kết nối MASTER hoặc lỗi khi thực thi lệnh
     */
    @Override
    public NodeListResponse getNodes() {
        // Lấy thông tin server MASTER
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        Session session = null;
        try {
            // Kết nối SSH đến MASTER server
            session = createSession(masterServer);
            
            List<NodeResponse> nodes = new ArrayList<>();
            
            // Bước 1: Lấy danh sách tên nodes
            String getNodesCmd = "kubectl get nodes --no-headers -o custom-columns=NAME:.metadata.name";
            String nodesOutput = executeCommand(session, getNodesCmd, false);
            
            if (nodesOutput == null || nodesOutput.trim().isEmpty()) {
                return new NodeListResponse(new ArrayList<>());
            }
            
            String[] nodeNames = nodesOutput.trim().split("\\r?\\n");
            
            // Bước 1.5: Lấy danh sách tất cả servers từ database để match với nodes
            List<ServerEntity> allServers = serverRepository.findAll();
            Map<String, ServerEntity> serverMap = new HashMap<>();
            for (ServerEntity server : allServers) {
                // Match theo tên server (node name thường trùng với server name)
                serverMap.put(server.getName(), server);
                // Cũng có thể match theo IP nếu cần
            }
            
            // Bước 2: Lấy thông tin chi tiết cho từng node
            for (String nodeName : nodeNames) {
                if (nodeName.trim().isEmpty()) continue;
                nodeName = nodeName.trim();
                
                NodeResponse node = new NodeResponse();
                node.setId(nodeName);
                node.setName(nodeName);
                
                try {
                    // Lấy status (Ready/NotReady)
                    String statusCmd = String.format("kubectl get node %s -o jsonpath='{.status.conditions[?(@.type==\"Ready\")].status}'", nodeName);
                    String status = executeCommand(session, statusCmd, true);
                    if (status != null && status.trim().equals("True")) {
                        node.setStatus("ready");
                    } else {
                        node.setStatus("notready");
                    }
                    
                    // Lấy role (master/worker) từ labels
                    String roleCmd = String.format("kubectl get node %s -o jsonpath='{.metadata.labels.node-role\\.kubernetes\\.io/control-plane}'", nodeName);
                    String roleLabel = executeCommand(session, roleCmd, true);
                    if (roleLabel != null && !roleLabel.trim().isEmpty()) {
                        node.setRole("master");
                    } else {
                        node.setRole("worker");
                    }
                    
                    // Lấy OS và Kernel
                    String osCmd = String.format("kubectl get node %s -o jsonpath='{.status.nodeInfo.operatingSystem}'", nodeName);
                    String os = executeCommand(session, osCmd, true);
                    node.setOs(os != null ? os.trim() : "Unknown");
                    
                    String kernelCmd = String.format("kubectl get node %s -o jsonpath='{.status.nodeInfo.kernelVersion}'", nodeName);
                    String kernel = executeCommand(session, kernelCmd, true);
                    node.setKernel(kernel != null ? kernel.trim() : "Unknown");
                    
                    // Lấy CPU capacity và allocatable
                    String cpuCapacityCmd = String.format("kubectl get node %s -o jsonpath='{.status.capacity.cpu}'", nodeName);
                    String cpuCapacityStr = executeCommand(session, cpuCapacityCmd, true);
                    double cpuCapacity = 0.0;
                    if (cpuCapacityStr != null && !cpuCapacityStr.trim().isEmpty()) {
                        cpuCapacity = parseCpuCores(cpuCapacityStr.trim());
                    }
                    
                    String cpuAllocatableCmd = String.format("kubectl get node %s -o jsonpath='{.status.allocatable.cpu}'", nodeName);
                    String cpuAllocatableStr = executeCommand(session, cpuAllocatableCmd, true);
                    double cpuAllocatable = 0.0;
                    if (cpuAllocatableStr != null && !cpuAllocatableStr.trim().isEmpty()) {
                        cpuAllocatable = parseCpuCores(cpuAllocatableStr.trim());
                    }
                    
                    // Lấy Memory capacity và allocatable
                    String memCapacityCmd = String.format("kubectl get node %s -o jsonpath='{.status.capacity.memory}'", nodeName);
                    String memCapacityStr = executeCommand(session, memCapacityCmd, true);
                    long memCapacityBytes = 0L;
                    if (memCapacityStr != null && !memCapacityStr.trim().isEmpty()) {
                        memCapacityBytes = parseMemoryBytes(memCapacityStr.trim());
                    }
                    
                    String memAllocatableCmd = String.format("kubectl get node %s -o jsonpath='{.status.allocatable.memory}'", nodeName);
                    String memAllocatableStr = executeCommand(session, memAllocatableCmd, true);
                    long memAllocatableBytes = 0L;
                    if (memAllocatableStr != null && !memAllocatableStr.trim().isEmpty()) {
                        memAllocatableBytes = parseMemoryBytes(memAllocatableStr.trim());
                    }
                    
                    // Lấy CPU và Memory usage từ kubectl top nodes
                    // Format output: NAME       CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
                    // Ví dụ:        master-1   145m         7%     1981Mi          70%
                    double cpuUsed = 0.0;
                    long memUsedBytes = 0L;
                    try {
                        String topNodesCmd = "kubectl top nodes --no-headers";
                        String topOutput = executeCommand(session, topNodesCmd, true);
                        if (topOutput != null && !topOutput.trim().isEmpty()) {
                            String[] lines = topOutput.trim().split("\\r?\\n");
                            for (String line : lines) {
                                String[] parts = line.trim().split("\\s+");
                                // parts[0] = NAME, parts[1] = CPU(cores), parts[2] = CPU%, parts[3] = MEMORY(bytes), parts[4] = MEMORY%
                                if (parts.length >= 4 && parts[0].equals(nodeName)) {
                                    cpuUsed = parseCpuCores(parts[1]);
                                    memUsedBytes = parseMemoryBytes(parts[3]);
                                    break;
                                }
                            }
                        }
                    } catch (Exception e) {
                        // Nếu kubectl top không khả dụng, để giá trị mặc định 0
                    }
                    
                    // Đếm số pods trên node
                    int podCount = 0;
                    try {
                        String podCountCmd = String.format("kubectl get pods --all-namespaces --field-selector spec.nodeName=%s --no-headers", nodeName);
                        String podOutput = executeCommand(session, podCountCmd, true);
                        if (podOutput != null && !podOutput.trim().isEmpty()) {
                            String[] podLines = podOutput.trim().split("\\r?\\n");
                            podCount = podLines.length;
                        }
                    } catch (Exception e) {
                        // Nếu không đếm được, để giá trị mặc định 0
                    }
                    node.setPodCount(podCount);
                    
                    // Tạo NodeResource cho CPU
                    NodeResponse.NodeResource cpuResource = new NodeResponse.NodeResource();
                    cpuResource.setRequested(roundToThreeDecimals(cpuUsed));
                    cpuResource.setLimit(roundToThreeDecimals(cpuAllocatable));
                    cpuResource.setCapacity(roundToThreeDecimals(cpuCapacity));
                    node.setCpu(cpuResource);
                    
                    // Tạo NodeResource cho Memory
                    NodeResponse.NodeResource memResource = new NodeResponse.NodeResource();
                    memResource.setRequested(roundToThreeDecimals(bytesToGb(memUsedBytes)));
                    memResource.setLimit(roundToThreeDecimals(bytesToGb(memAllocatableBytes)));
                    memResource.setCapacity(roundToThreeDecimals(bytesToGb(memCapacityBytes)));
                    node.setMemory(memResource);
                    
                    // Disk: Lấy từ server bằng cách SSH vào từng server và chạy df -h /
                    NodeResponse.NodeResource diskResource = new NodeResponse.NodeResource();
                    double diskUsed = 0.0;
                    double diskCapacity = 0.0;
                    
                    // Tìm server tương ứng với node name
                    ServerEntity nodeServer = serverMap.get(nodeName);
                    if (nodeServer != null) {
                        Session nodeSession = null;
                        try {
                            // SSH vào server của node
                            nodeSession = createSession(nodeServer);
                            
                            // Chạy lệnh df -h / để lấy thông tin disk
                            // Output format: Filesystem      Size  Used Avail Use% Mounted on
                            //                /dev/sda1        20G  5.0G   14G  26% /
                            String dfCmd = "df -h / | tail -n 1";
                            String dfOutput = executeCommand(nodeSession, dfCmd, true);
                            
                            if (dfOutput != null && !dfOutput.trim().isEmpty()) {
                                // Parse output: /dev/sda1        20G  5.0G   14G  26% /
                                String[] dfParts = dfOutput.trim().split("\\s+");
                                if (dfParts.length >= 4) {
                                    // dfParts[1] = Size (20G), dfParts[2] = Used (5.0G)
                                    String sizeStr = dfParts[1]; // 20G
                                    String usedStr = dfParts[2]; // 5.0G
                                    
                                    diskCapacity = parseMemoryBytes(sizeStr) / BYTES_PER_GB;
                                    diskUsed = parseMemoryBytes(usedStr) / BYTES_PER_GB;
                                }
                            }
                        } catch (Exception e) {
                            // Nếu không thể lấy disk info, để giá trị mặc định 0
                        } finally {
                            if (nodeSession != null && nodeSession.isConnected()) {
                                nodeSession.disconnect();
                            }
                        }
                    }
                    
                    diskResource.setRequested(roundToThreeDecimals(diskUsed));
                    diskResource.setLimit(roundToThreeDecimals(diskCapacity)); // Limit = Capacity cho disk
                    diskResource.setCapacity(roundToThreeDecimals(diskCapacity));
                    node.setDisk(diskResource);
                    
                    // UpdatedAt: Lấy từ node conditions
                    String updatedAtCmd = String.format("kubectl get node %s -o jsonpath='{.metadata.creationTimestamp}'", nodeName);
                    String updatedAt = executeCommand(session, updatedAtCmd, true);
                    node.setUpdatedAt(updatedAt != null ? updatedAt.trim() : "");
                    
                    nodes.add(node);
                    
                } catch (Exception e) {
                    // Bỏ qua node nếu có lỗi, tiếp tục với node tiếp theo
                }
            }
            
            return new NodeListResponse(nodes);
            
        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy danh sách nodes: " + e.getMessage(), e);
        } finally {
            // Đảm bảo đóng SSH session
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * Lấy danh sách tất cả namespaces trong cluster sử dụng Kubernetes Java Client.
     * 
     * Quy trình xử lý:
     * 1. Kết nối SSH đến MASTER server để lấy kubeconfig
     * 2. Tạo Kubernetes Java Client từ kubeconfig
     * 3. Sử dụng CoreV1Api để lấy danh sách namespaces
     * 4. Parse V1Namespace objects thành NamespaceResponse:
     *    - Name
     *    - Status (active/terminating) từ status.phase
     *    - Labels từ metadata.labels
     *    - Age từ creationTimestamp
     * 5. Tổng hợp và trả về NamespaceListResponse
     * 
     * @return NamespaceListResponse chứa danh sách namespaces
     * @throws RuntimeException nếu không thể kết nối MASTER hoặc lỗi khi gọi Kubernetes API
     */
    @Override
    public NamespaceListResponse getNamespaces() {
        // Lấy thông tin server MASTER
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        Session session = null;
        try {
            // Kết nối SSH đến MASTER server để lấy kubeconfig
            session = createSession(masterServer);
            
            // Tạo Kubernetes client từ kubeconfig
            ApiClient client = createKubernetesClient(session);
            CoreV1Api api = new CoreV1Api(client);
            
            List<NamespaceResponse> namespaces = new ArrayList<>();
            
            // Lấy danh sách namespaces
            try {
                io.kubernetes.client.openapi.models.V1NamespaceList namespaceList = api.listNamespace(
                        null,  // allowWatchBookmarks
                        null,  // _continue
                        null,  // fieldSelector
                        null,  // labelSelector
                        null,  // limit
                        null,  // pretty
                        null,  // resourceVersion
                        null,  // resourceVersionMatch
                        null,  // sendInitialEvents
                        null,  // timeoutSeconds
                        null   // watch
                );
                
                if (namespaceList.getItems() == null) {
                    return new NamespaceListResponse(new ArrayList<>());
                }
                
                // Parse từng namespace
                for (V1Namespace v1Namespace : namespaceList.getItems()) {
                    try {
                        NamespaceResponse namespace = new NamespaceResponse();
                        
                        // Basic info
                        String name = v1Namespace.getMetadata().getName();
                        namespace.setId(name);
                        namespace.setName(name);
                        
                        // Age từ creationTimestamp
                        OffsetDateTime creationTimestamp = v1Namespace.getMetadata().getCreationTimestamp();
                        namespace.setAge(calculateAge(creationTimestamp));
                        
                        // Status từ status.phase
                        V1NamespaceStatus status = v1Namespace.getStatus();
                        String phase = (status != null && status.getPhase() != null) 
                                ? status.getPhase() 
                                : "Active";
                        
                        if ("Active".equalsIgnoreCase(phase)) {
                            namespace.setStatus("active");
                        } else {
                            namespace.setStatus("terminating");
                        }
                        
                        // Labels từ metadata.labels
                        Map<String, String> labels = new HashMap<>();
                        if (v1Namespace.getMetadata().getLabels() != null) {
                            labels.putAll(v1Namespace.getMetadata().getLabels());
                        }
                        namespace.setLabels(labels);
                        
                        namespaces.add(namespace);
                        
                    } catch (Exception e) {
                        // Bỏ qua namespace nếu có lỗi, tiếp tục với namespace tiếp theo
                    }
                }
                
            } catch (ApiException e) {
                throw new RuntimeException("Không thể lấy danh sách namespaces từ Kubernetes API: " + e.getMessage(), e);
            }
            
            return new NamespaceListResponse(namespaces);
            
        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy danh sách namespaces: " + e.getMessage(), e);
        } finally {
            // Đảm bảo đóng SSH session
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * Lấy danh sách tất cả deployments trong cluster sử dụng Kubernetes Java Client.
     * 
     * Quy trình xử lý:
     * 1. Kết nối SSH đến MASTER server để lấy kubeconfig
     * 2. Tạo Kubernetes Java Client từ kubeconfig
     * 3. Sử dụng AppsV1Api để lấy danh sách deployments từ tất cả namespaces
     * 4. Parse V1Deployment objects thành DeploymentResponse:
     *    - Namespace, Name
     *    - Replicas (desired, ready, updated, available) từ spec và status
     *    - Status từ conditions và replicas
     *    - Containers và Images từ spec.template.spec.containers
     *    - Selector từ spec.selector.matchLabels
     *    - Age từ creationTimestamp
     * 5. Tổng hợp và trả về DeploymentListResponse
     * 
     * @return DeploymentListResponse chứa danh sách deployments
     * @throws RuntimeException nếu không thể kết nối MASTER hoặc lỗi khi gọi Kubernetes API
     */
    @Override
    public DeploymentListResponse getDeployments() {
        // Lấy thông tin server MASTER
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        Session session = null;
        try {
            // Kết nối SSH đến MASTER server để lấy kubeconfig
            session = createSession(masterServer);
            
            // Tạo Kubernetes client từ kubeconfig
            ApiClient client = createKubernetesClient(session);
            AppsV1Api api = new AppsV1Api(client);
            
            List<DeploymentResponse> deployments = new ArrayList<>();
            
            // Lấy danh sách deployments từ tất cả namespaces
            try {
                io.kubernetes.client.openapi.models.V1DeploymentList deploymentList = api.listDeploymentForAllNamespaces(
                        null,  // allowWatchBookmarks
                        null,  // _continue
                        null,  // fieldSelector
                        null,  // labelSelector
                        null,  // limit
                        null,  // pretty
                        null,  // resourceVersion
                        null,  // resourceVersionMatch
                        null,  // sendInitialEvents
                        null,  // timeoutSeconds
                        null   // watch
                );
                
                if (deploymentList.getItems() == null) {
                    return new DeploymentListResponse(new ArrayList<>());
                }
                
                // Parse từng deployment
                for (V1Deployment v1Deployment : deploymentList.getItems()) {
                    try {
                        DeploymentResponse deployment = new DeploymentResponse();
                        
                        // Basic info
                        String namespace = v1Deployment.getMetadata().getNamespace();
                        String name = v1Deployment.getMetadata().getName();
                        deployment.setId(name + "-" + namespace);
                        deployment.setName(name);
                        deployment.setNamespace(namespace);
                        
                        // Age từ creationTimestamp
                        OffsetDateTime creationTimestamp = v1Deployment.getMetadata().getCreationTimestamp();
                        deployment.setAge(calculateAge(creationTimestamp));
                        
                        // Replicas từ spec và status
                        int desired = 0;
                        int ready = 0;
                        int updated = 0;
                        int available = 0;
                        
                        if (v1Deployment.getSpec() != null && v1Deployment.getSpec().getReplicas() != null) {
                            desired = v1Deployment.getSpec().getReplicas();
                        }
                        
                        V1DeploymentStatus status = v1Deployment.getStatus();
                        if (status != null) {
                            if (status.getReadyReplicas() != null) {
                                ready = status.getReadyReplicas();
                            }
                            if (status.getUpdatedReplicas() != null) {
                                updated = status.getUpdatedReplicas();
                            }
                            if (status.getAvailableReplicas() != null) {
                                available = status.getAvailableReplicas();
                            }
                        }
                        
                        DeploymentResponse.ReplicasInfo replicas = new DeploymentResponse.ReplicasInfo();
                        replicas.setDesired(desired);
                        replicas.setReady(ready);
                        replicas.setUpdated(updated);
                        replicas.setAvailable(available);
                        deployment.setReplicas(replicas);
                        
                        // Status: running nếu ready == desired, pending nếu ready < desired, error nếu có điều kiện lỗi
                        String depStatus = "running";
                        if (ready < desired) {
                            depStatus = "pending";
                        } else if (ready == 0 && desired > 0) {
                            depStatus = "error";
                        }
                        // Kiểm tra conditions để xác định lỗi
                        if (status != null && status.getConditions() != null) {
                            for (V1DeploymentCondition condition : status.getConditions()) {
                                if ("False".equals(condition.getStatus()) && 
                                    ("Progressing".equals(condition.getType()) || "Available".equals(condition.getType()))) {
                                    depStatus = "error";
                                    break;
                                }
                            }
                        }
                        deployment.setStatus(depStatus);
                        
                        // Containers và Images từ spec.template.spec.containers
                        List<String> containers = new ArrayList<>();
                        List<String> images = new ArrayList<>();
                        if (v1Deployment.getSpec() != null 
                                && v1Deployment.getSpec().getTemplate() != null
                                && v1Deployment.getSpec().getTemplate().getSpec() != null
                                && v1Deployment.getSpec().getTemplate().getSpec().getContainers() != null) {
                            for (V1Container container : 
                                    v1Deployment.getSpec().getTemplate().getSpec().getContainers()) {
                                if (container.getName() != null) {
                                    containers.add(container.getName());
                                }
                                if (container.getImage() != null) {
                                    images.add(container.getImage());
                                }
                            }
                        }
                        deployment.setContainers(containers);
                        deployment.setImages(images);
                        
                        // Selector từ spec.selector.matchLabels
                        String selector = "";
                        if (v1Deployment.getSpec() != null 
                                && v1Deployment.getSpec().getSelector() != null) {
                            V1LabelSelector labelSelector = v1Deployment.getSpec().getSelector();
                            if (labelSelector.getMatchLabels() != null && !labelSelector.getMatchLabels().isEmpty()) {
                                List<String> selectorParts = new ArrayList<>();
                                for (java.util.Map.Entry<String, String> entry : labelSelector.getMatchLabels().entrySet()) {
                                    selectorParts.add(entry.getKey() + "=" + entry.getValue());
                                }
                                selector = String.join(",", selectorParts);
                            }
                        }
                        deployment.setSelector(selector);
                        
                        deployments.add(deployment);
                        
                    } catch (Exception e) {
                        // Bỏ qua deployment nếu có lỗi, tiếp tục với deployment tiếp theo
                    }
                }
                
            } catch (ApiException e) {
                throw new RuntimeException("Không thể lấy danh sách deployments từ Kubernetes API: " + e.getMessage(), e);
            }
            
            return new DeploymentListResponse(deployments);
            
        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy danh sách deployments: " + e.getMessage(), e);
        } finally {
            // Đảm bảo đóng SSH session
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * Helper method để tạo Kubernetes client từ SSH session
     * 
     * @param session SSH session đến MASTER server
     * @return ApiClient để tương tác với Kubernetes API
     * @throws Exception Nếu có lỗi khi tạo client
     */
    private ApiClient createKubernetesClient(Session session) throws Exception {
        String kubeconfigPath = "~/.kube/config";
        File tempKubeconfig = null;
        try {
            String kubeconfigContent = executeCommand(session, "cat " + kubeconfigPath, false);
            if (kubeconfigContent == null || kubeconfigContent.trim().isEmpty()) {
                throw new RuntimeException("Không thể đọc kubeconfig từ master server");
            }

            tempKubeconfig = File.createTempFile("kubeconfig-", ".yaml");
            try (FileWriter writer = new FileWriter(tempKubeconfig)) {
                writer.write(kubeconfigContent);
            }

            ApiClient client = Config.fromConfig(tempKubeconfig.getAbsolutePath());
            Configuration.setDefaultApiClient(client);
            return client;
        } finally {
            if (tempKubeconfig != null && tempKubeconfig.exists()) {
                boolean deleted = tempKubeconfig.delete();
                if (!deleted) {
                    tempKubeconfig.deleteOnExit();
                }
            }
        }
    }

    /**
     * Tính toán age từ creationTimestamp (OffsetDateTime)
     */
    private String calculateAge(OffsetDateTime creationTimestamp) {
        try {
            if (creationTimestamp == null) {
                return "";
            }
            Instant created = creationTimestamp.toInstant();
            Instant now = Instant.now();
            Duration duration = Duration.between(created, now);
            
            long days = duration.toDays();
            long hours = duration.toHours() % 24;
            long minutes = duration.toMinutes() % 60;
            
            if (days > 0) {
                return days + "d";
            } else if (hours > 0) {
                return hours + "h";
            } else {
                return minutes + "m";
            }
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * Lấy danh sách tất cả pods trong cluster sử dụng Kubernetes Java Client.
     * 
     * Quy trình xử lý:
     * 1. Kết nối SSH đến MASTER server để lấy kubeconfig
     * 2. Tạo Kubernetes Java Client từ kubeconfig
     * 3. Sử dụng CoreV1Api để lấy danh sách pods từ tất cả namespaces
     * 4. Parse V1Pod objects thành PodResponse:
     *    - Namespace, Name
     *    - Ready (ready/total) từ container statuses
     *    - Status từ phase
     *    - Restarts từ container statuses
     *    - Age từ creationTimestamp
     *    - IP từ status.podIP
     *    - Node từ spec.nodeName
     * 5. Tổng hợp và trả về PodListResponse
     * 
     * @return PodListResponse chứa danh sách pods
     * @throws RuntimeException nếu không thể kết nối MASTER hoặc lỗi khi gọi Kubernetes API
     */
    @Override
    public PodListResponse getPods() {
        // Lấy thông tin server MASTER
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        Session session = null;
        try {
            // Kết nối SSH đến MASTER server để lấy kubeconfig
            session = createSession(masterServer);
            
            // Tạo Kubernetes client từ kubeconfig
            ApiClient client = createKubernetesClient(session);
            CoreV1Api api = new CoreV1Api(client);
            
            List<PodResponse> pods = new ArrayList<>();
            
            // Lấy danh sách pods từ tất cả namespaces
            try {
                io.kubernetes.client.openapi.models.V1PodList podList = api.listPodForAllNamespaces(
                        null,  // allowWatchBookmarks
                        null,  // _continue
                        null,  // fieldSelector
                        null,  // labelSelector
                        null,  // limit
                        null,  // pretty
                        null,  // resourceVersion
                        null,  // resourceVersionMatch
                        null,  // sendInitialEvents
                        null,  // timeoutSeconds
                        null   // watch
                );
                
                if (podList.getItems() == null) {
                    return new PodListResponse(new ArrayList<>());
                }
                
                // Parse từng pod
                for (V1Pod v1Pod : podList.getItems()) {
                    try {
                        PodResponse pod = new PodResponse();
                        
                        // Basic info
                        String namespace = v1Pod.getMetadata().getNamespace();
                        String name = v1Pod.getMetadata().getName();
                        pod.setId(name + "-" + namespace);
                        pod.setName(name);
                        pod.setNamespace(namespace);
                        
                        // Age từ creationTimestamp
                        OffsetDateTime creationTimestamp = v1Pod.getMetadata().getCreationTimestamp();
                        pod.setAge(calculateAge(creationTimestamp));
                        
                        // Status
                        V1PodStatus status = v1Pod.getStatus();
                        if (status != null) {
                            String phase = status.getPhase();
                            if (phase != null) {
                                String podStatus = phase.toLowerCase();
                                if (podStatus.contains("running")) {
                                    pod.setStatus("running");
                                } else if (podStatus.contains("pending")) {
                                    pod.setStatus("pending");
                                } else if (podStatus.contains("failed")) {
                                    pod.setStatus("failed");
                                } else if (podStatus.contains("succeeded")) {
                                    pod.setStatus("succeeded");
                                } else {
                                    pod.setStatus("pending");
                                }
                            }
                            
                            // IP
                            if (status.getPodIP() != null) {
                                pod.setIp(status.getPodIP());
                            }
                            
                            // Ready count từ container statuses
                            int ready = 0;
                            int total = 0;
                            int restarts = 0;
                            
                            if (status.getContainerStatuses() != null) {
                                total = status.getContainerStatuses().size();
                                for (V1ContainerStatus containerStatus : status.getContainerStatuses()) {
                                    if (containerStatus.getReady() != null && containerStatus.getReady()) {
                                        ready++;
                                    }
                                    if (containerStatus.getRestartCount() != null) {
                                        restarts += containerStatus.getRestartCount();
                                    }
                                }
                            }
                            
                            PodResponse.ReadyInfo readyInfo = new PodResponse.ReadyInfo();
                            readyInfo.setReady(ready);
                            readyInfo.setTotal(total);
                            pod.setReady(readyInfo);
                            pod.setRestarts(restarts);
                        }
                        
                        // Node từ spec
                        if (v1Pod.getSpec() != null && v1Pod.getSpec().getNodeName() != null) {
                            pod.setNode(v1Pod.getSpec().getNodeName());
                        }
                        
                        pods.add(pod);
                        
                    } catch (Exception e) {
                        // Bỏ qua pod nếu có lỗi, tiếp tục với pod tiếp theo
                    }
                }
                
            } catch (ApiException e) {
                throw new RuntimeException("Không thể lấy danh sách pods từ Kubernetes API: " + e.getMessage(), e);
            }
            
            return new PodListResponse(pods);
            
        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy danh sách pods: " + e.getMessage(), e);
        } finally {
            // Đảm bảo đóng SSH session
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * Lấy danh sách tất cả statefulsets trong cluster sử dụng Kubernetes Java Client.
     * 
     * Quy trình xử lý:
     * 1. Kết nối SSH đến MASTER server để lấy kubeconfig
     * 2. Tạo Kubernetes Java Client từ kubeconfig
     * 3. Sử dụng AppsV1Api để lấy danh sách statefulsets từ tất cả namespaces
     * 4. Parse V1StatefulSet objects thành StatefulsetResponse:
     *    - Namespace, Name
     *    - Ready (ready/desired) từ status
     *    - Status từ conditions
     *    - Service từ spec.serviceName
     *    - Containers và Images từ spec.template.spec.containers
     *    - Age từ creationTimestamp
     * 5. Tổng hợp và trả về StatefulsetListResponse
     * 
     * @return StatefulsetListResponse chứa danh sách statefulsets
     * @throws RuntimeException nếu không thể kết nối MASTER hoặc lỗi khi gọi Kubernetes API
     */
    @Override
    public StatefulsetListResponse getStatefulsets() {
        // Lấy thông tin server MASTER
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        Session session = null;
        try {
            // Kết nối SSH đến MASTER server để lấy kubeconfig
            session = createSession(masterServer);
            
            // Tạo Kubernetes client từ kubeconfig
            ApiClient client = createKubernetesClient(session);
            AppsV1Api api = new AppsV1Api(client);
            
            List<StatefulsetResponse> statefulsets = new ArrayList<>();
            
            // Lấy danh sách statefulsets từ tất cả namespaces
            try {
                io.kubernetes.client.openapi.models.V1StatefulSetList statefulSetList = api.listStatefulSetForAllNamespaces(
                        null,  // allowWatchBookmarks
                        null,  // _continue
                        null,  // fieldSelector
                        null,  // labelSelector
                        null,  // limit
                        null,  // pretty
                        null,  // resourceVersion
                        null,  // resourceVersionMatch
                        null,  // sendInitialEvents
                        null,  // timeoutSeconds
                        null   // watch
                );
                
                if (statefulSetList.getItems() == null) {
                    return new StatefulsetListResponse(new ArrayList<>());
                }
                
                // Parse từng statefulset
                for (V1StatefulSet v1StatefulSet : statefulSetList.getItems()) {
                    try {
                        StatefulsetResponse statefulset = new StatefulsetResponse();
                        
                        // Basic info
                        String namespace = v1StatefulSet.getMetadata().getNamespace();
                        String name = v1StatefulSet.getMetadata().getName();
                        statefulset.setId(name + "-" + namespace);
                        statefulset.setName(name);
                        statefulset.setNamespace(namespace);
                        
                        // Age từ creationTimestamp
                        OffsetDateTime creationTimestamp = v1StatefulSet.getMetadata().getCreationTimestamp();
                        statefulset.setAge(calculateAge(creationTimestamp));
                        
                        // Replicas từ status
                        V1StatefulSetStatus status = v1StatefulSet.getStatus();
                        int desired = 0;
                        int ready = 0;
                        if (v1StatefulSet.getSpec() != null && v1StatefulSet.getSpec().getReplicas() != null) {
                            desired = v1StatefulSet.getSpec().getReplicas();
                        }
                        if (status != null && status.getReadyReplicas() != null) {
                            ready = status.getReadyReplicas();
                        }
                        
                        StatefulsetResponse.ReplicasInfo replicas = new StatefulsetResponse.ReplicasInfo();
                        replicas.setDesired(desired);
                        replicas.setReady(ready);
                        statefulset.setReplicas(replicas);
                        
                        // Status: running nếu ready == desired, error nếu ready < desired và có điều kiện lỗi
                        String stsStatus = "running";
                        if (ready < desired) {
                            // Kiểm tra conditions để xác định có lỗi không
                            if (status != null && status.getConditions() != null) {
                                for (io.kubernetes.client.openapi.models.V1StatefulSetCondition condition : status.getConditions()) {
                                    if ("False".equals(condition.getStatus()) && "Progressing".equals(condition.getType())) {
                                        stsStatus = "error";
                                        break;
                                    }
                                }
                            } else {
                                stsStatus = "error";
                            }
                        }
                        statefulset.setStatus(stsStatus);
                        
                        // Service từ spec.serviceName
                        if (v1StatefulSet.getSpec() != null && v1StatefulSet.getSpec().getServiceName() != null) {
                            statefulset.setService(v1StatefulSet.getSpec().getServiceName());
                        } else {
                            statefulset.setService("");
                        }
                        
                        // Containers và Images từ spec.template.spec.containers
                        List<String> containers = new ArrayList<>();
                        List<String> images = new ArrayList<>();
                        if (v1StatefulSet.getSpec() != null 
                                && v1StatefulSet.getSpec().getTemplate() != null
                                && v1StatefulSet.getSpec().getTemplate().getSpec() != null
                                && v1StatefulSet.getSpec().getTemplate().getSpec().getContainers() != null) {
                            for (io.kubernetes.client.openapi.models.V1Container container : 
                                    v1StatefulSet.getSpec().getTemplate().getSpec().getContainers()) {
                                if (container.getName() != null) {
                                    containers.add(container.getName());
                                }
                                if (container.getImage() != null) {
                                    images.add(container.getImage());
                                }
                            }
                        }
                        statefulset.setContainers(containers);
                        statefulset.setImages(images);
                        
                        statefulsets.add(statefulset);
                        
                    } catch (Exception e) {
                        // Bỏ qua statefulset nếu có lỗi, tiếp tục với statefulset tiếp theo
                    }
                }
                
            } catch (ApiException e) {
                throw new RuntimeException("Không thể lấy danh sách statefulsets từ Kubernetes API: " + e.getMessage(), e);
            }
            
            return new StatefulsetListResponse(statefulsets);
            
        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy danh sách statefulsets: " + e.getMessage(), e);
        } finally {
            // Đảm bảo đóng SSH session
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * Lấy danh sách tất cả services trong cluster sử dụng Kubernetes Java Client.
     * 
     * Quy trình xử lý:
     * 1. Kết nối SSH đến MASTER server để lấy kubeconfig
     * 2. Tạo Kubernetes Java Client từ kubeconfig
     * 3. Sử dụng CoreV1Api để lấy danh sách services từ tất cả namespaces
     * 4. Parse V1Service objects thành ServiceResponse:
     *    - Namespace, Name
     *    - Type từ spec.type (ClusterIP, NodePort, LoadBalancer)
     *    - ClusterIP từ spec.clusterIP
     *    - ExternalIP từ status.loadBalancer.ingress hoặc spec.externalIPs
     *    - Ports từ spec.ports (port, targetPort, protocol)
     *    - Selector từ spec.selector
     *    - Age từ creationTimestamp
     * 5. Tổng hợp và trả về ServiceListResponse
     * 
     * @return ServiceListResponse chứa danh sách services
     * @throws RuntimeException nếu không thể kết nối MASTER hoặc lỗi khi gọi Kubernetes API
     */
    @Override
    public ServiceListResponse getServices() {
        // Lấy thông tin server MASTER
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        Session session = null;
        try {
            // Kết nối SSH đến MASTER server để lấy kubeconfig
            session = createSession(masterServer);
            
            // Tạo Kubernetes client từ kubeconfig
            ApiClient client = createKubernetesClient(session);
            CoreV1Api api = new CoreV1Api(client);
            
            List<ServiceResponse> services = new ArrayList<>();
            
            // Lấy danh sách services từ tất cả namespaces
            try {
                io.kubernetes.client.openapi.models.V1ServiceList serviceList = api.listServiceForAllNamespaces(
                        null,  // allowWatchBookmarks
                        null,  // _continue
                        null,  // fieldSelector
                        null,  // labelSelector
                        null,  // limit
                        null,  // pretty
                        null,  // resourceVersion
                        null,  // resourceVersionMatch
                        null,  // sendInitialEvents
                        null,  // timeoutSeconds
                        null   // watch
                );
                
                if (serviceList.getItems() == null) {
                    return new ServiceListResponse(new ArrayList<>());
                }
                
                // Parse từng service
                for (V1Service v1Service : serviceList.getItems()) {
                    try {
                        ServiceResponse service = new ServiceResponse();
                        
                        // Basic info
                        String namespace = v1Service.getMetadata().getNamespace();
                        String name = v1Service.getMetadata().getName();
                        service.setId(name + "-" + namespace);
                        service.setName(name);
                        service.setNamespace(namespace);
                        
                        // Age từ creationTimestamp
                        OffsetDateTime creationTimestamp = v1Service.getMetadata().getCreationTimestamp();
                        service.setAge(calculateAge(creationTimestamp));
                        
                        // Service spec
                        V1ServiceSpec spec = v1Service.getSpec();
                        if (spec != null) {
                            // Type
                            if (spec.getType() != null) {
                                service.setType(spec.getType());
                            } else {
                                service.setType("ClusterIP"); // Default
                            }
                            
                            // ClusterIP
                            if (spec.getClusterIP() != null && !spec.getClusterIP().equals("None")) {
                                service.setClusterIP(spec.getClusterIP());
                            } else {
                                service.setClusterIP("-");
                            }
                            
                            // Ports
                            List<ServiceResponse.PortInfo> ports = new ArrayList<>();
                            if (spec.getPorts() != null) {
                                for (V1ServicePort servicePort : spec.getPorts()) {
                                    ServiceResponse.PortInfo portInfo = new ServiceResponse.PortInfo();
                                    if (servicePort.getPort() != null) {
                                        portInfo.setPort(servicePort.getPort());
                                    }
                                    // TargetPort có thể là IntOrString (Integer hoặc String)
                                    if (servicePort.getTargetPort() != null) {
                                        if (servicePort.getTargetPort().isInteger()) {
                                            portInfo.setTargetPort(servicePort.getTargetPort().getIntValue());
                                        } else if (servicePort.getTargetPort().getStrValue() != null) {
                                            // Nếu là string, cố gắng parse hoặc dùng port làm targetPort
                                            try {
                                                portInfo.setTargetPort(Integer.parseInt(servicePort.getTargetPort().getStrValue()));
                                            } catch (NumberFormatException e) {
                                                // Nếu không parse được, dùng port làm targetPort
                                                portInfo.setTargetPort(servicePort.getPort());
                                            }
                                        }
                                    } else {
                                        // Nếu không có targetPort, dùng port
                                        portInfo.setTargetPort(servicePort.getPort());
                                    }
                                    if (servicePort.getProtocol() != null) {
                                        portInfo.setProtocol(servicePort.getProtocol());
                                    } else {
                                        portInfo.setProtocol("TCP"); // Default
                                    }
                                    ports.add(portInfo);
                                }
                            }
                            service.setPorts(ports);
                            
                            // Selector
                            if (spec.getSelector() != null && !spec.getSelector().isEmpty()) {
                                Map<String, String> selector = new HashMap<>(spec.getSelector());
                                service.setSelector(selector);
                            } else {
                                service.setSelector(new HashMap<>());
                            }
                        }
                        
                        // ExternalIP
                        String externalIP = "-";
                        V1ServiceStatus status = v1Service.getStatus();
                        if (status != null && status.getLoadBalancer() != null 
                                && status.getLoadBalancer().getIngress() != null
                                && !status.getLoadBalancer().getIngress().isEmpty()) {
                            // Lấy IP từ LoadBalancer ingress
                            List<String> externalIPs = new ArrayList<>();
                            for (io.kubernetes.client.openapi.models.V1LoadBalancerIngress ingress : 
                                    status.getLoadBalancer().getIngress()) {
                                if (ingress.getIp() != null) {
                                    externalIPs.add(ingress.getIp());
                                } else if (ingress.getHostname() != null) {
                                    externalIPs.add(ingress.getHostname());
                                }
                            }
                            if (!externalIPs.isEmpty()) {
                                externalIP = String.join(",", externalIPs);
                            }
                        } else if (spec != null && spec.getExternalIPs() != null && !spec.getExternalIPs().isEmpty()) {
                            // Fallback: lấy từ spec.externalIPs
                            externalIP = String.join(",", spec.getExternalIPs());
                        }
                        service.setExternalIP(externalIP);
                        
                        services.add(service);
                        
                    } catch (Exception e) {
                        // Bỏ qua service nếu có lỗi, tiếp tục với service tiếp theo
                    }
                }
                
            } catch (ApiException e) {
                throw new RuntimeException("Không thể lấy danh sách services từ Kubernetes API: " + e.getMessage(), e);
            }
            
            return new ServiceListResponse(services);
            
        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy danh sách services: " + e.getMessage(), e);
        } finally {
            // Đảm bảo đóng SSH session
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * Lấy danh sách tất cả ingress trong cluster sử dụng Kubernetes Java Client.
     * 
     * Quy trình xử lý:
     * 1. Kết nối SSH đến MASTER server để lấy kubeconfig
     * 2. Tạo Kubernetes Java Client từ kubeconfig
     * 3. Sử dụng NetworkingV1Api để lấy danh sách ingress từ tất cả namespaces
     * 4. Parse V1Ingress objects thành IngressResponse:
     *    - Namespace, Name
     *    - IngressClass từ spec.ingressClassName
     *    - Hosts từ spec.rules[*].host
     *    - Address từ status.loadBalancer.ingress[*].ip hoặc hostname
     *    - Ports từ spec.rules[*].http.paths[*].backend.service.port.number (hoặc mặc định 80, 443)
     *    - Age từ creationTimestamp
     * 5. Tổng hợp và trả về IngressListResponse
     * 
     * @return IngressListResponse chứa danh sách ingress
     * @throws RuntimeException nếu không thể kết nối MASTER hoặc lỗi khi gọi Kubernetes API
     */
    @Override
    public IngressListResponse getIngress() {
        // Lấy thông tin server MASTER
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        Session session = null;
        try {
            // Kết nối SSH đến MASTER server để lấy kubeconfig
            session = createSession(masterServer);
            
            // Tạo Kubernetes client từ kubeconfig
            ApiClient client = createKubernetesClient(session);
            NetworkingV1Api api = new NetworkingV1Api(client);
            
            List<IngressResponse> ingressList = new ArrayList<>();
            
            // Lấy danh sách ingress từ tất cả namespaces
            try {
                io.kubernetes.client.openapi.models.V1IngressList ingressListResponse = api.listIngressForAllNamespaces(
                        null,  // allowWatchBookmarks
                        null,  // _continue
                        null,  // fieldSelector
                        null,  // labelSelector
                        null,  // limit
                        null,  // pretty
                        null,  // resourceVersion
                        null,  // resourceVersionMatch
                        null,  // sendInitialEvents
                        null,  // timeoutSeconds
                        null   // watch
                );
                
                if (ingressListResponse.getItems() == null) {
                    return new IngressListResponse(new ArrayList<>());
                }
                
                // Parse từng ingress
                for (V1Ingress v1Ingress : ingressListResponse.getItems()) {
                    try {
                        IngressResponse ingress = new IngressResponse();
                        
                        // Basic info
                        String namespace = v1Ingress.getMetadata().getNamespace();
                        String name = v1Ingress.getMetadata().getName();
                        ingress.setId(name + "-" + namespace);
                        ingress.setName(name);
                        ingress.setNamespace(namespace);
                        
                        // Age từ creationTimestamp
                        OffsetDateTime creationTimestamp = v1Ingress.getMetadata().getCreationTimestamp();
                        ingress.setAge(calculateAge(creationTimestamp));
                        
                        // Ingress spec
                        V1IngressSpec spec = v1Ingress.getSpec();
                        if (spec != null) {
                            // IngressClass từ spec.ingressClassName
                            if (spec.getIngressClassName() != null) {
                                ingress.setIngressClass(spec.getIngressClassName());
                            } else {
                                ingress.setIngressClass(null);
                            }
                            
                            // Hosts từ spec.rules[*].host
                            List<String> hosts = new ArrayList<>();
                            Set<Integer> portsSet = new HashSet<>();
                            
                            if (spec.getRules() != null) {
                                for (V1IngressRule rule : spec.getRules()) {
                                    if (rule.getHost() != null && !rule.getHost().isEmpty()) {
                                        hosts.add(rule.getHost());
                                    }
                                    
                                    // Lấy ports từ paths
                                    if (rule.getHttp() != null && rule.getHttp().getPaths() != null) {
                                        for (io.kubernetes.client.openapi.models.V1HTTPIngressPath path : 
                                                rule.getHttp().getPaths()) {
                                            if (path.getBackend() != null 
                                                    && path.getBackend().getService() != null
                                                    && path.getBackend().getService().getPort() != null) {
                                                io.kubernetes.client.openapi.models.V1ServiceBackendPort servicePort = 
                                                        path.getBackend().getService().getPort();
                                                if (servicePort.getNumber() != null) {
                                                    portsSet.add(servicePort.getNumber());
                                                } else if (servicePort.getName() != null) {
                                                    // Nếu là tên port, thử parse hoặc dùng mặc định
                                                    // Thường là "http" (80) hoặc "https" (443)
                                                    if ("http".equalsIgnoreCase(servicePort.getName())) {
                                                        portsSet.add(80);
                                                    } else if ("https".equalsIgnoreCase(servicePort.getName())) {
                                                        portsSet.add(443);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            
                            ingress.setHosts(hosts);
                            
                            // Ports: nếu không có port nào được tìm thấy, dùng mặc định 80, 443
                            List<Integer> ports = new ArrayList<>(portsSet);
                            if (ports.isEmpty()) {
                                ports.add(80);
                                ports.add(443);
                            }
                            ports.sort(Integer::compareTo);
                            ingress.setPorts(ports);
                        } else {
                            ingress.setHosts(new ArrayList<>());
                            ingress.setPorts(Arrays.asList(80, 443));
                        }
                        
                        // Address từ status.loadBalancer.ingress
                        String address = null;
                        V1IngressStatus status = v1Ingress.getStatus();
                        if (status != null && status.getLoadBalancer() != null 
                                && status.getLoadBalancer().getIngress() != null
                                && !status.getLoadBalancer().getIngress().isEmpty()) {
                            List<String> addresses = new ArrayList<>();
                            for (V1IngressLoadBalancerIngress lbIngress : status.getLoadBalancer().getIngress()) {
                                if (lbIngress.getIp() != null) {
                                    addresses.add(lbIngress.getIp());
                                } else if (lbIngress.getHostname() != null) {
                                    addresses.add(lbIngress.getHostname());
                                }
                            }
                            if (!addresses.isEmpty()) {
                                address = String.join(",", addresses);
                            }
                        }
                        ingress.setAddress(address);
                        
                        ingressList.add(ingress);
                        
                    } catch (Exception e) {
                        // Bỏ qua ingress nếu có lỗi, tiếp tục với ingress tiếp theo
                    }
                }
                
            } catch (ApiException e) {
                throw new RuntimeException("Không thể lấy danh sách ingress từ Kubernetes API: " + e.getMessage(), e);
            }
            
            return new IngressListResponse(ingressList);
            
        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy danh sách ingress: " + e.getMessage(), e);
        } finally {
            // Đảm bảo đóng SSH session
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * Lấy danh sách tất cả PVCs (PersistentVolumeClaims) trong cluster sử dụng Kubernetes Java Client.
     * 
     * Quy trình xử lý:
     * 1. Kết nối SSH đến MASTER server để lấy kubeconfig
     * 2. Tạo Kubernetes Java Client từ kubeconfig
     * 3. Sử dụng CoreV1Api để lấy danh sách PVCs từ tất cả namespaces
     * 4. Parse V1PersistentVolumeClaim objects thành PVCResponse:
     *    - Namespace, Name
     *    - Status từ status.phase (Bound/Pending)
     *    - Volume từ spec.volumeName
     *    - Capacity từ status.capacity.storage
     *    - AccessModes từ spec.accessModes
     *    - StorageClass từ spec.storageClassName
     *    - VolumeAttributesClass từ spec.volumeAttributesClassName
     *    - VolumeMode từ spec.volumeMode
     *    - Age từ creationTimestamp
     * 5. Tổng hợp và trả về PVCListResponse
     * 
     * @return PVCListResponse chứa danh sách PVCs
     * @throws RuntimeException nếu không thể kết nối MASTER hoặc lỗi khi gọi Kubernetes API
     */
    @Override
    public PVCListResponse getPVCs() {
        // Lấy thông tin server MASTER
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        Session session = null;
        try {
            // Kết nối SSH đến MASTER server để lấy kubeconfig
            session = createSession(masterServer);
            
            // Tạo Kubernetes client từ kubeconfig
            ApiClient client = createKubernetesClient(session);
            CoreV1Api api = new CoreV1Api(client);
            
            List<PVCResponse> pvcs = new ArrayList<>();
            
            // Lấy danh sách PVCs từ tất cả namespaces
            try {
                io.kubernetes.client.openapi.models.V1PersistentVolumeClaimList pvcList = api.listPersistentVolumeClaimForAllNamespaces(
                        null,  // allowWatchBookmarks
                        null,  // _continue
                        null,  // fieldSelector
                        null,  // labelSelector
                        null,  // limit
                        null,  // pretty
                        null,  // resourceVersion
                        null,  // resourceVersionMatch
                        null,  // sendInitialEvents
                        null,  // timeoutSeconds
                        null   // watch
                );
                
                if (pvcList.getItems() == null) {
                    return new PVCListResponse(new ArrayList<>());
                }
                
                // Parse từng PVC
                for (V1PersistentVolumeClaim v1PVC : pvcList.getItems()) {
                    try {
                        PVCResponse pvc = new PVCResponse();
                        
                        // Basic info
                        String namespace = v1PVC.getMetadata().getNamespace();
                        String name = v1PVC.getMetadata().getName();
                        pvc.setId(name + "-" + namespace);
                        pvc.setName(name);
                        pvc.setNamespace(namespace);
                        
                        // Age từ creationTimestamp
                        OffsetDateTime creationTimestamp = v1PVC.getMetadata().getCreationTimestamp();
                        pvc.setAge(calculateAge(creationTimestamp));
                        
                        // PVC spec
                        V1PersistentVolumeClaimSpec spec = v1PVC.getSpec();
                        if (spec != null) {
                            // AccessModes
                            List<String> accessModes = new ArrayList<>();
                            if (spec.getAccessModes() != null) {
                                accessModes.addAll(spec.getAccessModes());
                            }
                            pvc.setAccessModes(accessModes);
                            
                            // StorageClass
                            if (spec.getStorageClassName() != null) {
                                pvc.setStorageClass(spec.getStorageClassName());
                            } else {
                                pvc.setStorageClass("");
                            }
                            
                            // VolumeAttributesClass - không có trong version hiện tại của Kubernetes Java Client
                            pvc.setVolumeAttributesClass(null);
                            
                            // VolumeMode
                            if (spec.getVolumeMode() != null) {
                                pvc.setVolumeMode(spec.getVolumeMode());
                            } else {
                                pvc.setVolumeMode(null);
                            }
                            
                            // Volume từ spec.volumeName
                            if (spec.getVolumeName() != null && !spec.getVolumeName().isEmpty()) {
                                pvc.setVolume(spec.getVolumeName());
                            } else {
                                pvc.setVolume(null);
                            }
                        }
                        
                        // PVC status
                        V1PersistentVolumeClaimStatus status = v1PVC.getStatus();
                        if (status != null) {
                            // Status từ phase
                            if (status.getPhase() != null) {
                                String phase = status.getPhase();
                                if ("Bound".equalsIgnoreCase(phase)) {
                                    pvc.setStatus("bound");
                                } else {
                                    pvc.setStatus("pending");
                                }
                            } else {
                                pvc.setStatus("pending");
                            }
                            
                            // Capacity từ status.capacity
                            if (status.getCapacity() != null && status.getCapacity().containsKey("storage")) {
                                String capacity = parseQuantityToGB(status.getCapacity().get("storage"));
                                pvc.setCapacity(capacity);
                            } else if (spec != null && spec.getResources() != null 
                                    && spec.getResources().getRequests() != null
                                    && spec.getResources().getRequests().containsKey("storage")) {
                                // Fallback: lấy từ spec.resources.requests.storage
                                String capacity = parseQuantityToGB(spec.getResources().getRequests().get("storage"));
                                pvc.setCapacity(capacity);
                            } else {
                                pvc.setCapacity("");
                            }
                        } else {
                            pvc.setStatus("pending");
                            pvc.setCapacity("");
                        }
                        
                        pvcs.add(pvc);
                        
                    } catch (Exception e) {
                        // Bỏ qua PVC nếu có lỗi, tiếp tục với PVC tiếp theo
                    }
                }
                
            } catch (ApiException e) {
                throw new RuntimeException("Không thể lấy danh sách PVCs từ Kubernetes API: " + e.getMessage(), e);
            }
            
            return new PVCListResponse(pvcs);
            
        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy danh sách PVCs: " + e.getMessage(), e);
        } finally {
            // Đảm bảo đóng SSH session
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    /**
     * Lấy danh sách tất cả PVs (PersistentVolumes) trong cluster sử dụng Kubernetes Java Client.
     * 
     * Quy trình xử lý:
     * 1. Kết nối SSH đến MASTER server để lấy kubeconfig
     * 2. Tạo Kubernetes Java Client từ kubeconfig
     * 3. Sử dụng CoreV1Api để lấy danh sách PVs
     * 4. Parse V1PersistentVolume objects thành PVResponse:
     *    - Name
     *    - Capacity từ spec.capacity.storage
     *    - AccessModes từ spec.accessModes
     *    - ReclaimPolicy từ spec.persistentVolumeReclaimPolicy
     *    - Status từ status.phase (Available/Bound/Released)
     *    - StorageClass từ spec.storageClassName
     *    - Claim từ spec.claimRef (namespace và name)
     *    - VolumeAttributesClass từ spec.volumeAttributesClassName
     *    - Reason từ status.reason
     *    - VolumeMode từ spec.volumeMode
     *    - Age từ creationTimestamp
     * 5. Tổng hợp và trả về PVListResponse
     * 
     * @return PVListResponse chứa danh sách PVs
     * @throws RuntimeException nếu không thể kết nối MASTER hoặc lỗi khi gọi Kubernetes API
     */
    @Override
    public PVListResponse getPVs() {
        // Lấy thông tin server MASTER
        ServerEntity masterServer = serverRepository.findByRole("MASTER")
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy server MASTER. Vui lòng cấu hình server MASTER trong hệ thống."));

        Session session = null;
        try {
            // Kết nối SSH đến MASTER server để lấy kubeconfig
            session = createSession(masterServer);
            
            // Tạo Kubernetes client từ kubeconfig
            ApiClient client = createKubernetesClient(session);
            CoreV1Api api = new CoreV1Api(client);
            
            List<PVResponse> pvs = new ArrayList<>();
            
            // Lấy danh sách PVs
            try {
                io.kubernetes.client.openapi.models.V1PersistentVolumeList pvList = api.listPersistentVolume(
                        null,  // allowWatchBookmarks
                        null,  // _continue
                        null,  // fieldSelector
                        null,  // labelSelector
                        null,  // limit
                        null,  // pretty
                        null,  // resourceVersion
                        null,  // resourceVersionMatch
                        null,  // sendInitialEvents
                        null,  // timeoutSeconds
                        null   // watch
                );
                
                if (pvList.getItems() == null) {
                    return new PVListResponse(new ArrayList<>());
                }
                
                // Parse từng PV
                for (V1PersistentVolume v1PV : pvList.getItems()) {
                    try {
                        PVResponse pv = new PVResponse();
                        
                        // Basic info
                        String name = v1PV.getMetadata().getName();
                        pv.setId(name);
                        pv.setName(name);
                        
                        // Age từ creationTimestamp
                        OffsetDateTime creationTimestamp = v1PV.getMetadata().getCreationTimestamp();
                        pv.setAge(calculateAge(creationTimestamp));
                        
                        // PV spec
                        V1PersistentVolumeSpec spec = v1PV.getSpec();
                        if (spec != null) {
                            // Capacity từ spec.capacity
                            if (spec.getCapacity() != null && spec.getCapacity().containsKey("storage")) {
                                String capacity = parseQuantityToGB(spec.getCapacity().get("storage"));
                                pv.setCapacity(capacity);
                            } else {
                                pv.setCapacity("");
                            }
                            
                            // AccessModes
                            List<String> accessModes = new ArrayList<>();
                            if (spec.getAccessModes() != null) {
                                accessModes.addAll(spec.getAccessModes());
                            }
                            pv.setAccessModes(accessModes);
                            
                            // ReclaimPolicy
                            if (spec.getPersistentVolumeReclaimPolicy() != null) {
                                pv.setReclaimPolicy(spec.getPersistentVolumeReclaimPolicy());
                            } else {
                                pv.setReclaimPolicy("Retain"); // Default
                            }
                            
                            // StorageClass
                            if (spec.getStorageClassName() != null) {
                                pv.setStorageClass(spec.getStorageClassName());
                            } else {
                                pv.setStorageClass("");
                            }
                            
                            // Claim từ spec.claimRef
                            if (spec.getClaimRef() != null) {
                                V1ObjectReference claimRef = spec.getClaimRef();
                                PVResponse.ClaimInfo claim = new PVResponse.ClaimInfo();
                                if (claimRef.getNamespace() != null) {
                                    claim.setNamespace(claimRef.getNamespace());
                                }
                                if (claimRef.getName() != null) {
                                    claim.setName(claimRef.getName());
                                }
                                pv.setClaim(claim);
                            } else {
                                pv.setClaim(null);
                            }
                            
                            // VolumeAttributesClass - không có trong version hiện tại của Kubernetes Java Client
                            pv.setVolumeAttributesClass(null);
                            
                            // VolumeMode
                            if (spec.getVolumeMode() != null) {
                                pv.setVolumeMode(spec.getVolumeMode());
                            } else {
                                pv.setVolumeMode(null);
                            }
                        }
                        
                        // PV status
                        V1PersistentVolumeStatus status = v1PV.getStatus();
                        if (status != null) {
                            // Status từ phase
                            if (status.getPhase() != null) {
                                String phase = status.getPhase();
                                pv.setStatus(phase.toLowerCase()); // Available, Bound, Released
                            } else {
                                pv.setStatus("available");
                            }
                            
                            // Reason
                            if (status.getReason() != null) {
                                pv.setReason(status.getReason());
                            } else {
                                pv.setReason(null);
                            }
                        } else {
                            pv.setStatus("available");
                            pv.setReason(null);
                        }
                        
                        pvs.add(pv);
                        
                    } catch (Exception e) {
                        // Bỏ qua PV nếu có lỗi, tiếp tục với PV tiếp theo
                    }
                }
                
            } catch (ApiException e) {
                throw new RuntimeException("Không thể lấy danh sách PVs từ Kubernetes API: " + e.getMessage(), e);
            }
            
            return new PVListResponse(pvs);
            
        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy danh sách PVs: " + e.getMessage(), e);
        } finally {
            // Đảm bảo đóng SSH session
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }
}

