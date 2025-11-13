package my_spring_app.my_spring_app.controller;

import jakarta.validation.Valid;
import my_spring_app.my_spring_app.dto.reponse.DeployBackendResponse;
import my_spring_app.my_spring_app.dto.reponse.DeployFrontendResponse;
import my_spring_app.my_spring_app.dto.reponse.ListProjectBackendResponse;
import my_spring_app.my_spring_app.dto.request.DeployBackendRequest;
import my_spring_app.my_spring_app.dto.request.DeployFrontendRequest;
import my_spring_app.my_spring_app.service.ProjectBackendService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/project-backends")
public class ProjectBackendController {

    @Autowired
    private ProjectBackendService projectBackendService;

    @GetMapping
    public ResponseEntity<ListProjectBackendResponse> getAllProjectBackends() {
        ListProjectBackendResponse response = projectBackendService.getAllProjectBackends();
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/deploy", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DeployBackendResponse> deploy(@ModelAttribute @Valid DeployBackendRequest request) {
        DeployBackendResponse response = projectBackendService.deploy(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

