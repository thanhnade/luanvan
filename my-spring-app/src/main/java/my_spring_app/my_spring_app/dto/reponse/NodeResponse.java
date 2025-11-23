package my_spring_app.my_spring_app.dto.reponse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NodeResponse {
    private String id;
    private String name;
    private String status; // ready, notready
    private String role; // master, worker
    private NodeResource cpu;
    private NodeResource memory;
    private NodeResource disk;
    private Integer podCount;
    private String os;
    private String kernel;
    private String updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NodeResource {
        private Double requested;
        private Double limit;
        private Double capacity;
    }
}

