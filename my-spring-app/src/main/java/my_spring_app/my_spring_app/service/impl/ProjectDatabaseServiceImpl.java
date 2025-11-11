package my_spring_app.my_spring_app.service.impl;

import my_spring_app.my_spring_app.dto.reponse.ListProjectDatabaseResponse;
import my_spring_app.my_spring_app.entity.ProjectDatabaseEntity;
import my_spring_app.my_spring_app.repository.ProjectDatabaseRepository;
import my_spring_app.my_spring_app.service.ProjectDatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProjectDatabaseServiceImpl implements ProjectDatabaseService {

    @Autowired
    private ProjectDatabaseRepository projectDatabaseRepository;

    @Override
    public ListProjectDatabaseResponse getAllProjectDatabases() {
        List<ProjectDatabaseEntity> entities = projectDatabaseRepository.findAll();
        
        List<ListProjectDatabaseResponse.ProjectDatabaseItem> items = entities.stream()
                .map(entity -> {
                    ListProjectDatabaseResponse.ProjectDatabaseItem item = new ListProjectDatabaseResponse.ProjectDatabaseItem();
                    item.setId(entity.getId());
                    item.setProjectName(entity.getProjectName());
                    item.setDatabaseType(entity.getDatabaseType());
                    item.setDatabaseIp(entity.getDatabaseIp());
                    item.setDatabasePort(entity.getDatabasePort());
                    item.setDatabaseUsername(entity.getDatabaseUsername());
                    item.setDatabasePassword(entity.getDatabasePassword());
                    item.setDatabaseFile(entity.getDatabaseFile());
                    item.setStatus(entity.getStatus());
                    item.setCreatedAt(entity.getCreatedAt());
                    return item;
                })
                .collect(Collectors.toList());

        return new ListProjectDatabaseResponse(items);
    }
}

