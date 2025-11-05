package my_spring_app.my_spring_app.controller;

import my_spring_app.my_spring_app.entity.FileEntity;
import my_spring_app.my_spring_app.service.FileEntityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/file-entities")
public class FileEntityController {

    @Autowired
    private FileEntityService fileEntityService;

    @GetMapping
    public ResponseEntity<List<FileEntity>> getAllFiles() {
        return ResponseEntity.ok(fileEntityService.findAll());
    }
}


