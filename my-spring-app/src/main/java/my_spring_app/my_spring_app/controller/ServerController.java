package my_spring_app.my_spring_app.controller;

import my_spring_app.my_spring_app.entity.ServerEntity;
import my_spring_app.my_spring_app.service.ServerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/servers")
public class ServerController {

    @Autowired
    private ServerService serverService;

    @GetMapping
    public ResponseEntity<List<ServerEntity>> getAllServers() {
        return ResponseEntity.ok(serverService.findAll());
    }
}


