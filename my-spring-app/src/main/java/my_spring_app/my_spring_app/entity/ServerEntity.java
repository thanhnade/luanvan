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

    public enum ServerStatus {
        ONLINE, OFFLINE, DISABLED
    }

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
    private String role; // MASTER, WORKER, DOCKER, ANSIBLE

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private ServerStatus status = ServerStatus.OFFLINE; // ONLINE, OFFLINE, DISABLED

    @Column(name = "server_status", nullable = false)
    private String serverStatus; // RUNNING, STOPPED, BUILDING, ERROR (trạng thái hoạt động)

    @Column(name = "cluster_status", nullable = false)
    private String clusterStatus; // AVAILABLE, UNAVAILABLE

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // Metrics fields (optional - có thể null)
    @Column(name = "cpu_cores", length = 20)
    private String cpuCores; // Số CPU cores, ví dụ: "4"

    @Column(name = "cpu_used", length = 20)
    private String cpuUsed; // CPU đang dùng (load average hoặc cores), ví dụ: "1.2", "1"

    @Column(name = "ram_total", length = 20)
    private String ramTotal; // Tổng RAM, ví dụ: "8.0Gi", "16G"

    @Column(name = "ram_used", length = 20)
    private String ramUsed; // RAM đang dùng, ví dụ: "2.0Gi", "4G"

    @Column(name = "disk_total", length = 20)
    private String diskTotal; // Tổng Disk, ví dụ: "50G", "100Gi"

    @Column(name = "disk_used", length = 20)
    private String diskUsed; // Disk đang dùng, ví dụ: "20G", "40Gi"

    // SSH Key relationship (optional)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ssh_key_id")
    private SshKeyEntity sshKey;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}


