package my_spring_app.my_spring_app.repository;

import my_spring_app.my_spring_app.entity.ProjectFrontendEntity;
import my_spring_app.my_spring_app.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectFrontendRepository extends JpaRepository<ProjectFrontendEntity, Long> {
    
    Optional<ProjectFrontendEntity> findByDomainNameSystem(String domainNameSystem);
    
    boolean existsByDomainNameSystem(String domainNameSystem);
    
    // Tìm tất cả frontend projects của một user
    List<ProjectFrontendEntity> findByUser(UserEntity user);
}

