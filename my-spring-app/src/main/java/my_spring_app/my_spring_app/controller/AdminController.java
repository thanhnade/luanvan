package my_spring_app.my_spring_app.controller;

import my_spring_app.my_spring_app.dto.reponse.AdminOverviewResponse;
import my_spring_app.my_spring_app.dto.reponse.AdminUserUsageResponse;
import my_spring_app.my_spring_app.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/user-services/overview")
    public ResponseEntity<AdminOverviewResponse> getOverview() {
        AdminOverviewResponse response = adminService.getOverview();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user-services/users")
    public ResponseEntity<AdminUserUsageResponse> getUserUsage() {
        AdminUserUsageResponse response = adminService.getUserResourceOverview();
        return ResponseEntity.ok(response);
    }
}