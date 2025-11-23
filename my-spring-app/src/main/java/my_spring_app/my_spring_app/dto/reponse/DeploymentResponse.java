package my_spring_app.my_spring_app.dto.reponse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeploymentResponse {
    private String id;
    private String name;
    private String namespace;
    private ReplicasInfo replicas;
    private String status; // running, error, pending
    private List<String> containers;
    private List<String> images;
    private String selector;
    private String age;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReplicasInfo {
        private Integer desired;
        private Integer ready;
        private Integer updated;
        private Integer available;
    }
}

