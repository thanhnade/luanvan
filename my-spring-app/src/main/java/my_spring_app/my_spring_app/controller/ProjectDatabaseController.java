//package my_spring_app.my_spring_app.controller;
//
//import jakarta.validation.Valid;
//import my_spring_app.my_spring_app.dto.reponse.DeployDatabaseResponse;
//import my_spring_app.my_spring_app.dto.reponse.ListProjectDatabaseResponse;
//import my_spring_app.my_spring_app.dto.request.DeployDatabaseRequest;
//import my_spring_app.my_spring_app.service.ProjectDatabaseService;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.HttpStatus;
//import org.springframework.http.MediaType;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//@RestController
//@RequestMapping("/api/project-databases")
//public class ProjectDatabaseController {
//
//    @Autowired
//    private ProjectDatabaseService projectDatabaseService;
//
//    @GetMapping
//    public ResponseEntity<ListProjectDatabaseResponse> getAllProjectDatabases() {
//        ListProjectDatabaseResponse response = projectDatabaseService.getAllProjectDatabases();
//        return ResponseEntity.ok(response);
//    }
//
//    @PostMapping(value = "/deploy", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//    public ResponseEntity<DeployDatabaseResponse> deploy(@ModelAttribute @Valid DeployDatabaseRequest request) {
//        DeployDatabaseResponse response = projectDatabaseService.deploy(request);
//        return ResponseEntity.status(HttpStatus.CREATED).body(response);
//    }
//}
//
