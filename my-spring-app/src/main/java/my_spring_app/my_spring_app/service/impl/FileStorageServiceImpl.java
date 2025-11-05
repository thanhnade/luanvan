package my_spring_app.my_spring_app.service.impl;

import my_spring_app.my_spring_app.dto.request.UploadFileRequest;
import my_spring_app.my_spring_app.dto.reponse.UploadFileResponse;
import my_spring_app.my_spring_app.dto.request.RemoteUploadRequest;
import my_spring_app.my_spring_app.dto.reponse.RemoteUploadResponse;
import my_spring_app.my_spring_app.service.FileStorageService;
import com.jcraft.jsch.Channel;
import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import org.springframework.beans.factory.annotation.Value;
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

/**
 * Service phụ trách lưu trữ file.
 * - Lưu local: ~/uploads/<targetDir>/UUID.ext
 * - Lưu remote: SFTP tới máy Ubuntu (IP/Port/User/Password cấu hình trong application.yaml)
 */
@Service
public class FileStorageServiceImpl implements FileStorageService {

    /**
     * Thư mục gốc mặc định trên máy đang chạy backend (local disk).
     */
    private static final String DEFAULT_ROOT = System.getProperty("user.home") + "/uploads";

    @Value("${app.vars.docker_image_ip}")
    private String remoteIp;

    @Value("${app.vars.docker_image_port}")
    private int remotePort;

    @Value("${app.vars.docker_image_username}")
    private String remoteUsername;

    @Value("${app.vars.docker_image_password}")
    private String remotePassword;

    /**
     * Lưu file vào đĩa local của server hiện tại.
     * - Tên file được random UUID để tránh trùng lặp
     * - Phân loại theo ngày và targetDir để dễ quản lý/làm sạch
     */
    /**
     * Lưu file vào ổ đĩa local của server hiện tại.
     * Quy ước lưu trữ:
     *  - Thư mục gốc: ~/uploads
     *  - Thư mục con do client gửi: targetDir (mặc định "archives")
     *  - Tên file: UUID + phần mở rộng gốc (đảm bảo không trùng lặp và an toàn)
     *
     * @param form UploadFileRequest chứa file và targetDir
     * @return UploadFileResponse mô tả kết quả lưu trữ (đường dẫn tuyệt đối savedPath)
     */
    @Override
    public UploadFileResponse store(UploadFileRequest form) {
        // Lấy file từ request
        MultipartFile file = (form != null) ? form.getFile() : null;
        if (file == null || file.isEmpty()) {
            return new UploadFileResponse(false, "File trống hoặc không hợp lệ", null, null, 0, null);
        }

        // Làm sạch tên gốc và tách phần mở rộng
        String originalName = StringUtils.cleanPath(file.getOriginalFilename());
        String ext = "";
        int dot = originalName.lastIndexOf('.');
        if (dot > 0) {
            ext = originalName.substring(dot);
        }

        // Tạo tên file an toàn bằng UUID để tránh đè file cũ
        String safeFileName = UUID.randomUUID() + ext;

        // Xác định thư mục con theo yêu cầu; mặc định là "archives"
        String subDir = (form != null && form.getTargetDir() != null && !form.getTargetDir().isBlank())
                ? form.getTargetDir()
                : "archives";

        // ~/uploads/<subDir>
        Path targetDir = Paths.get(DEFAULT_ROOT, subDir).toAbsolutePath().normalize();

        try {
            // Tạo thư mục đích nếu chưa tồn tại
            Files.createDirectories(targetDir);
            // Vị trí file cuối cùng trên máy chủ
            Path targetFile = targetDir.resolve(safeFileName);
            // Ghi stream nội dung file xuống đĩa
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

    /**
     * Upload file lên máy chủ Ubuntu từ xa thông qua SFTP.
     * Nguồn file nhận từ multipart (form.getFile()).
     * IP và port của máy đích đọc từ application.yaml (docker_image_ip, docker_image_port).
     * Cấu trúc thư mục lưu trên máy đích: /home/<user>/uploads/<targetDir>/UUID.ext
     */
    @Override
    public RemoteUploadResponse storeRemote(RemoteUploadRequest form) {
        MultipartFile file = (form != null) ? form.getFile() : null;
        if (file == null || file.isEmpty()) {
            return new RemoteUploadResponse(false, "File trống hoặc không hợp lệ", null, null, 0, null);
        }

        String originalName = StringUtils.cleanPath(file.getOriginalFilename());
        String ext = "";
        int dot = originalName.lastIndexOf('.');
        if (dot > 0) ext = originalName.substring(dot);

        String safeFileName = UUID.randomUUID() + ext;
        String subDir = (form.getTargetDir() != null && !form.getTargetDir().isBlank()) ? form.getTargetDir() : "archives";
        // Username lấy trực tiếp từ cấu hình
        String user = remoteUsername;
        String remoteBase = "/home/" + user + "/uploads";
        String remoteDir = remoteBase + "/" + subDir;

        Session session = null;
        ChannelSftp sftp = null;
        try {
            JSch jsch = new JSch();
            // Kết nối tới máy đích (IP/Port/Username lấy từ application.yaml)
            session = jsch.getSession(user, remoteIp, remotePort);
            // Thiết lập password
            session.setPassword(remotePassword);
            java.util.Properties cfg = new java.util.Properties();
            cfg.put("StrictHostKeyChecking", "no");
            session.setConfig(cfg);
            session.setTimeout(5000);
            session.connect();

            Channel ch = session.openChannel("sftp");
            ch.connect();
            sftp = (ChannelSftp) ch;

            // Đảm bảo tồn tại cây thư mục từ remoteBase → targetDir
            String[] parts = remoteDir.split("/");
            String cur = "";
            for (String p : parts) {
                if (p == null || p.isBlank()) continue;
                cur += "/" + p;
                try { sftp.cd(cur); } catch (Exception e) { sftp.mkdir(cur); sftp.cd(cur); }
            }

            String remotePath = remoteDir + "/" + safeFileName;
            // Upload nội dung file lên đường dẫn remote
            sftp.put(file.getInputStream(), remotePath);
            return new RemoteUploadResponse(true, "Upload SFTP thành công", originalName, file.getContentType(), file.getSize(), remotePath);
        } catch (Exception ex) {
            return new RemoteUploadResponse(false, "Lỗi khi upload SFTP: " + ex.getMessage(), originalName, null, 0, null);
        } finally {
            // Giải phóng tài nguyên kết nối SFTP/SSH
            if (sftp != null && sftp.isConnected()) sftp.disconnect();
            if (session != null && session.isConnected()) session.disconnect();
        }
    }
}


