package my_spring_app.my_spring_app.service.impl;

import com.jcraft.jsch.Channel;
import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import my_spring_app.my_spring_app.dto.reponse.CheckConnectionResponse;
import my_spring_app.my_spring_app.dto.reponse.ExecuteCommandResponse;
import my_spring_app.my_spring_app.dto.request.CheckConnectionRequest;
import my_spring_app.my_spring_app.dto.request.ExecuteCommandRequest;
import my_spring_app.my_spring_app.service.SSHService;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Properties;

@Service
public class SSHServiceImpl implements SSHService {

    private static final int CONNECTION_TIMEOUT = 5000; // 5 giây

    @Override
    public CheckConnectionResponse checkConnection(CheckConnectionRequest request) {
        CheckConnectionResponse response = new CheckConnectionResponse();
        response.setHost(request.getHost());
        response.setPort(request.getPort());

        Session session = null;
        try {
            JSch jsch = new JSch();
            session = jsch.getSession(request.getUsername(), request.getHost(), request.getPort());
            session.setPassword(request.getPassword());

            // Tắt kiểm tra strict host key
            Properties config = new Properties();
            config.put("StrictHostKeyChecking", "no");
            session.setConfig(config);

            // Thiết lập thời gian chờ kết nối
            session.setTimeout(CONNECTION_TIMEOUT);

            // Kết nối
            session.connect();

            response.setConnected(true);
            response.setMessage("Kết nối thành công đến server");
            
            return response;
        } catch (Exception e) {
            response.setConnected(false);
            response.setMessage("Kết nối thất bại: " + e.getMessage());
            return response;
        } finally {
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    @Override
    public ExecuteCommandResponse executeCommand(ExecuteCommandRequest request) {
        ExecuteCommandResponse response = new ExecuteCommandResponse();
        response.setCommand(request.getCommand());

        Session session = null;
        Channel channel = null;
        try {
            JSch jsch = new JSch();
            session = jsch.getSession(request.getUsername(), request.getHost(), request.getPort());
            session.setPassword(request.getPassword());

            // Tắt kiểm tra strict host key
            Properties config = new Properties();
            config.put("StrictHostKeyChecking", "no");
            session.setConfig(config);

            // Thiết lập thời gian chờ kết nối
            session.setTimeout(CONNECTION_TIMEOUT);

            // Kết nối
            session.connect();

            // Mở kênh exec
            channel = session.openChannel("exec");
            ChannelExec channelExec = (ChannelExec) channel;

            // Thiết lập câu lệnh
            channelExec.setCommand(request.getCommand());

            // Chuyển hướng error stream sang output stream
            channelExec.setErrStream(System.err);

            // Lấy input stream
            InputStream inputStream = channelExec.getInputStream();

            // Kết nối channel
            channel.connect();

            // Đọc output
            StringBuilder output = new StringBuilder();
            StringBuilder errorOutput = new StringBuilder();
            byte[] buffer = new byte[1024];

            while (true) {
                while (inputStream.available() > 0) {
                    int bytesRead = inputStream.read(buffer, 0, 1024);
                    if (bytesRead < 0) {
                        break;
                    }
                    output.append(new String(buffer, 0, bytesRead, StandardCharsets.UTF_8));
                }

                if (channel.isClosed()) {
                    if (inputStream.available() > 0) {
                        continue;
                    }
                    response.setExitStatus(channel.getExitStatus());
                    break;
                }

                try {
                    Thread.sleep(100);
                } catch (Exception e) {
                    // Bỏ qua
                }
            }

            // Kiểm tra exit status
            if (channel.getExitStatus() == 0) {
                response.setSuccess(true);
                response.setOutput(output.toString().trim());
                response.setError(null);
            } else {
                response.setSuccess(false);
                response.setOutput(output.toString().trim());
                response.setError("Command exited with status: " + channel.getExitStatus());
            }

            return response;
        } catch (Exception e) {
            response.setSuccess(false);
            response.setOutput("");
            response.setError("Lỗi khi thực thi lệnh: " + e.getMessage());
            response.setExitStatus(-1);
            return response;
        } finally {
            if (channel != null && channel.isConnected()) {
                channel.disconnect();
            }
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }
}

