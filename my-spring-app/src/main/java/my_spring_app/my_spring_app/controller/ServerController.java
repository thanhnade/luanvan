package my_spring_app.my_spring_app.controller;

import jakarta.validation.Valid;
import my_spring_app.my_spring_app.dto.reponse.CreateServerResponse;
import my_spring_app.my_spring_app.dto.request.CreateServerRequest;
import my_spring_app.my_spring_app.entity.ServerEntity;
import my_spring_app.my_spring_app.service.ServerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping
    public ResponseEntity<CreateServerResponse> createServer(@Valid @RequestBody CreateServerRequest request) {
        CreateServerResponse response = serverService.createServer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}


