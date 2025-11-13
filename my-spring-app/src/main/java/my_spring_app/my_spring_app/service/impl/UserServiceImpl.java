package my_spring_app.my_spring_app.service.impl;

import my_spring_app.my_spring_app.dto.reponse.CreateUserResponse;
import my_spring_app.my_spring_app.dto.reponse.GetUserProjectsResponse;
import my_spring_app.my_spring_app.dto.reponse.LoginResponse;
import my_spring_app.my_spring_app.dto.request.CreateUserRequest;
import my_spring_app.my_spring_app.dto.request.GetUserProjectsRequest;
import my_spring_app.my_spring_app.dto.request.LoginRequest;
import my_spring_app.my_spring_app.entity.ProjectBackendEntity;
import my_spring_app.my_spring_app.entity.ProjectDatabaseEntity;
import my_spring_app.my_spring_app.entity.ProjectFrontendEntity;
import my_spring_app.my_spring_app.entity.UserEntity;
import my_spring_app.my_spring_app.repository.ProjectBackendRepository;
import my_spring_app.my_spring_app.repository.ProjectDatabaseRepository;
import my_spring_app.my_spring_app.repository.ProjectFrontendRepository;
import my_spring_app.my_spring_app.repository.UserRepository;
import my_spring_app.my_spring_app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ProjectFrontendRepository projectFrontendRepository;

    @Autowired
    private ProjectBackendRepository projectBackendRepository;

    @Autowired
    private ProjectDatabaseRepository projectDatabaseRepository;

    @Override
    public CreateUserResponse createUser(CreateUserRequest request) {
        System.out.println("[createUser] Bắt đầu tạo user mới với username: " + request.getUsername());
        
        // Kiểm tra password và confirmPassword có khớp nhau không
        System.out.println("[createUser] Kiểm tra password và confirmPassword có khớp nhau không");
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            System.err.println("[createUser] Lỗi: Mật khẩu xác nhận không khớp");
            throw new RuntimeException("Mật khẩu xác nhận không khớp");
        }
        System.out.println("[createUser] Password và confirmPassword khớp nhau");

        // Kiểm tra username đã tồn tại chưa
        System.out.println("[createUser] Kiểm tra username đã tồn tại chưa: " + request.getUsername());
        if (userRepository.existsByUsername(request.getUsername())) {
            System.err.println("[createUser] Lỗi: Username đã tồn tại: " + request.getUsername());
            throw new RuntimeException("Username đã tồn tại");
        }
        System.out.println("[createUser] Username chưa tồn tại, có thể tạo user mới");

        // Tạo user mới
        System.out.println("[createUser] Tạo UserEntity mới");
        UserEntity userEntity = new UserEntity();
        userEntity.setFullname(request.getFullname());
        userEntity.setUsername(request.getUsername());
        userEntity.setPassword(passwordEncoder.encode(request.getPassword()));
        userEntity.setStatus("ACTIVE");
        userEntity.setRole("USER");
        System.out.println("[createUser] Đã thiết lập thông tin user: fullname=" + request.getFullname() + ", username=" + request.getUsername() + ", role=USER, status=ACTIVE");

        // Lưu vào database
        System.out.println("[createUser] Lưu user vào database");
        UserEntity savedUserEntity = userRepository.save(userEntity);
        System.out.println("[createUser] Đã lưu user thành công với ID: " + savedUserEntity.getId());

        // Chuyển đổi sang UserResponse
        System.out.println("[createUser] Chuyển đổi sang CreateUserResponse");
        CreateUserResponse response = new CreateUserResponse();
        response.setId(savedUserEntity.getId());
        response.setFullname(savedUserEntity.getFullname());
        response.setUsername(savedUserEntity.getUsername());
        response.setStatus(savedUserEntity.getStatus());
        response.setRole(savedUserEntity.getRole());

        System.out.println("[createUser] Hoàn tất tạo user thành công: username=" + savedUserEntity.getUsername() + ", id=" + savedUserEntity.getId());
        return response;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        System.out.println("[login] Bắt đầu đăng nhập với username: " + request.getUsername());
        
        // Tìm user theo username
        System.out.println("[login] Tìm user theo username: " + request.getUsername());
        Optional<UserEntity> userOptional = userRepository.findByUsername(request.getUsername());
        
        if (userOptional.isEmpty()) {
            System.err.println("[login] Lỗi: Không tìm thấy user với username: " + request.getUsername());
            throw new RuntimeException("Username hoặc password không đúng");
        }

        UserEntity userEntity = userOptional.get();
        System.out.println("[login] Tìm thấy user với ID: " + userEntity.getId());

        // Kiểm tra password
        System.out.println("[login] Kiểm tra password");
        if (!passwordEncoder.matches(request.getPassword(), userEntity.getPassword())) {
            System.err.println("[login] Lỗi: Password không đúng cho username: " + request.getUsername());
            throw new RuntimeException("Username hoặc password không đúng");
        }
        System.out.println("[login] Password đúng");

        // Kiểm tra status
        System.out.println("[login] Kiểm tra status của user: " + userEntity.getStatus());
        if (!"ACTIVE".equalsIgnoreCase(userEntity.getStatus())) {
            System.err.println("[login] Lỗi: Tài khoản đã bị vô hiệu hóa với status: " + userEntity.getStatus());
            throw new RuntimeException("Tài khoản đã bị vô hiệu hóa");
        }
        System.out.println("[login] User có status ACTIVE, cho phép đăng nhập");

        // Tạo response
        System.out.println("[login] Tạo LoginResponse");
        LoginResponse response = new LoginResponse();
        response.setFullname(userEntity.getFullname());
        response.setUsername(userEntity.getUsername());
        response.setRole(userEntity.getRole());

        System.out.println("[login] Hoàn tất đăng nhập thành công: username=" + userEntity.getUsername() + ", role=" + userEntity.getRole());
        return response;
    }

    @Override
    public GetUserProjectsResponse getUserProjects(GetUserProjectsRequest request) {
        System.out.println("[getUserProjects] Bắt đầu lấy danh sách projects cho user: " + request.getUsername());
        
        // Tìm user theo username (không fetch collections để tránh MultipleBagFetchException)
        System.out.println("[getUserProjects] Tìm user theo username: " + request.getUsername());
        Optional<UserEntity> userOptional = userRepository.findByUsername(request.getUsername());
        
        if (userOptional.isEmpty()) {
            System.err.println("[getUserProjects] Lỗi: Không tìm thấy user với username: " + request.getUsername());
            throw new RuntimeException("User không tồn tại");
        }
        
        UserEntity userEntity = userOptional.get();
        System.out.println("[getUserProjects] Tìm thấy user với ID: " + userEntity.getId());
        
        // Khởi tạo danh sách projects
        List<GetUserProjectsResponse.ProjectItem> projects = new ArrayList<>();
        
        // Lấy frontend projects từ repository (query riêng biệt để tránh MultipleBagFetchException)
        System.out.println("[getUserProjects] Lấy frontend projects từ repository");
        List<ProjectFrontendEntity> frontendEntities = projectFrontendRepository.findByUser(userEntity);
        List<GetUserProjectsResponse.ProjectItem> frontendProjects = frontendEntities.stream()
                .map(frontend -> {
                    GetUserProjectsResponse.ProjectItem item = new GetUserProjectsResponse.ProjectItem();
                    item.setId(frontend.getId());
                    item.setProjectName(frontend.getProjectName());
                    item.setProjectType("FRONTEND");
                    item.setFrameworkType(frontend.getFrameworkType());
                    item.setDeploymentType(frontend.getDeploymentMethod());
                    item.setDomainNameSystem(frontend.getDomainNameSystem());
                    item.setStatus(frontend.getStatus());
                    item.setCreatedAt(frontend.getCreatedAt());
                    item.setDockerImage(frontend.getDockerImage());
                    item.setSourcePath(frontend.getSourcePath());
                    item.setDeploymentPath(frontend.getDeploymentPath());
                    return item;
                })
                .collect(Collectors.toList());
        projects.addAll(frontendProjects);
        System.out.println("[getUserProjects] Đã lấy " + frontendProjects.size() + " frontend projects");
        
        // Lấy backend projects từ repository (query riêng biệt để tránh MultipleBagFetchException)
        System.out.println("[getUserProjects] Lấy backend projects từ repository");
        List<ProjectBackendEntity> backendEntities = projectBackendRepository.findByUser(userEntity);
        List<GetUserProjectsResponse.ProjectItem> backendProjects = backendEntities.stream()
                .map(backend -> {
                    GetUserProjectsResponse.ProjectItem item = new GetUserProjectsResponse.ProjectItem();
                    item.setId(backend.getId());
                    item.setProjectName(backend.getProjectName());
                    item.setProjectType("BACKEND");
                    item.setFrameworkType(backend.getFrameworkType());
                    item.setDeploymentType(backend.getDeploymentMethod());
                    item.setDomainNameSystem(backend.getDomainNameSystem());
                    item.setStatus(backend.getStatus());
                    item.setCreatedAt(backend.getCreatedAt());
                    item.setDockerImage(backend.getDockerImage());
                    item.setSourcePath(backend.getSourcePath());
                    item.setDeploymentPath(backend.getDeploymentPath());
                    item.setDatabaseIp(backend.getDatabaseIp());
                    item.setDatabasePort(backend.getDatabasePort());
                    item.setDatabaseName(backend.getDatabaseName());
                    item.setDatabaseUsername(backend.getDatabaseUsername());
                    item.setDatabasePassword(backend.getDatabasePassword());
                    return item;
                })
                .collect(Collectors.toList());
        projects.addAll(backendProjects);
        System.out.println("[getUserProjects] Đã lấy " + backendProjects.size() + " backend projects");
        
        // Lấy database projects từ repository (query riêng biệt để tránh MultipleBagFetchException)
        System.out.println("[getUserProjects] Lấy database projects từ repository");
        List<ProjectDatabaseEntity> databaseEntities = projectDatabaseRepository.findByUser(userEntity);
        List<GetUserProjectsResponse.ProjectItem> databaseProjects = databaseEntities.stream()
                .map(database -> {
                    GetUserProjectsResponse.ProjectItem item = new GetUserProjectsResponse.ProjectItem();
                    item.setId(database.getId());
                    item.setProjectName(database.getProjectName());
                    item.setProjectType("DATABASE");
                    item.setFrameworkType(database.getDatabaseType());
                    item.setStatus(database.getStatus());
                    item.setCreatedAt(database.getCreatedAt());
                    item.setDatabaseIp(database.getDatabaseIp());
                    item.setDatabasePort(database.getDatabasePort());
                    item.setDatabaseName(database.getDatabaseName());
                    item.setDatabaseUsername(database.getDatabaseUsername());
                    item.setDatabasePassword(database.getDatabasePassword());
                    item.setDatabaseFile(database.getDatabaseFile());
                    return item;
                })
                .collect(Collectors.toList());
        projects.addAll(databaseProjects);
        System.out.println("[getUserProjects] Đã lấy " + databaseProjects.size() + " database projects");
        
        System.out.println("[getUserProjects] Tổng cộng " + projects.size() + " projects");
        
        // Tạo response
        GetUserProjectsResponse response = new GetUserProjectsResponse();
        response.setProjects(projects);
        
        System.out.println("[getUserProjects] Hoàn tất lấy danh sách projects cho user: " + request.getUsername());
        return response;
    }

}

