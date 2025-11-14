//package my_spring_app.my_spring_app.service.impl;
//
//import com.jcraft.jsch.*;
//import my_spring_app.my_spring_app.dto.reponse.DeployDatabaseResponse;
//import my_spring_app.my_spring_app.dto.reponse.ListProjectDatabaseResponse;
//import my_spring_app.my_spring_app.dto.request.DeployDatabaseRequest;
//import my_spring_app.my_spring_app.entity.ProjectDatabaseEntity;
//import my_spring_app.my_spring_app.entity.ServerEntity;
//import my_spring_app.my_spring_app.entity.UserEntity;
//import my_spring_app.my_spring_app.repository.ProjectDatabaseRepository;
//import my_spring_app.my_spring_app.repository.ServerRepository;
//import my_spring_app.my_spring_app.repository.UserRepository;
//import my_spring_app.my_spring_app.service.ProjectDatabaseService;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.io.InputStream;
//import java.nio.charset.StandardCharsets;
//import java.util.List;
//import java.util.Optional;
//import java.util.Properties;
//import java.util.UUID;
//import java.util.stream.Collectors;
//
///**
// * Service implementation cho ProjectDatabase
// * Xử lý các nghiệp vụ liên quan đến triển khai database projects
// */
//@Service
//@Transactional
//public class ProjectDatabaseServiceImpl implements ProjectDatabaseService {
//
//    @Autowired
//    private ProjectDatabaseRepository projectDatabaseRepository;
//
//    @Autowired
//    private UserRepository userRepository;
//
//    @Autowired
//    private ServerRepository serverRepository;
//
//    @Override
//    public ListProjectDatabaseResponse getAllProjectDatabases() {
//        List<ProjectDatabaseEntity> entities = projectDatabaseRepository.findAll();
//
//        List<ListProjectDatabaseResponse.ProjectDatabaseItem> items = entities.stream()
//                .map(entity -> {
//                    ListProjectDatabaseResponse.ProjectDatabaseItem item = new ListProjectDatabaseResponse.ProjectDatabaseItem();
//                    item.setId(entity.getId());
//                    item.setProjectName(entity.getProjectName());
//                    item.setDatabaseType(entity.getDatabaseType());
//                    item.setDatabaseIp(entity.getDatabaseIp());
//                    item.setDatabasePort(entity.getDatabasePort());
//                    item.setDatabaseUsername(entity.getDatabaseUsername());
//                    item.setDatabasePassword(entity.getDatabasePassword());
//                    item.setDatabaseName(entity.getDatabaseName());
//                    item.setDatabaseFile(entity.getDatabaseFile());
//                    item.setStatus(entity.getStatus());
//                    item.setCreatedAt(entity.getCreatedAt());
//                    return item;
//                })
//                .collect(Collectors.toList());
//
//        return new ListProjectDatabaseResponse(items);
//    }
//
//    /**
//     * Helper method để thực thi lệnh qua SSH và trả về output
//     * @param session SSH session đã kết nối
//     * @param command Lệnh cần thực thi
//     * @return Kết quả output của lệnh
//     * @throws Exception Nếu có lỗi khi thực thi lệnh
//     */
//    private String executeCommand(Session session, String command) throws Exception {
//        return executeCommand(session, command, false);
//    }
//
//    /**
//     * Helper method để thực thi lệnh qua SSH và trả về output
//     * @param session SSH session đã kết nối
//     * @param command Lệnh cần thực thi
//     * @param ignoreNonZeroExit Nếu true, sẽ không throw exception khi lệnh trả về exit status != 0
//     * @return Kết quả output của lệnh
//     * @throws Exception Nếu có lỗi khi thực thi lệnh và ignoreNonZeroExit = false
//     */
//    private String executeCommand(Session session, String command, boolean ignoreNonZeroExit) throws Exception {
//        ChannelExec channelExec = null;
//
//        try {
//            Channel channel = session.openChannel("exec");
//            channelExec = (ChannelExec) channel;
//            channelExec.setCommand(command);
//            channelExec.setErrStream(System.err);
//
//            InputStream inputStream = channelExec.getInputStream();
//            channelExec.connect();
//
//            StringBuilder output = new StringBuilder();
//            byte[] buffer = new byte[1024];
//
//            while (true) {
//                while (inputStream.available() > 0) {
//                    int bytesRead = inputStream.read(buffer, 0, 1024);
//                    if (bytesRead < 0) {
//                        break;
//                    }
//                    output.append(new String(buffer, 0, bytesRead, StandardCharsets.UTF_8));
//                }
//
//                if (channelExec.isClosed()) {
//                    if (inputStream.available() > 0) {
//                        continue;
//                    }
//                    break;
//                }
//
//                try {
//                    Thread.sleep(100);
//                } catch (Exception e) {
//                    // Bỏ qua lỗi sleep
//                }
//            }
//
//            int exitStatus = channelExec.getExitStatus();
//            String result = output.toString().trim();
//
//            if (exitStatus != 0) {
//                if (ignoreNonZeroExit) {
//                    System.err.println("[executeCommand] Command exited with status: " + exitStatus + ". Output: " + result + ". Command: " + command);
//                } else {
//                    throw new RuntimeException("Command exited with status: " + exitStatus + ". Output: " + result);
//                }
//            }
//
//            return result;
//
//        } finally {
//            if (channelExec != null && channelExec.isConnected()) {
//                channelExec.disconnect();
//            }
//        }
//    }
//
//    /**
//     * Triển khai database project
//     * Tạo database, user và import dữ liệu từ file SQL
//     *
//     * @param request Thông tin request để deploy database project
//     * @return Response chứa thông tin database đã deploy
//     * @throws RuntimeException Nếu có lỗi trong quá trình deploy
//     */
//    @Override
//    public DeployDatabaseResponse deploy(DeployDatabaseRequest request) {
//        System.out.println("[deployDatabase] Bắt đầu triển khai database project");
//
//        // ========== BƯỚC 1: VALIDATE VÀ CHUẨN BỊ DỮ LIỆU ==========
//
//        // Tìm user theo username
//        Optional<UserEntity> userOptional = userRepository.findByUsername(request.getUsername());
//        if (userOptional.isEmpty()) {
//            throw new RuntimeException("User không tồn tại");
//        }
//        UserEntity user = userOptional.get();
//
//        // Validate database type (chỉ hỗ trợ MYSQL, MONGODB)
//        String databaseType = request.getDatabaseType().toUpperCase();
//        if (!"MYSQL".equals(databaseType) && !"MONGODB".equals(databaseType)) {
//            throw new RuntimeException("Database type không hợp lệ. Chỉ hỗ trợ MYSQL, MONGODB");
//        }
//
//        // Validate file upload (file là optional, có thể không có)
//        if (request.getFile() == null || request.getFile().isEmpty()) {
//            System.out.println("[deployDatabase] Không có file database để import");
//        }
//
//        // Tạo UUID đầy đủ cho deploymentUuid (lưu vào database)
//        String deploymentUuid = UUID.randomUUID().toString().replace("-", "");
//
//        // Rút gọn UUID để làm database name, username và password (lấy 16 ký tự đầu)
//        // 16 ký tự hex = 2^64 combinations = 18,446,744,073,709,551,616 combinations
//        // Đủ unique cho hầu hết các trường hợp, ngay cả với hàng triệu deployments
//        String shortId = deploymentUuid.substring(0, 16).toLowerCase();
//
//        // Tạo database name, username và password ngắn gọn hơn
//        String databaseName = "db_" + shortId;
//        String databaseUsername = "user_" + shortId;
//        // Password database = tiền tố "pwd_" + shortId để phân biệt
//        String databasePassword = "pwd_" + shortId;
//
//        System.out.println("[deployDatabase] Tạo UUID đầy đủ cho deployment: " + deploymentUuid);
//        System.out.println("[deployDatabase] Short ID (16 ký tự): " + shortId);
//        System.out.println("[deployDatabase] Database name: " + databaseName + " (độ dài: " + databaseName.length() + " ký tự)");
//        System.out.println("[deployDatabase] Database username: " + databaseUsername + " (độ dài: " + databaseUsername.length() + " ký tự)");
//        System.out.println("[deployDatabase] Database password: " + databasePassword + " (độ dài: " + databasePassword.length() + " ký tự)");
//
//        // Tạo ProjectDatabaseEntity và thiết lập các thuộc tính cơ bản
//        ProjectDatabaseEntity projectEntity = new ProjectDatabaseEntity();
//        projectEntity.setProjectName(request.getProjectName());
//        projectEntity.setDatabaseType(databaseType);
//        projectEntity.setDeploymentUuid(deploymentUuid);
//        projectEntity.setStatus("BUILDING"); // Trạng thái ban đầu là BUILDING
//        projectEntity.setUser(user);
//        projectEntity.setDatabasePassword(databasePassword);
//        // Gán sớm databaseName và databaseUsername để dù lỗi vẫn lưu được (cột NOT NULL)
//        projectEntity.setDatabaseName(databaseName);
//        projectEntity.setDatabaseUsername(databaseUsername);
//
//        // ========== BƯỚC 2: LẤY THÔNG TIN SERVER TỪ DATABASE ==========
//
//        // Lấy thông tin DATABASE server từ database
//        Optional<ServerEntity> databaseServerOptional = serverRepository.findByRole("DATABASE");
//
//        // Validate server bắt buộc
//        if (databaseServerOptional.isEmpty()) {
//            throw new RuntimeException("Không tìm thấy server DATABASE. Vui lòng cấu hình server DATABASE trong hệ thống.");
//        }
//
//        ServerEntity databaseServer = databaseServerOptional.get();
//
//        // Lưu thông tin database server vào entity
//        projectEntity.setDatabaseIp(databaseServer.getIp());
//        // Set port theo loại database: MYSQL = 3306, MONGODB = 27017
//        if ("MYSQL".equals(databaseType)) {
//            projectEntity.setDatabasePort(3306);
//        } else if ("MONGODB".equals(databaseType)) {
//            projectEntity.setDatabasePort(27017);
//        } else {
//            // Fallback (không nên xảy ra vì đã validate ở trên)
//            projectEntity.setDatabasePort(3306);
//        }
//
//        // Khởi tạo các biến để quản lý SSH/SFTP connections
//        Session dbSession = null;
//        ChannelSftp sftpDb = null;
//
//        try {
//            // ========== BƯỚC 3: KẾT NỐI ĐẾN DATABASE SERVER ==========
//
//            System.out.println("[deployDatabase] Kết nối SSH đến DATABASE server: " + databaseServer.getIp() + ":" + databaseServer.getPort());
//            JSch jsch = new JSch();
//            dbSession = jsch.getSession(databaseServer.getUsername(), databaseServer.getIp(), databaseServer.getPort());
//            dbSession.setPassword(databaseServer.getPassword());
//            Properties config = new Properties();
//            config.put("StrictHostKeyChecking", "no");
//            dbSession.setConfig(config);
//            dbSession.setTimeout(7000);
//            dbSession.connect();
//            System.out.println("[deployDatabase] Kết nối SSH đến DATABASE server thành công");
//
//            // ========== BƯỚC 4: XỬ LÝ FILE DATABASE (NẾU CÓ) ==========
//
//            String sqlFilePath = null;
//
//            if (request.getFile() != null && !request.getFile().isEmpty()) {
//                // Upload database file lên database server
//                Channel channelDb = dbSession.openChannel("sftp");
//                channelDb.connect();
//                sftpDb = (ChannelSftp) channelDb;
//
//                String dbFileName = request.getFile().getOriginalFilename();
//                String remoteDbBase = "/home/" + databaseServer.getUsername() + "/uploads/" + user.getUsername() + "/db/" + deploymentUuid;
//
//                System.out.println("[deployDatabase] Tạo/cd thư mục đích: " + remoteDbBase);
//                // Đảm bảo thư mục tồn tại
//                String[] parts = remoteDbBase.split("/");
//                String cur = "";
//                for (String p : parts) {
//                    if (p == null || p.isBlank()) continue;
//                    cur += "/" + p;
//                    try {
//                        sftpDb.cd(cur);
//                    } catch (Exception e) {
//                        sftpDb.mkdir(cur);
//                        sftpDb.cd(cur);
//                    }
//                }
//
//                String dbRemotePath = remoteDbBase + "/" + dbFileName;
//                System.out.println("[deployDatabase] Upload database file lên: " + dbRemotePath);
//                sftpDb.put(request.getFile().getInputStream(), dbRemotePath);
//                System.out.println("[deployDatabase] Đã upload database file lên database server: " + dbRemotePath);
//
//                // Lưu đường dẫn file vào entity
//                projectEntity.setDatabaseFile(dbRemotePath);
//
//                // Giải nén file database (nếu là .zip)
//                if (dbFileName != null && dbFileName.endsWith(".zip")) {
//                    String unzipCmd = "cd " + remoteDbBase + " && unzip -o '" + dbFileName + "'";
//                    System.out.println("[deployDatabase] Giải nén database file: " + unzipCmd);
//                    executeCommand(dbSession, unzipCmd);
//
//                    // Tìm file .sql trong thư mục đã giải nén
//                    String findSqlCmd = "cd " + remoteDbBase + " && find . -name '*.sql' -type f | head -1";
//                    String sqlFile = executeCommand(dbSession, findSqlCmd).trim();
//                    if (!sqlFile.isEmpty()) {
//                        sqlFile = sqlFile.replaceFirst("^\\./", "");
//                        sqlFilePath = remoteDbBase + "/" + sqlFile;
//                        System.out.println("[deployDatabase] Tìm thấy file SQL: " + sqlFilePath);
//                    } else {
//                        System.out.println("[deployDatabase] Không tìm thấy file .sql trong thư mục đã giải nén");
//                    }
//                } else if (dbFileName != null && dbFileName.endsWith(".sql")) {
//                    sqlFilePath = dbRemotePath;
//                    System.out.println("[deployDatabase] Sử dụng file SQL trực tiếp: " + sqlFilePath);
//                }
//
//                sftpDb.disconnect();
//                sftpDb = null;
//            }
//
//            // ========== BƯỚC 5: XỬ LÝ DATABASE THEO LOẠI ==========
//
//            if ("MYSQL".equals(databaseType)) {
//                // Database name và username đã được chuẩn hóa ở trên
//                String dbName = databaseName;
//                String dbUsername = databaseUsername;
//
//                // Escape password để tránh lỗi SQL injection và ký tự đặc biệt
//                String escapedPassword = databasePassword.replace("'", "''").replace("\\", "\\\\");
//
//                System.out.println("[deployDatabase] Bắt đầu tạo MySQL database và user");
//                System.out.println("[deployDatabase] Database name: " + dbName);
//                System.out.println("[deployDatabase] Database username: " + dbUsername);
//
//                // Kiểm tra collision: kiểm tra xem database và user đã tồn tại chưa
//                // (Xác suất collision với 16 ký tự là cực kỳ thấp: 2^64 combinations)
//                System.out.println("[deployDatabase] Kiểm tra collision (database/user đã tồn tại chưa)...");
//                String checkDbCmd = "sudo mysql -N -e \"SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='" + dbName + "';\"";
//                String checkUserCmd = "sudo mysql -N -e \"SELECT COUNT(*) FROM mysql.user WHERE User='" + dbUsername + "' AND Host='%';\"";
//
//                try {
//                    String dbExists = executeCommand(dbSession, checkDbCmd).trim();
//                    String userExists = executeCommand(dbSession, checkUserCmd).trim();
//
//                    if (!dbExists.equals("0") || !userExists.equals("0")) {
//                        // Collision detected (cực kỳ hiếm với 16 ký tự)
//                        System.err.println("[deployDatabase] WARNING: Collision detected! Database hoặc user đã tồn tại.");
//                        System.err.println("[deployDatabase] Database exists: " + dbExists + ", User exists: " + userExists);
//                        throw new RuntimeException("Database name hoặc username đã tồn tại. Vui lòng thử lại.");
//                    }
//                    System.out.println("[deployDatabase] Không có collision, tiếp tục tạo database và user");
//                } catch (Exception e) {
//                    // Nếu lệnh kiểm tra bị lỗi (không phải collision), vẫn tiếp tục
//                    if (e.getMessage() != null && e.getMessage().contains("đã tồn tại")) {
//                        throw e;
//                    }
//                    System.err.println("[deployDatabase] Không thể kiểm tra collision: " + e.getMessage());
//                    System.out.println("[deployDatabase] Tiếp tục tạo database và user (bỏ qua kiểm tra collision)");
//                }
//
//                // Tạo tất cả lệnh MySQL - chỉ gọi sudo mysql MỘT LẦN
//                // Tham khảo cách làm từ AppServiceImpl.java đã thành công
//                StringBuilder mysqlScript = new StringBuilder();
//                mysqlScript.append("CREATE DATABASE IF NOT EXISTS ").append(dbName)
//                        .append(" CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n");
//                mysqlScript.append("CREATE USER IF NOT EXISTS '").append(dbUsername)
//                        .append("'@'%' IDENTIFIED BY '").append(escapedPassword).append("';\n");
//                mysqlScript.append("GRANT ALL PRIVILEGES ON ").append(dbName)
//                        .append(".* TO '").append(dbUsername).append("'@'%';\n");
//                mysqlScript.append("FLUSH PRIVILEGES;\n");
//                mysqlScript.append("EXIT;\n");
//
//                System.out.println("[deployDatabase] Các lệnh MySQL sẽ được thực thi:");
//                System.out.println(mysqlScript.toString());
//
//                // Thực thi TẤT CẢ lệnh trong MỘT phiên MySQL duy nhất bằng heredoc (giống AppServiceImpl.java)
//                String mysqlCmd = "sudo mysql <<'EOF'\n" + mysqlScript + "EOF";
//                System.out.println("[deployDatabase] Thực thi script mysql trong một phiên");
//                try {
//                    // Dùng ignoreNonZeroExit = true để không throw exception ngay, sẽ verify sau
//                    String mysqlOutput = executeCommand(dbSession, mysqlCmd, true);
//                    if (!mysqlOutput.isEmpty()) {
//                        System.out.println("[deployDatabase] Output từ MySQL: " + mysqlOutput);
//                    }
//                } catch (Exception e) {
//                    System.err.println("[deployDatabase] Lỗi khi thực thi MySQL: " + e.getMessage());
//                    // Không throw exception ngay, sẽ verify database/user sau
//                }
//
//                // Kiểm tra database đã được tạo thành công hay chưa
//                String verifyDbCmd = "sudo mysql -N -e \"SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='" + dbName + "';\"";
//                String verifyResult = executeCommand(dbSession, verifyDbCmd);
//                if (verifyResult.isBlank() || verifyResult.trim().equals("0")) {
//                    throw new RuntimeException("Database " + dbName + " chưa được tạo thành công");
//                }
//                System.out.println("[deployDatabase] Database " + dbName + " đã được tạo thành công");
//
//                // Kiểm tra user đã được tạo thành công hay chưa
//                String verifyUserCmd = "sudo mysql -N -e \"SELECT COUNT(*) FROM mysql.user WHERE User='" + dbUsername + "' AND Host='%';\"";
//                String verifyUserResult = executeCommand(dbSession, verifyUserCmd);
//                if (verifyUserResult.isBlank() || verifyUserResult.trim().equals("0")) {
//                    throw new RuntimeException("User " + dbUsername + " chưa được tạo thành công");
//                }
//                System.out.println("[deployDatabase] User " + dbUsername + " đã được tạo thành công");
//
//                // Import file SQL nếu có
//                if (sqlFilePath != null) {
//                    System.out.println("[deployDatabase] Bắt đầu import file SQL: " + sqlFilePath);
//                    String importCmd = "bash -c 'sudo mysql " + dbName + " < " + sqlFilePath + " 2>&1'";
//                    System.out.println("[deployDatabase] Thực thi import SQL: " + importCmd);
//                    try {
//                        String importOutput = executeCommand(dbSession, importCmd);
//                        if (!importOutput.isEmpty()) {
//                            System.out.println("[deployDatabase] Output từ import SQL: " + importOutput);
//                        }
//                        System.out.println("[deployDatabase] Đã import file SQL thành công");
//                    } catch (Exception e) {
//                        System.err.println("[deployDatabase] Lỗi khi import file SQL: " + e.getMessage());
//                        System.err.println("[deployDatabase] WARNING: Import SQL thất bại nhưng database đã được tạo");
//                    }
//                }
//
//            } else if ("MONGODB".equals(databaseType)) {
//                // TODO: Xử lý MongoDB (chưa implement)
//                throw new RuntimeException("MongoDB chưa được hỗ trợ. Chỉ hỗ trợ MySQL hiện tại.");
//            }
//
//            // ========== BƯỚC 6: CẬP NHẬT TRẠNG THÁI VÀ TRẢ VỀ KẾT QUẢ ==========
//
//            // Cập nhật thông tin vào entity (đã set sớm ở trên)
//            projectEntity.setStatus("RUNNING");
//            projectDatabaseRepository.save(projectEntity);
//            System.out.println("[deployDatabase] Hoàn tất triển khai database, projectName=" + request.getProjectName() + ", databaseName=" + databaseName);
//
//            // Tạo response và trả về
//            DeployDatabaseResponse response = new DeployDatabaseResponse();
//            response.setStatus(projectEntity.getStatus());
//            response.setDatabaseIp(projectEntity.getDatabaseIp());
//            response.setDatabasePort(projectEntity.getDatabasePort());
//            response.setDatabaseName(databaseName);
//            response.setDatabaseUsername(databaseUsername);
//            response.setDatabasePassword(databasePassword);
//            return response;
//
//        } catch (Exception ex) {
//            // ========== XỬ LÝ LỖI ==========
//            System.err.println("[deployDatabase] Lỗi: " + ex.getMessage());
//            ex.printStackTrace();
//            // Cập nhật trạng thái project thành ERROR
//            projectEntity.setStatus("ERROR");
//            projectDatabaseRepository.save(projectEntity);
//            throw new RuntimeException("Lỗi khi triển khai database: " + ex.getMessage(), ex);
//        } finally {
//            // ========== DỌN DẸP TÀI NGUYÊN ==========
//            if (sftpDb != null && sftpDb.isConnected()) {
//                sftpDb.disconnect();
//            }
//            if (dbSession != null && dbSession.isConnected()) {
//                dbSession.disconnect();
//            }
//            System.out.println("[deployDatabase] Đã đóng các kết nối SSH/SFTP");
//        }
//    }
//}
//
