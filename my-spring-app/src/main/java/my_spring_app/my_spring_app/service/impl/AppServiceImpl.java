package my_spring_app.my_spring_app.service.impl;

import my_spring_app.my_spring_app.dto.reponse.DeployAppResponse;
import my_spring_app.my_spring_app.dto.request.DeployAppRequest;
import my_spring_app.my_spring_app.entity.AppEntity;
import my_spring_app.my_spring_app.entity.UserEntity;
import my_spring_app.my_spring_app.repository.AppRepository;
import my_spring_app.my_spring_app.repository.UserRepository;
import my_spring_app.my_spring_app.service.AppService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class AppServiceImpl implements AppService {

    @Autowired
    private AppRepository appRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public DeployAppResponse deployApp(DeployAppRequest request) {
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

        // Phân nhánh theo deploymentType
        DeployAppResponse response;
        if ("docker".equalsIgnoreCase(request.getDeploymentType())) {
            // Validate dockerImage
            if (request.getDockerImage() == null || request.getDockerImage().trim().isEmpty()) {
                throw new RuntimeException("Docker image không được để trống khi deployment type là docker");
            }
            
            appEntity.setDockerImage(request.getDockerImage());
            
            // Gọi hàm triển khai docker
            response = deployWithDocker(appEntity);
        } else if ("file".equalsIgnoreCase(request.getDeploymentType())) {
            // Validate filePath
            if (request.getFilePath() == null || request.getFilePath().trim().isEmpty()) {
                throw new RuntimeException("File path không được để trống khi deployment type là file");
            }
            
            appEntity.setFilePath(request.getFilePath());
            
            // Gọi hàm triển khai file
            response = deployWithFile(appEntity);
        } else {
            throw new RuntimeException("Deployment type không hợp lệ. Chỉ chấp nhận 'docker' hoặc 'file'");
        }

        // Lưu AppEntity vào database
        AppEntity savedAppEntity = appRepository.save(appEntity);

        // Cập nhật response với thông tin từ database
        response.setStatus(savedAppEntity.getStatus());

        return response;
    }

    /**
     * Hàm triển khai ứng dụng với Docker image
     */
    private DeployAppResponse deployWithDocker(AppEntity appEntity) {
        // TODO: Implement logic triển khai Docker
        // Ví dụ: Pull Docker image, chạy container, expose port, etc.
        
        // Simulate deployment process
        try {
            // Giả lập quá trình deploy Docker
            // Trong thực tế sẽ gọi Docker API hoặc Kubernetes API
            System.out.println("Đang triển khai Docker image: " + appEntity.getDockerImage());
            
            // Simulate: sau khi deploy thành công
            appEntity.setStatus("running");
            String generatedUrl = "https://" + appEntity.getName().toLowerCase().replaceAll("\\s+", "-") + ".example.com";
            
            DeployAppResponse response = new DeployAppResponse();
            response.setUrl(generatedUrl);
            response.setStatus(appEntity.getStatus());
            
            return response;
        } catch (Exception e) {
            appEntity.setStatus("error");
            throw new RuntimeException("Lỗi khi triển khai Docker: " + e.getMessage());
        }
    }

    /**
     * Hàm triển khai ứng dụng với File upload
     */
    private DeployAppResponse deployWithFile(AppEntity appEntity) {
        // TODO: Implement logic triển khai File
        // Ví dụ: Build từ source code, deploy lên server, etc.
        
        // Simulate deployment process
        try {
            // Giả lập quá trình deploy File
            // Trong thực tế sẽ build source code, deploy lên hosting server
            System.out.println("Đang triển khai File từ path: " + appEntity.getFilePath());
            
            // Simulate: sau khi deploy thành công
            appEntity.setStatus("running");
            String generatedUrl = "https://" + appEntity.getName().toLowerCase().replaceAll("\\s+", "-") + ".example.com";
            
            DeployAppResponse response = new DeployAppResponse();
            response.setUrl(generatedUrl);
            response.setStatus(appEntity.getStatus());
            
            return response;
        } catch (Exception e) {
            appEntity.setStatus("error");
            throw new RuntimeException("Lỗi khi triển khai File: " + e.getMessage());
        }
    }
}

