package my_spring_app.my_spring_app.service.impl;

import my_spring_app.my_spring_app.dto.reponse.CreateUserResponse;
import my_spring_app.my_spring_app.dto.reponse.LoginResponse;
import my_spring_app.my_spring_app.dto.request.CreateUserRequest;
import my_spring_app.my_spring_app.dto.request.LoginRequest;
import my_spring_app.my_spring_app.entity.UserEntity;
import my_spring_app.my_spring_app.repository.UserRepository;
import my_spring_app.my_spring_app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public CreateUserResponse createUser(CreateUserRequest request) {
        // Kiểm tra password và confirmPassword có khớp nhau không
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu xác nhận không khớp");
        }

        // Kiểm tra username đã tồn tại chưa
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username đã tồn tại");
        }

        // Tạo user mới
        UserEntity userEntity = new UserEntity();
        userEntity.setFullname(request.getFullname());
        userEntity.setUsername(request.getUsername());
        userEntity.setPassword(passwordEncoder.encode(request.getPassword()));
        userEntity.setStatus("active");
        userEntity.setRole("user");

        // Lưu vào database
        UserEntity savedUserEntity = userRepository.save(userEntity);

        // Chuyển đổi sang UserResponse
        CreateUserResponse response = new CreateUserResponse();
        response.setId(savedUserEntity.getId());
        response.setFullname(savedUserEntity.getFullname());
        response.setUsername(savedUserEntity.getUsername());
        response.setStatus(savedUserEntity.getStatus());
        response.setRole(savedUserEntity.getRole());

        return response;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        // Tìm user theo username
        Optional<UserEntity> userOptional = userRepository.findByUsername(request.getUsername());
        
        if (userOptional.isEmpty()) {
            throw new RuntimeException("Username hoặc password không đúng");
        }

        UserEntity userEntity = userOptional.get();

        // Kiểm tra password
        if (!passwordEncoder.matches(request.getPassword(), userEntity.getPassword())) {
            throw new RuntimeException("Username hoặc password không đúng");
        }

        // Kiểm tra status
        if (!"active".equals(userEntity.getStatus())) {
            throw new RuntimeException("Tài khoản đã bị vô hiệu hóa");
        }

        // Tạo response
        LoginResponse response = new LoginResponse();
        response.setFullname(userEntity.getFullname());
        response.setUsername(userEntity.getUsername());
        response.setRole(userEntity.getRole());

        return response;
    }

}

