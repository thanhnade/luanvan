package my_spring_app.my_spring_app.service.impl;

import my_spring_app.my_spring_app.dto.reponse.CreateProjectResponse;
import my_spring_app.my_spring_app.dto.request.CreateProjectRequest;
import my_spring_app.my_spring_app.entity.ProjectEntity;
import my_spring_app.my_spring_app.entity.UserEntity;
import my_spring_app.my_spring_app.repository.ProjectRepository;
import my_spring_app.my_spring_app.repository.UserRepository;
import my_spring_app.my_spring_app.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

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
        projectEntity.setNamespace(request.getNamespace());
        projectEntity.setUuid_k8s(uuid_k8s);
        projectEntity.setUser(user);
        System.out.println("[createProject] Đã thiết lập thông tin project: projectName=" + request.getProjectName() + ", namespace=" + request.getNamespace() + ", uuid_k8s=" + uuid_k8s);

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
}

