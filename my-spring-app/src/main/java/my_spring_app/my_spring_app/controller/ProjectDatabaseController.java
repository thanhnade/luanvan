package my_spring_app.my_spring_app.controller;

import my_spring_app.my_spring_app.dto.reponse.ListProjectDatabaseResponse;
import my_spring_app.my_spring_app.service.ProjectDatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/project-databases")
public class ProjectDatabaseController {

    @Autowired
    private ProjectDatabaseService projectDatabaseService;

    @GetMapping
    public ResponseEntity<ListProjectDatabaseResponse> getAllProjectDatabases() {
        ListProjectDatabaseResponse response = projectDatabaseService.getAllProjectDatabases();
        return ResponseEntity.ok(response);
    }
}

