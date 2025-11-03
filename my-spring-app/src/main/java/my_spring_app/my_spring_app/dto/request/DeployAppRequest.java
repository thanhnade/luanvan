package my_spring_app.my_spring_app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeployAppRequest {

    @NotBlank(message = "Name không được để trống")
    private String name;

    @NotBlank(message = "Framework type không được để trống")
    private String frameworkType; // react, vue, angular, spring, node
    
    @NotBlank(message = "Deployment type không được để trống")
    private String deploymentType; // docker, file

    private String dockerImage; // docker image
    
    private String filePath; // file path
    
    @NotBlank(message = "username không được để trống")
    private String username;

    // SSH connection info
    private String sshHost;
    private Integer sshPort;
    private String sshUsername;
    private String sshPassword;
}

