package my_spring_app.my_spring_app.controller;

import jakarta.validation.Valid;
import my_spring_app.my_spring_app.dto.reponse.CreateServerResponse;
import my_spring_app.my_spring_app.dto.reponse.ServerResponse;
import my_spring_app.my_spring_app.dto.reponse.TestSshResponse;
import my_spring_app.my_spring_app.dto.request.CreateServerRequest;
import my_spring_app.my_spring_app.dto.request.UpdateServerRequest;
import my_spring_app.my_spring_app.dto.request.TestSshRequest;
import my_spring_app.my_spring_app.entity.ServerEntity;
import my_spring_app.my_spring_app.service.ServerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/servers")
public class ServerController {

    @Autowired
    private ServerService serverService;

    /**
     * Lấy tất cả servers
     */
    @GetMapping
    public ResponseEntity<List<ServerResponse>> getAllServers() {
        return ResponseEntity.ok(serverService.findAll());
    }

    /**
     * Lấy server theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ServerResponse> getServerById(@PathVariable Long id) {
        try {
            ServerResponse response = serverService.findById(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Tạo server mới
     */
    @PostMapping
    public ResponseEntity<?> createServer(@Valid @RequestBody CreateServerRequest request) {
        try {
            CreateServerResponse response = serverService.createServer(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "VALIDATION_ERROR", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "INTERNAL_ERROR", "message", "Lỗi khi tạo server: " + e.getMessage()));
        }
    }

    /**
     * Cập nhật server
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateServer(@PathVariable Long id, @RequestBody UpdateServerRequest request) {
        try {
            ServerResponse response = serverService.updateServer(id, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "UPDATE_ERROR", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "INTERNAL_ERROR", "message", "Lỗi khi cập nhật server: " + e.getMessage()));
        }
    }

    /**
     * Xóa server
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteServer(@PathVariable Long id) {
        try {
            serverService.deleteServer(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "DELETE_ERROR", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "INTERNAL_ERROR", "message", "Lỗi khi xóa server: " + e.getMessage()));
        }
    }

    /**
     * Test SSH connection
     */
    @PostMapping("/test-ssh")
    public ResponseEntity<TestSshResponse> testSsh(@Valid @RequestBody TestSshRequest request) {
        TestSshResponse response = serverService.testSsh(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Kiểm tra và cập nhật trạng thái tất cả servers
     * Ping tất cả servers và tự động cập nhật ONLINE/OFFLINE
     * 
     * @param includeMetrics Query param: có lấy metrics không (default: false)
     */
    @PostMapping("/check-status")
    public ResponseEntity<?> checkAllStatuses(@RequestParam(required = false, defaultValue = "false") boolean includeMetrics) {
        try {
            List<ServerResponse> servers = serverService.checkAllStatuses(2000, includeMetrics);
            String message = includeMetrics 
                ? "Đã kiểm tra trạng thái và cập nhật metrics cho " + servers.size() + " servers"
                : "Đã kiểm tra và cập nhật trạng thái " + servers.size() + " servers";
            return ResponseEntity.ok(Map.of(
                    "servers", servers,
                    "message", message
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "INTERNAL_ERROR", "message", "Lỗi khi kiểm tra status: " + e.getMessage()));
        }
    }

    /**
     * Cập nhật trạng thái server (ONLINE/OFFLINE/DISABLED)
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateServerStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String statusStr = body.get("status");
            if (statusStr == null || statusStr.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "VALIDATION_ERROR", "message", "Status không được để trống"));
            }
            
            ServerEntity.ServerStatus status;
            try {
                status = ServerEntity.ServerStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "VALIDATION_ERROR", "message", "Status không hợp lệ. Chỉ hỗ trợ ONLINE, OFFLINE, DISABLED"));
            }
            
            ServerResponse response = serverService.updateServerStatus(id, status);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "UPDATE_ERROR", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "INTERNAL_ERROR", "message", "Lỗi khi cập nhật status: " + e.getMessage()));
        }
    }
}


