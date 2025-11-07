package my_spring_app.my_spring_app.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeployAppDockerRequest {

    @NotBlank(message = "Name không được để trống")
    private String name;

    @NotBlank(message = "Framework type không được để trống")
    private String frameworkType; // react, vue, angular, spring, nodejs
    
    @NotBlank(message = "Deployment type không được để trống")
    private String deploymentType; // docker, file

    private String dockerImage; // docker image
    
    private String filePath; // file path

    private String databaseName; // database name

    // File database (.zip người dùng upload khi deploymentType = file và frameworkType = spring, nodejs
    private MultipartFile databaseFile;
    
    @NotBlank(message = "username không được để trống")
    private String username;

}

