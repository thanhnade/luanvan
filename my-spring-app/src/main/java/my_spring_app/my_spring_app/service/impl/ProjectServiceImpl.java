package my_spring_app.my_spring_app.service.impl;

import my_spring_app.my_spring_app.dto.reponse.CreateProjectResponse;
import my_spring_app.my_spring_app.dto.reponse.ProjectBackendListResponse;
import my_spring_app.my_spring_app.dto.reponse.ProjectBasicInfoResponse;
import my_spring_app.my_spring_app.dto.reponse.ProjectDatabaseListResponse;
import my_spring_app.my_spring_app.dto.reponse.ProjectDetailResponse;
import my_spring_app.my_spring_app.dto.reponse.ProjectFrontendListResponse;
import my_spring_app.my_spring_app.dto.reponse.ProjectOverviewResponse;
import my_spring_app.my_spring_app.dto.reponse.ProjectSummaryResponse;
import my_spring_app.my_spring_app.dto.reponse.ProjectDeploymentHistoryResponse;
import my_spring_app.my_spring_app.dto.request.CreateProjectRequest;
import my_spring_app.my_spring_app.entity.ProjectBackendEntity;
import my_spring_app.my_spring_app.entity.ProjectDatabaseEntity;
import my_spring_app.my_spring_app.entity.ProjectEntity;
import my_spring_app.my_spring_app.entity.ProjectFrontendEntity;
import my_spring_app.my_spring_app.entity.UserEntity;
import my_spring_app.my_spring_app.repository.ProjectRepository;
import my_spring_app.my_spring_app.repository.UserRepository;
import my_spring_app.my_spring_app.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProjectServiceImpl implements ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public CreateProjectResponse createProject(CreateProjectRequest request) {
        System.out.println("[createProject] Bắt đầu tạo project mới với tên: " + request.getProjectName());

        // Tìm user theo username
        Optional<UserEntity> userOptional = userRepository.findByUsername(request.getUsername());
        if (userOptional.isEmpty()) {
            System.err.println("[createProject] Lỗi: User không tồn tại với username: " + request.getUsername());
            throw new RuntimeException("User không tồn tại với username: " + request.getUsername());
        }
        UserEntity user = userOptional.get();
        System.out.println("[createProject] Tìm thấy user với ID: " + user.getId());
        System.out.println("[createProject] Tier của user: " + user.getTier());

        // Kiểm tra giới hạn tier
        if ("STANDARD".equalsIgnoreCase(user.getTier())) {
            long projectCount = projectRepository.countByUser(user);
            System.out.println("[createProject] User STANDARD hiện có " + projectCount + " project(s)");
            if (projectCount >= 1) {
                String errorMessage = "Tài khoản STANDARD chỉ được phép tạo 1 dự án. Vui lòng nâng cấp gói để tiếp tục.";
                System.err.println("[createProject] Lỗi: " + errorMessage);
                throw new RuntimeException(errorMessage);
            }
        }

        // Tạo UUID cho project
        String fullUuid = UUID.randomUUID().toString();
        String uuid_k8s = fullUuid.replace("-", "").substring(0, 12);
        String namespace = "ns-" + uuid_k8s;
        System.out.println("[createProject] Tạo UUID cho project: " + uuid_k8s);

        // Tạo ProjectEntity
        ProjectEntity projectEntity = new ProjectEntity();
        projectEntity.setProjectName(request.getProjectName());
        projectEntity.setDescription(request.getDescription());
        projectEntity.setNamespace(namespace);
        projectEntity.setUuid_k8s(uuid_k8s);
        projectEntity.setUser(user);
        System.out.println("[createProject] Đã thiết lập thông tin project: projectName=" + request.getProjectName() + ", namespace=" + namespace + ", uuid_k8s=" + uuid_k8s);

        // Lưu vào database
        System.out.println("[createProject] Lưu project vào database");
        ProjectEntity savedProjectEntity = projectRepository.save(projectEntity);
        System.out.println("[createProject] Đã lưu project thành công với ID: " + savedProjectEntity.getId());

        // Chuyển đổi sang CreateProjectResponse
        System.out.println("[createProject] Chuyển đổi sang CreateProjectResponse");
        CreateProjectResponse response = new CreateProjectResponse();
        response.setId(savedProjectEntity.getId());
        response.setProjectName(savedProjectEntity.getProjectName());
        response.setDescription(savedProjectEntity.getDescription());
        response.setUuid_k8s(savedProjectEntity.getUuid_k8s());
        response.setNamespace(savedProjectEntity.getNamespace());
        response.setCreatedAt(savedProjectEntity.getCreatedAt());

        System.out.println("[createProject] Hoàn tất tạo project thành công: projectName=" + savedProjectEntity.getProjectName() + ", id=" + savedProjectEntity.getId());
        return response;
    }

    @Override
    public ProjectSummaryResponse getUserProjects(String username) {
        System.out.println("[getUserProjects] Bắt đầu lấy danh sách projects cho user: " + username);

        // Tìm user theo username
        Optional<UserEntity> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            System.err.println("[getUserProjects] Lỗi: User không tồn tại với username: " + username);
            throw new RuntimeException("User không tồn tại với username: " + username);
        }
        UserEntity user = userOptional.get();
        System.out.println("[getUserProjects] Tìm thấy user với ID: " + user.getId());

        // Lấy danh sách projects của user - fetch từng collection riêng biệt để tránh MultipleBagFetchException
        List<ProjectEntity> projects = projectRepository.findByUser(user);
        System.out.println("[getUserProjects] Tìm thấy " + projects.size() + " projects");
        
        // Fetch collections riêng biệt để tránh LazyInitializationException
        List<ProjectEntity> projectsWithDatabases = projectRepository.findByUserWithDatabases(user);
        List<ProjectEntity> projectsWithBackends = projectRepository.findByUserWithBackends(user);
        List<ProjectEntity> projectsWithFrontends = projectRepository.findByUserWithFrontends(user);
        
        // Tạo map để lưu counts
        java.util.Map<Long, Integer> databaseCountMap = new java.util.HashMap<>();
        java.util.Map<Long, Integer> backendCountMap = new java.util.HashMap<>();
        java.util.Map<Long, Integer> frontendCountMap = new java.util.HashMap<>();
        
        // Đếm databases
        for (ProjectEntity p : projectsWithDatabases) {
            databaseCountMap.put(p.getId(), p.getDatabases() != null ? p.getDatabases().size() : 0);
        }
        
        // Đếm backends
        for (ProjectEntity p : projectsWithBackends) {
            backendCountMap.put(p.getId(), p.getBackends() != null ? p.getBackends().size() : 0);
        }
        
        // Đếm frontends
        for (ProjectEntity p : projectsWithFrontends) {
            frontendCountMap.put(p.getId(), p.getFrontends() != null ? p.getFrontends().size() : 0);
        }

        // Chuyển đổi sang ProjectSummaryResponse
        List<ProjectSummaryResponse.ProjectSummaryItem> projectSummaries = projects.stream()
                .map(project -> {
                    // Lấy số lượng từ maps, nếu không có thì mặc định là 0
                    int databaseCount = databaseCountMap.getOrDefault(project.getId(), 0);
                    int backendCount = backendCountMap.getOrDefault(project.getId(), 0);
                    int frontendCount = frontendCountMap.getOrDefault(project.getId(), 0);

                    // Đảm bảo updatedAt được set (nếu null thì dùng createdAt)
                    java.time.LocalDateTime updatedAt = project.getUpdatedAt() != null 
                            ? project.getUpdatedAt() 
                            : project.getCreatedAt();

                    return new ProjectSummaryResponse.ProjectSummaryItem(
                            project.getId(),
                            project.getProjectName(),
                            project.getDescription(),
                            databaseCount,
                            backendCount,
                            frontendCount,
                            updatedAt
                    );
                })
                .collect(Collectors.toList());

        ProjectSummaryResponse response = new ProjectSummaryResponse();
        response.setProjects(projectSummaries);

        System.out.println("[getUserProjects] Hoàn tất lấy danh sách projects: " + projectSummaries.size() + " projects");
        return response;
    }

    @Override
    public ProjectDetailResponse getProjectDetail(Long projectId, String username) {
        System.out.println("[getProjectDetail] Bắt đầu lấy chi tiết project với ID: " + projectId + " cho user: " + username);

        // Tìm user theo username
        Optional<UserEntity> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            System.err.println("[getProjectDetail] Lỗi: User không tồn tại với username: " + username);
            throw new RuntimeException("User không tồn tại với username: " + username);
        }
        UserEntity user = userOptional.get();
        System.out.println("[getProjectDetail] Tìm thấy user với ID: " + user.getId());

        // Tìm project theo ID
        Optional<ProjectEntity> projectOptional = projectRepository.findById(projectId);
        if (projectOptional.isEmpty()) {
            System.err.println("[getProjectDetail] Lỗi: Project không tồn tại với ID: " + projectId);
            throw new RuntimeException("Project không tồn tại với ID: " + projectId);
        }
        ProjectEntity project = projectOptional.get();
        System.out.println("[getProjectDetail] Tìm thấy project với tên: " + project.getProjectName());

        // Validate project thuộc về user
        if (project.getUser() == null || !project.getUser().getId().equals(user.getId())) {
            System.err.println("[getProjectDetail] Lỗi: Project không thuộc về user này. Project user ID: " + 
                              (project.getUser() != null ? project.getUser().getId() : "null") + 
                              ", Request user ID: " + user.getId());
            throw new RuntimeException("Bạn không có quyền truy cập project này");
        }

        // Fetch các collections riêng biệt để tránh LazyInitializationException
        // Sử dụng các query riêng để fetch databases, backends, frontends
        ProjectEntity projectWithDatabases = projectRepository.findByIdWithDatabases(projectId).orElse(project);
        ProjectEntity projectWithBackends = projectRepository.findByIdWithBackends(projectId).orElse(project);
        ProjectEntity projectWithFrontends = projectRepository.findByIdWithFrontends(projectId).orElse(project);

        // Map databases
        List<ProjectDetailResponse.DatabaseDetail> databases = (projectWithDatabases.getDatabases() != null ? projectWithDatabases.getDatabases() : project.getDatabases())
                .stream()
                .map(db -> {
                    ProjectDetailResponse.DatabaseDetail detail = new ProjectDetailResponse.DatabaseDetail();
                    detail.setId(db.getId());
                    detail.setProjectName(db.getProjectName());
                    detail.setDescription(db.getDescription());
                    detail.setDatabaseType(db.getDatabaseType());
                    detail.setDatabaseIp(db.getDatabaseIp());
                    detail.setDatabasePort(db.getDatabasePort());
                    detail.setDatabaseName(db.getDatabaseName());
                    detail.setDatabaseUsername(db.getDatabaseUsername());
                    detail.setDatabasePassword(db.getDatabasePassword());
                    detail.setUuid_k8s(db.getUuid_k8s());
                    detail.setSourcePath(db.getSourcePath());
                    detail.setYamlPath(db.getYamlPath());
                    detail.setStatus(db.getStatus());
                    detail.setCreatedAt(db.getCreatedAt());
                    return detail;
                })
                .collect(Collectors.toList());

        // Map backends
        List<ProjectDetailResponse.BackendDetail> backends = (projectWithBackends.getBackends() != null ? projectWithBackends.getBackends() : project.getBackends())
                .stream()
                .map(be -> {
                    ProjectDetailResponse.BackendDetail detail = new ProjectDetailResponse.BackendDetail();
                    detail.setId(be.getId());
                    detail.setProjectName(be.getProjectName());
                    detail.setDescription(be.getDescription());
                    detail.setDeploymentType(be.getDeploymentType());
                    detail.setFrameworkType(be.getFrameworkType());
                    detail.setDatabaseIp(be.getDatabaseIp());
                    detail.setDatabasePort(be.getDatabasePort());
                    detail.setDatabaseName(be.getDatabaseName());
                    detail.setDatabaseUsername(be.getDatabaseUsername());
                    detail.setDatabasePassword(be.getDatabasePassword());
                    detail.setUuid_k8s(be.getUuid_k8s());
                    detail.setSourcePath(be.getSourcePath());
                    detail.setYamlPath(be.getYamlPath());
                    detail.setDockerImage(be.getDockerImage());
                    detail.setDomainNameSystem(be.getDomainNameSystem());
                    detail.setStatus(be.getStatus());
                    detail.setCreatedAt(be.getCreatedAt());
                    return detail;
                })
                .collect(Collectors.toList());

        // Map frontends
        List<ProjectDetailResponse.FrontendDetail> frontends = (projectWithFrontends.getFrontends() != null ? projectWithFrontends.getFrontends() : project.getFrontends())
                .stream()
                .map(fe -> {
                    ProjectDetailResponse.FrontendDetail detail = new ProjectDetailResponse.FrontendDetail();
                    detail.setId(fe.getId());
                    detail.setProjectName(fe.getProjectName());
                    detail.setDescription(fe.getDescription());
                    detail.setDeploymentType(fe.getDeploymentType());
                    detail.setFrameworkType(fe.getFrameworkType());
                    detail.setUuid_k8s(fe.getUuid_k8s());
                    detail.setSourcePath(fe.getSourcePath());
                    detail.setYamlPath(fe.getYamlPath());
                    detail.setDockerImage(fe.getDockerImage());
                    detail.setDomainNameSystem(fe.getDomainNameSystem());
                    detail.setStatus(fe.getStatus());
                    detail.setCreatedAt(fe.getCreatedAt());
                    return detail;
                })
                .collect(Collectors.toList());

        // Tạo response
        ProjectDetailResponse response = new ProjectDetailResponse();
        response.setId(project.getId());
        response.setProjectName(project.getProjectName());
        response.setDescription(project.getDescription());
        // Status mặc định - có thể tính toán dựa trên status của components
        response.setStatus("RUNNING"); // TODO: Tính toán status thực tế
        response.setCreatedAt(project.getCreatedAt());
        response.setUpdatedAt(project.getUpdatedAt() != null ? project.getUpdatedAt() : project.getCreatedAt());
        response.setUuid_k8s(project.getUuid_k8s());
        response.setNamespace(project.getNamespace());
        response.setDatabases(databases);
        response.setBackends(backends);
        response.setFrontends(frontends);

        System.out.println("[getProjectDetail] Hoàn tất lấy chi tiết project: " + project.getProjectName() + 
                          ", databases: " + databases.size() + 
                          ", backends: " + backends.size() + 
                          ", frontends: " + frontends.size());
        return response;
    }

    @Override
    public ProjectBasicInfoResponse getProjectBasicInfo(Long projectId) {
        System.out.println("[getProjectBasicInfo] Bắt đầu lấy thông tin cơ bản project với ID: " + projectId);

        // Tìm project theo ID
        Optional<ProjectEntity> projectOptional = projectRepository.findById(projectId);
        if (projectOptional.isEmpty()) {
            System.err.println("[getProjectBasicInfo] Lỗi: Project không tồn tại với ID: " + projectId);
            throw new RuntimeException("Project không tồn tại với ID: " + projectId);
        }
        ProjectEntity project = projectOptional.get();
        System.out.println("[getProjectBasicInfo] Tìm thấy project với tên: " + project.getProjectName());

        // Tạo response
        ProjectBasicInfoResponse response = new ProjectBasicInfoResponse();
        response.setId(project.getId());
        response.setProjectName(project.getProjectName());
        response.setDescription(project.getDescription());
        // Đảm bảo updatedAt được set (nếu null thì dùng createdAt)
        response.setUpdatedAt(project.getUpdatedAt() != null ? project.getUpdatedAt() : project.getCreatedAt());

        System.out.println("[getProjectBasicInfo] Hoàn tất lấy thông tin cơ bản project: " + project.getProjectName());
        return response;
    }

    @Override
    public ProjectOverviewResponse getProjectOverview(Long projectId) {
        System.out.println("[getProjectOverview] Bắt đầu lấy thông tin tổng quan project với ID: " + projectId);

        // Tìm project theo ID
        Optional<ProjectEntity> projectOptional = projectRepository.findById(projectId);
        if (projectOptional.isEmpty()) {
            System.err.println("[getProjectOverview] Lỗi: Project không tồn tại với ID: " + projectId);
            throw new RuntimeException("Project không tồn tại với ID: " + projectId);
        }
        ProjectEntity project = projectOptional.get();
        System.out.println("[getProjectOverview] Tìm thấy project với tên: " + project.getProjectName());

        // Fetch các collections riêng biệt để tránh LazyInitializationException
        ProjectEntity projectWithDatabases = projectRepository.findByIdWithDatabases(projectId).orElse(project);
        ProjectEntity projectWithBackends = projectRepository.findByIdWithBackends(projectId).orElse(project);
        ProjectEntity projectWithFrontends = projectRepository.findByIdWithFrontends(projectId).orElse(project);

        // Tính toán stats cho databases
        List<ProjectDatabaseEntity> databases = projectWithDatabases.getDatabases() != null 
                ? projectWithDatabases.getDatabases() 
                : (project.getDatabases() != null ? project.getDatabases() : new java.util.ArrayList<>());
        
        ProjectOverviewResponse.ComponentStats databaseStats = new ProjectOverviewResponse.ComponentStats();
        databaseStats.setTotal(databases.size());
        databaseStats.setRunning((int) databases.stream().filter(db -> "RUNNING".equalsIgnoreCase(db.getStatus())).count());
        databaseStats.setPaused(0); // Paused không có trong database entity, có thể thêm sau
        databaseStats.setStopped((int) databases.stream().filter(db -> "STOPPED".equalsIgnoreCase(db.getStatus())).count());
        databaseStats.setError((int) databases.stream().filter(db -> "ERROR".equalsIgnoreCase(db.getStatus())).count());

        // Tính toán stats cho backends
        List<ProjectBackendEntity> backends = projectWithBackends.getBackends() != null 
                ? projectWithBackends.getBackends() 
                : (project.getBackends() != null ? project.getBackends() : new java.util.ArrayList<>());
        
        ProjectOverviewResponse.ComponentStats backendStats = new ProjectOverviewResponse.ComponentStats();
        backendStats.setTotal(backends.size());
        backendStats.setRunning((int) backends.stream().filter(be -> "RUNNING".equalsIgnoreCase(be.getStatus())).count());
        backendStats.setPaused(0); // Paused không có trong backend entity
        backendStats.setStopped((int) backends.stream().filter(be -> "STOPPED".equalsIgnoreCase(be.getStatus())).count());
        backendStats.setError((int) backends.stream().filter(be -> "ERROR".equalsIgnoreCase(be.getStatus())).count());

        // Tính toán stats cho frontends
        List<ProjectFrontendEntity> frontends = projectWithFrontends.getFrontends() != null 
                ? projectWithFrontends.getFrontends() 
                : (project.getFrontends() != null ? project.getFrontends() : new java.util.ArrayList<>());
        
        ProjectOverviewResponse.ComponentStats frontendStats = new ProjectOverviewResponse.ComponentStats();
        frontendStats.setTotal(frontends.size());
        frontendStats.setRunning((int) frontends.stream().filter(fe -> "RUNNING".equalsIgnoreCase(fe.getStatus())).count());
        frontendStats.setPaused(0); // Paused không có trong frontend entity
        frontendStats.setStopped((int) frontends.stream().filter(fe -> "STOPPED".equalsIgnoreCase(fe.getStatus())).count());
        frontendStats.setError((int) frontends.stream().filter(fe -> "ERROR".equalsIgnoreCase(fe.getStatus())).count());

        // Tạo response
        ProjectOverviewResponse response = new ProjectOverviewResponse();
        response.setId(project.getId());
        response.setProjectName(project.getProjectName());
        response.setDescription(project.getDescription());
        response.setCreatedAt(project.getCreatedAt());
        response.setUpdatedAt(project.getUpdatedAt() != null ? project.getUpdatedAt() : project.getCreatedAt());
        response.setUuid_k8s(project.getUuid_k8s());
        response.setNamespace(project.getNamespace());
        response.setDatabases(databaseStats);
        response.setBackends(backendStats);
        response.setFrontends(frontendStats);

        System.out.println("[getProjectOverview] Hoàn tất lấy thông tin tổng quan project: " + project.getProjectName() + 
                          ", databases: " + databaseStats.getTotal() + 
                          ", backends: " + backendStats.getTotal() + 
                          ", frontends: " + frontendStats.getTotal());
        return response;
    }

    @Override
    public ProjectDatabaseListResponse getProjectDatabases(Long projectId) {
        System.out.println("[getProjectDatabases] Bắt đầu lấy danh sách databases của project với ID: " + projectId);

        // Tìm project theo ID
        Optional<ProjectEntity> projectOptional = projectRepository.findById(projectId);
        if (projectOptional.isEmpty()) {
            System.err.println("[getProjectDatabases] Lỗi: Project không tồn tại với ID: " + projectId);
            throw new RuntimeException("Project không tồn tại với ID: " + projectId);
        }
        ProjectEntity project = projectOptional.get();
        System.out.println("[getProjectDatabases] Tìm thấy project với tên: " + project.getProjectName());

        // Fetch databases
        ProjectEntity projectWithDatabases = projectRepository.findByIdWithDatabases(projectId).orElse(project);
        List<ProjectDatabaseEntity> databases = projectWithDatabases.getDatabases() != null 
                ? projectWithDatabases.getDatabases() 
                : (project.getDatabases() != null ? project.getDatabases() : new java.util.ArrayList<>());

        // Map databases sang DTO
        List<ProjectDatabaseListResponse.DatabaseInfo> databaseInfos = databases.stream()
                .map(db -> {
                    ProjectDatabaseListResponse.DatabaseInfo info = new ProjectDatabaseListResponse.DatabaseInfo();
                    info.setId(db.getId());
                    info.setProjectName(db.getProjectName());
                    info.setDescription(db.getDescription());
                    info.setDatabaseType(db.getDatabaseType());
                    info.setDatabaseIp(db.getDatabaseIp());
                    info.setDatabasePort(db.getDatabasePort());
                    info.setDatabaseName(db.getDatabaseName());
                    info.setDatabaseUsername(db.getDatabaseUsername());
                    info.setDatabasePassword(db.getDatabasePassword());
                    info.setStatus(db.getStatus());
                    info.setCreatedAt(db.getCreatedAt());
                    return info;
                })
                .collect(Collectors.toList());

        // Tạo response
        ProjectDatabaseListResponse response = new ProjectDatabaseListResponse();
        response.setDatabases(databaseInfos);

        System.out.println("[getProjectDatabases] Hoàn tất lấy danh sách databases: " + databaseInfos.size() + " databases");
        return response;
    }

    @Override
    public ProjectBackendListResponse getProjectBackends(Long projectId) {
        System.out.println("[getProjectBackends] Bắt đầu lấy danh sách backends của project với ID: " + projectId);

        // Tìm project theo ID
        Optional<ProjectEntity> projectOptional = projectRepository.findById(projectId);
        if (projectOptional.isEmpty()) {
            System.err.println("[getProjectBackends] Lỗi: Project không tồn tại với ID: " + projectId);
            throw new RuntimeException("Project không tồn tại với ID: " + projectId);
        }
        ProjectEntity project = projectOptional.get();
        System.out.println("[getProjectBackends] Tìm thấy project với tên: " + project.getProjectName());

        // Fetch backends
        ProjectEntity projectWithBackends = projectRepository.findByIdWithBackends(projectId).orElse(project);
        List<ProjectBackendEntity> backends = projectWithBackends.getBackends() != null 
                ? projectWithBackends.getBackends() 
                : (project.getBackends() != null ? project.getBackends() : new java.util.ArrayList<>());

        // Map backends sang DTO
        List<ProjectBackendListResponse.BackendInfo> backendInfos = backends.stream()
                .map(be -> {
                    ProjectBackendListResponse.BackendInfo info = new ProjectBackendListResponse.BackendInfo();
                    info.setId(be.getId());
                    info.setProjectName(be.getProjectName());
                    info.setDescription(be.getDescription());
                    info.setDeploymentType(be.getDeploymentType());
                    info.setFrameworkType(be.getFrameworkType());
                    info.setDatabaseIp(be.getDatabaseIp());
                    info.setDatabasePort(be.getDatabasePort());
                    info.setDatabaseName(be.getDatabaseName());
                    info.setDatabaseUsername(be.getDatabaseUsername());
                    info.setDatabasePassword(be.getDatabasePassword());
                    info.setUuid_k8s(be.getUuid_k8s());
                    info.setSourcePath(be.getSourcePath());
                    info.setYamlPath(be.getYamlPath());
                    info.setDockerImage(be.getDockerImage());
                    info.setDomainNameSystem(be.getDomainNameSystem());
                    info.setStatus(be.getStatus());
                    info.setCreatedAt(be.getCreatedAt());
                    return info;
                })
                .collect(Collectors.toList());

        // Tạo response
        ProjectBackendListResponse response = new ProjectBackendListResponse();
        response.setBackends(backendInfos);

        System.out.println("[getProjectBackends] Hoàn tất lấy danh sách backends: " + backendInfos.size() + " backends");
        return response;
    }

    @Override
    public ProjectFrontendListResponse getProjectFrontends(Long projectId) {
        System.out.println("[getProjectFrontends] Bắt đầu lấy danh sách frontends của project với ID: " + projectId);

        // Tìm project theo ID
        Optional<ProjectEntity> projectOptional = projectRepository.findById(projectId);
        if (projectOptional.isEmpty()) {
            System.err.println("[getProjectFrontends] Lỗi: Project không tồn tại với ID: " + projectId);
            throw new RuntimeException("Project không tồn tại với ID: " + projectId);
        }
        ProjectEntity project = projectOptional.get();
        System.out.println("[getProjectFrontends] Tìm thấy project với tên: " + project.getProjectName());

        // Fetch frontends
        ProjectEntity projectWithFrontends = projectRepository.findByIdWithFrontends(projectId).orElse(project);
        List<ProjectFrontendEntity> frontends = projectWithFrontends.getFrontends() != null 
                ? projectWithFrontends.getFrontends() 
                : (project.getFrontends() != null ? project.getFrontends() : new java.util.ArrayList<>());

        // Map frontends sang DTO
        List<ProjectFrontendListResponse.FrontendInfo> frontendInfos = frontends.stream()
                .map(fe -> {
                    ProjectFrontendListResponse.FrontendInfo info = new ProjectFrontendListResponse.FrontendInfo();
                    info.setId(fe.getId());
                    info.setProjectName(fe.getProjectName());
                    info.setDescription(fe.getDescription());
                    info.setDeploymentType(fe.getDeploymentType());
                    info.setFrameworkType(fe.getFrameworkType());
                    info.setUuid_k8s(fe.getUuid_k8s());
                    info.setSourcePath(fe.getSourcePath());
                    info.setYamlPath(fe.getYamlPath());
                    info.setDockerImage(fe.getDockerImage());
                    info.setDomainNameSystem(fe.getDomainNameSystem());
                    info.setStatus(fe.getStatus());
                    info.setCreatedAt(fe.getCreatedAt());
                    return info;
                })
                .collect(Collectors.toList());

        // Tạo response
        ProjectFrontendListResponse response = new ProjectFrontendListResponse();
        response.setFrontends(frontendInfos);

        System.out.println("[getProjectFrontends] Hoàn tất lấy danh sách frontends: " + frontendInfos.size() + " frontends");
        return response;
    }

    @Override
    public void deleteProject(Long projectId, String username) {
        System.out.println("[deleteProject] Bắt đầu xóa project với ID: " + projectId + " cho user: " + username);

        // Tìm user theo username
        Optional<UserEntity> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            System.err.println("[deleteProject] Lỗi: User không tồn tại với username: " + username);
            throw new RuntimeException("User không tồn tại với username: " + username);
        }
        UserEntity user = userOptional.get();
        System.out.println("[deleteProject] Tìm thấy user với ID: " + user.getId());

        // Tìm project theo ID
        Optional<ProjectEntity> projectOptional = projectRepository.findById(projectId);
        if (projectOptional.isEmpty()) {
            System.err.println("[deleteProject] Lỗi: Project không tồn tại với ID: " + projectId);
            throw new RuntimeException("Project không tồn tại với ID: " + projectId);
        }
        ProjectEntity project = projectOptional.get();
        System.out.println("[deleteProject] Tìm thấy project với tên: " + project.getProjectName());

        // Validate project thuộc về user
        if (project.getUser() == null || !project.getUser().getId().equals(user.getId())) {
            System.err.println("[deleteProject] Lỗi: Project không thuộc về user này. Project user ID: " + 
                              (project.getUser() != null ? project.getUser().getId() : "null") + 
                              ", Request user ID: " + user.getId());
            throw new RuntimeException("Bạn không có quyền xóa project này");
        }

        // Xóa project (cascade sẽ xóa các databases, backends, frontends liên quan)
        projectRepository.delete(project);
        System.out.println("[deleteProject] Đã xóa project thành công: " + project.getProjectName());
    }

    @Override
    public ProjectDeploymentHistoryResponse getProjectDeploymentHistory(Long projectId) {
        System.out.println("[getProjectDeploymentHistory] Bắt đầu lấy lịch sử triển khai project với ID: " + projectId);

        // Tìm project theo ID
        Optional<ProjectEntity> projectOptional = projectRepository.findById(projectId);
        if (projectOptional.isEmpty()) {
            System.err.println("[getProjectDeploymentHistory] Lỗi: Project không tồn tại với ID: " + projectId);
            throw new RuntimeException("Project không tồn tại với ID: " + projectId);
        }
        ProjectEntity project = projectOptional.get();
        System.out.println("[getProjectDeploymentHistory] Tìm thấy project với tên: " + project.getProjectName());

        // Fetch các collections riêng biệt để tránh LazyInitializationException
        ProjectEntity projectWithDatabases = projectRepository.findByIdWithDatabases(projectId).orElse(project);
        ProjectEntity projectWithBackends = projectRepository.findByIdWithBackends(projectId).orElse(project);
        ProjectEntity projectWithFrontends = projectRepository.findByIdWithFrontends(projectId).orElse(project);

        // Tạo danh sách lịch sử triển khai
        List<ProjectDeploymentHistoryResponse.DeploymentHistoryItem> historyItems = new java.util.ArrayList<>();

        // Thêm project vào đầu danh sách
        ProjectDeploymentHistoryResponse.DeploymentHistoryItem projectItem = new ProjectDeploymentHistoryResponse.DeploymentHistoryItem();
        projectItem.setType("PROJECT");
        projectItem.setId(project.getId());
        projectItem.setName(project.getProjectName());
        projectItem.setDescription(project.getDescription());
        projectItem.setCreatedAt(project.getCreatedAt());
        historyItems.add(projectItem);

        // Thêm databases
        List<ProjectDatabaseEntity> databases = projectWithDatabases.getDatabases() != null 
                ? projectWithDatabases.getDatabases() 
                : (project.getDatabases() != null ? project.getDatabases() : new java.util.ArrayList<>());
        
        for (ProjectDatabaseEntity db : databases) {
            ProjectDeploymentHistoryResponse.DeploymentHistoryItem dbItem = new ProjectDeploymentHistoryResponse.DeploymentHistoryItem();
            dbItem.setType("DATABASE");
            dbItem.setId(db.getId());
            dbItem.setName(db.getProjectName());
            dbItem.setDescription(db.getDescription());
            dbItem.setCreatedAt(db.getCreatedAt());
            dbItem.setDatabaseType(db.getDatabaseType());
            historyItems.add(dbItem);
        }

        // Thêm backends
        List<ProjectBackendEntity> backends = projectWithBackends.getBackends() != null 
                ? projectWithBackends.getBackends() 
                : (project.getBackends() != null ? project.getBackends() : new java.util.ArrayList<>());
        
        for (ProjectBackendEntity be : backends) {
            ProjectDeploymentHistoryResponse.DeploymentHistoryItem beItem = new ProjectDeploymentHistoryResponse.DeploymentHistoryItem();
            beItem.setType("BACKEND");
            beItem.setId(be.getId());
            beItem.setName(be.getProjectName());
            beItem.setDescription(be.getDescription());
            beItem.setCreatedAt(be.getCreatedAt());
            beItem.setFrameworkType(be.getFrameworkType());
            beItem.setDeploymentType(be.getDeploymentType());
            historyItems.add(beItem);
        }

        // Thêm frontends
        List<ProjectFrontendEntity> frontends = projectWithFrontends.getFrontends() != null 
                ? projectWithFrontends.getFrontends() 
                : (project.getFrontends() != null ? project.getFrontends() : new java.util.ArrayList<>());
        
        for (ProjectFrontendEntity fe : frontends) {
            ProjectDeploymentHistoryResponse.DeploymentHistoryItem feItem = new ProjectDeploymentHistoryResponse.DeploymentHistoryItem();
            feItem.setType("FRONTEND");
            feItem.setId(fe.getId());
            feItem.setName(fe.getProjectName());
            feItem.setDescription(fe.getDescription());
            feItem.setCreatedAt(fe.getCreatedAt());
            feItem.setFrameworkType(fe.getFrameworkType());
            feItem.setDeploymentType(fe.getDeploymentType());
            historyItems.add(feItem);
        }

        // Sắp xếp theo thời gian tạo (từ mới nhất đến cũ nhất)
        historyItems.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        // Tạo response
        ProjectDeploymentHistoryResponse response = new ProjectDeploymentHistoryResponse();
        response.setProjectId(project.getId());
        response.setProjectName(project.getProjectName());
        response.setProjectCreatedAt(project.getCreatedAt());
        response.setHistoryItems(historyItems);

        System.out.println("[getProjectDeploymentHistory] Hoàn tất lấy lịch sử triển khai: " + historyItems.size() + " items");
        return response;
    }
}

