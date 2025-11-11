package my_spring_app.my_spring_app.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "project_database")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDatabaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_name", nullable = false)
    private String projectName;

    @Column(name = "database_type", nullable = false)
    private String databaseType; // MYSQL, MONGODB

    @Column(name = "database_ip", nullable = false)
    private String databaseIp;

    @Column(name = "database_port", nullable = false)
    private Integer databasePort;

    @Column(name = "database_username", nullable = false)
    private String databaseUsername;

    @Column(name = "database_password", nullable = false)
    private String databasePassword;

    @Column(name = "database_file", nullable = true)
    private String databaseFile;

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

