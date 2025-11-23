package my_spring_app.my_spring_app.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "servers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String ip;

    @Column(nullable = false)
    private Integer port;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // MASTER, WORKER, DOCKER

    @Column(name = "server_status", nullable = false)
    private String serverStatus; // RUNNING, STOPPED, BUILDING, ERROR

    @Column(name = "cluster_status", nullable = false)
    private String clusterStatus; // AVAILABLE, UNAVAILABLE

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}


