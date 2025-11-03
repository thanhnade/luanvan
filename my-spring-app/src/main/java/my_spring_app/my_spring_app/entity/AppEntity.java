package my_spring_app.my_spring_app.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "apps")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "framework_type", nullable = false)
    private String frameworkType; // react, vue, angular, spring, node

    @Column(name = "deployment_type", nullable = false)
    private String deploymentType; // docker, file

    @Column(name = "docker_image", nullable = true)
    private String dockerImage = null;

    @Column(name = "file_path", nullable = true)
    private String filePath = null;

    @Column(name = "url", nullable = true)
    private String url = null;

    @Column(nullable = false)
    private String status; // running, stopped, building, error

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;
}

