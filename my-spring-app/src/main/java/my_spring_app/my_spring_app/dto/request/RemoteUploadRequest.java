package my_spring_app.my_spring_app.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RemoteUploadRequest {

    private MultipartFile file; // file nén .zip

    private String targetDir; // thư mục con trên máy từ xa, ví dụ: "apps"
}


