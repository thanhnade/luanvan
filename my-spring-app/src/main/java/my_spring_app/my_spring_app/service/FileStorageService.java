package my_spring_app.my_spring_app.service;

import my_spring_app.my_spring_app.dto.request.UploadFileRequest;
import my_spring_app.my_spring_app.dto.reponse.UploadFileResponse;
import my_spring_app.my_spring_app.dto.request.RemoteUploadRequest;
import my_spring_app.my_spring_app.dto.reponse.RemoteUploadResponse;

public interface FileStorageService {
    UploadFileResponse store(UploadFileRequest form);

    RemoteUploadResponse storeRemote(RemoteUploadRequest form);
}


