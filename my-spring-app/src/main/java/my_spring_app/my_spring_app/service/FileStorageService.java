package my_spring_app.my_spring_app.service;

import my_spring_app.my_spring_app.dto.request.UploadFileRequest;
import my_spring_app.my_spring_app.dto.reponse.UploadFileResponse;

public interface FileStorageService {
    UploadFileResponse store(UploadFileRequest form);
}


