package my_spring_app.my_spring_app.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeployDatabaseRequest {

    @NotBlank(message = "Project name không được để trống")
    private String projectName;

    @NotBlank(message = "Framework type không được để trống")
    private String databseType; // MYSQL, MONGODB

    private String databaseName;

    private String databaseUsername;

    private String databasePassword;

    private MultipartFile file;

    @NotBlank(message = "username không được để trống")
    private String username;

}

