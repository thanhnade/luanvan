package my_spring_app.my_spring_app.dto.reponse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NamespaceResponse {
    private String id;
    private String name;
    private String status; // active, terminating
    private Map<String, String> labels;
    private String age;
}

