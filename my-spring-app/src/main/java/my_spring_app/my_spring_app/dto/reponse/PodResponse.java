package my_spring_app.my_spring_app.dto.reponse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PodResponse {
    private String id;
    private String name;
    private String namespace;
    private ReadyInfo ready;
    private String node;
    private String status; // running, pending, failed, succeeded
    private Integer restarts;
    private String age;
    private String ip;
    private String nominatedNode;
    private List<String> readinessGates;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReadyInfo {
        private Integer ready;
        private Integer total;
    }
}

