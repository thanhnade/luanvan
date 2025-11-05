package my_spring_app.my_spring_app.service.impl;

import my_spring_app.my_spring_app.dto.request.UploadFileRequest;
import my_spring_app.my_spring_app.dto.reponse.UploadFileResponse;
import my_spring_app.my_spring_app.service.FileStorageService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final String DEFAULT_ROOT = System.getProperty("user.home") + "/uploads";

    @Override
    public UploadFileResponse store(UploadFileRequest form) {
        MultipartFile file = (form != null) ? form.getFile() : null;
        if (file == null || file.isEmpty()) {
            return new UploadFileResponse(false, "File trống hoặc không hợp lệ", null, null, 0, null);
        }

        String originalName = StringUtils.cleanPath(file.getOriginalFilename());
        String ext = "";
        int dot = originalName.lastIndexOf('.');
        if (dot > 0) {
            ext = originalName.substring(dot);
        }

        String safeFileName = UUID.randomUUID() + ext;

        String subDir = (form != null && form.getTargetDir() != null && !form.getTargetDir().isBlank())
                ? form.getTargetDir()
                : "archives";

        Path targetDir = Paths.get(DEFAULT_ROOT, LocalDate.now().toString(), subDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(targetDir);
            Path targetFile = targetDir.resolve(safeFileName);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

            return new UploadFileResponse(
                    true,
                    "Upload thành công",
                    originalName,
                    file.getContentType(),
                    file.getSize(),
                    targetFile.toString()
            );
        } catch (IOException ex) {
            return new UploadFileResponse(false, "Lỗi khi lưu file: " + ex.getMessage(), originalName, file.getContentType(), 0, null);
        }
    }
}


