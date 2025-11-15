package my_spring_app.my_spring_app.repository;

import my_spring_app.my_spring_app.entity.ProjectEntity;
import my_spring_app.my_spring_app.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {
    
    // Tìm tất cả projects của một user
    List<ProjectEntity> findByUser(UserEntity user);
}

