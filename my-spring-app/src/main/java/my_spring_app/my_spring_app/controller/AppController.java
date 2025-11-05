package my_spring_app.my_spring_app.controller;

import jakarta.validation.Valid;
import my_spring_app.my_spring_app.dto.reponse.DeployAppDockerResponse;
import my_spring_app.my_spring_app.dto.reponse.DeployAppFileResponse;
import my_spring_app.my_spring_app.dto.reponse.DeployAppResponse;
import my_spring_app.my_spring_app.dto.reponse.ListAppsResponse;
import my_spring_app.my_spring_app.dto.request.DeployAppDockerRequest;
import my_spring_app.my_spring_app.dto.request.DeployAppFileRequest;
import my_spring_app.my_spring_app.dto.request.DeployAppRequest;
import my_spring_app.my_spring_app.dto.request.GetAppsByUserRequest;
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

//    @PostMapping("/deploy")
//    public ResponseEntity<DeployAppResponse> deployApp(@Valid @RequestBody DeployAppRequest request) {
//        DeployAppResponse response = appService.deployApp(request);
//        return ResponseEntity.status(HttpStatus.CREATED).body(response);
//    }

    @PostMapping("/deploy-docker")
    public ResponseEntity<DeployAppDockerResponse> deployAppDocker(@Valid @RequestBody DeployAppDockerRequest request) {
        DeployAppDockerResponse response = appService.deployAppDocker(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

//    @PostMapping("/deploy-docker")
//    public ResponseEntity<DeployAppFileResponse> deployAppDocker(@Valid @RequestBody DeployAppFileRequest request) {
//        DeployAppDockerResponse response = appService.deployAppFile(request);
//        return ResponseEntity.status(HttpStatus.CREATED).body(response);
//    }

    @PostMapping("/by-user")
    public ResponseEntity<ListAppsResponse> getAppsByUser(@Valid @RequestBody GetAppsByUserRequest request) {
        ListAppsResponse response = appService.getAppsByUser(request);
        return ResponseEntity.ok(response);
    }
}

