package my_spring_app.my_spring_app.repository;

import my_spring_app.my_spring_app.entity.ProjectFrontendEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectFrontendRepository extends JpaRepository<ProjectFrontendEntity, Long> {
    
    Optional<ProjectFrontendEntity> findByDomainNameSystem(String domainNameSystem);
    
    boolean existsByDomainNameSystem(String domainNameSystem);
}

