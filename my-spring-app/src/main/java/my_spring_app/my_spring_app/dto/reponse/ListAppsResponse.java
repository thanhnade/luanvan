package my_spring_app.my_spring_app.dto.reponse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ListAppsResponse {

    private List<AppItem> apps;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppItem {
        private Long id;
        private String name;
        private String frameworkType;
        private String deploymentType;
        private String url;
        private String status;
        private LocalDateTime createdAt;
    }
}


