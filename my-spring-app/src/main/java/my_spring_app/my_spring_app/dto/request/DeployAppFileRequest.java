package my_spring_app.my_spring_app.dto.request;

import jakarta.validation.constraints.NotBlank;
import org.springframework.web.multipart.MultipartFile;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeployAppFileRequest {

    @NotBlank(message = "Name không được để trống")
    private String name;

    @NotBlank(message = "Framework type không được để trống")
    private String frameworkType; // react, vue, angular, spring, node
    
    @NotBlank(message = "Deployment type không được để trống")
    private String deploymentType; // docker, file

    private String dockerImage; // docker image
    
    // File nén (.zip) người dùng upload khi deploymentType = file
    private MultipartFile file;
    
    @NotBlank(message = "username không được để trống")
    private String username;

}

