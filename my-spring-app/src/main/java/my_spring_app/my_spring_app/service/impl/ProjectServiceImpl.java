package my_spring_app.my_spring_app.service.impl;

import my_spring_app.my_spring_app.dto.reponse.CreateProjectResponse;
import my_spring_app.my_spring_app.dto.reponse.ProjectSummaryResponse;
import my_spring_app.my_spring_app.dto.request.CreateProjectRequest;
import my_spring_app.my_spring_app.entity.ProjectEntity;
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
}

