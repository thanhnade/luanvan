package my_spring_app.my_spring_app.repository;

import my_spring_app.my_spring_app.entity.ProjectBackendEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectBackendRepository extends JpaRepository<ProjectBackendEntity, Long> {
    boolean existsByDomainNameSystem(String domainNameSystem);
}

