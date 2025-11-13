package my_spring_app.my_spring_app.dto.reponse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateServerResponse {

    private Long id;
    private String name;
    private String ip;
    private Integer port;
    private String username;
    private String role;
    private String serverStatus;
    private String clusterStatus;
    private LocalDateTime createdAt;
}

