package my_spring_app.my_spring_app.controller;

import jakarta.validation.Valid;
import my_spring_app.my_spring_app.dto.reponse.DeployFrontendResponse;
import my_spring_app.my_spring_app.dto.request.DeployFrontendRequest;
import my_spring_app.my_spring_app.service.ProjectFrontendService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/project-frontends")
public class ProjectFrontendController {

    @Autowired
    private ProjectFrontendService projectFrontendService;

    @PostMapping(value = "/deploy", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DeployFrontendResponse> deploy(@ModelAttribute @Valid DeployFrontendRequest request) {
        DeployFrontendResponse response = projectFrontendService.deploy(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

