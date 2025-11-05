package my_spring_app.my_spring_app.dto.request;

import org.springframework.web.multipart.MultipartFile;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Metadata kèm theo khi upload file.
 * targetDir là thư mục con (tuỳ chọn) để lưu file trên server.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UploadFileRequest {

    private MultipartFile file;  // File upload (ví dụ .zip)

    private String targetDir; // ví dụ: "apps" hoặc "archives"
}


