package my_spring_app.my_spring_app.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "project_frontend")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectFrontendEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_name", nullable = false)
    private String projectName;

    @Column(nullable = false)
    private String frameworkType; // REACT, VUE, ANGULAR

    @Column(name = "deployment_method", nullable = false)
    private String deploymentMethod; // DOCKER, FILE

    @Column(name = "domain_name_system", nullable = true)
    private String domainNameSystem;
    
    @Column(name = "docker_image", nullable = true)
    private String dockerImage;

    @Column(name = "source_path", nullable = true)
    private String sourcePath;
    
    @Column(name = "deployment_path", nullable = true)
    private String deploymentPath;

    @Column(nullable = false)
    private String status; // RUNNING, STOPPED, ERROR

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

