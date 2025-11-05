package my_spring_app.my_spring_app.dto.reponse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UploadFileResponse {
    private boolean success;
    private String message;
    private String fileName;
    private String contentType;
    private long sizeBytes;
    private String savedPath; // đường dẫn tuyệt đối trên server
}


