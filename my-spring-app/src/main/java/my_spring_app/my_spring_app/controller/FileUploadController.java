package my_spring_app.my_spring_app.controller;

import my_spring_app.my_spring_app.dto.request.UploadFileRequest;
import my_spring_app.my_spring_app.dto.reponse.UploadFileResponse;
import my_spring_app.my_spring_app.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadFileResponse> upload(@ModelAttribute UploadFileRequest form) {
        UploadFileResponse response = fileStorageService.store(form);
        HttpStatus status = response.isSuccess() ? HttpStatus.CREATED : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(response);
    }
}


