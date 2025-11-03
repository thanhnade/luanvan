package my_spring_app.my_spring_app.controller;

import jakarta.validation.Valid;
import my_spring_app.my_spring_app.dto.reponse.DeployAppResponse;
import my_spring_app.my_spring_app.dto.request.DeployAppRequest;
import my_spring_app.my_spring_app.service.AppService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/apps")
public class AppController {

    @Autowired
    private AppService appService;

    @PostMapping("/deploy")
    public ResponseEntity<DeployAppResponse> deployApp(@Valid @RequestBody DeployAppRequest request) {
        DeployAppResponse response = appService.deployApp(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

