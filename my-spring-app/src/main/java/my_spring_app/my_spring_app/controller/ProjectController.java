package my_spring_app.my_spring_app.controller;

import jakarta.validation.Valid;
import my_spring_app.my_spring_app.dto.reponse.CreateProjectResponse;
import my_spring_app.my_spring_app.dto.reponse.ProjectSummaryResponse;
import my_spring_app.my_spring_app.dto.request.CreateProjectRequest;
import my_spring_app.my_spring_app.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @PostMapping
    public ResponseEntity<CreateProjectResponse> createProject(@Valid @RequestBody CreateProjectRequest request) {
        CreateProjectResponse response = projectService.createProject(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<ProjectSummaryResponse> getUserProjects(@RequestParam String username) {
        ProjectSummaryResponse response = projectService.getUserProjects(username);
        return ResponseEntity.ok(response);
    }
}

