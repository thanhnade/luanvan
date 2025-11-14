//package my_spring_app.my_spring_app.repository;
//
//import my_spring_app.my_spring_app.entity.ProjectBackendEntity;
//import my_spring_app.my_spring_app.entity.UserEntity;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.stereotype.Repository;
//
//import java.util.List;
//
//@Repository
//public interface ProjectBackendRepository extends JpaRepository<ProjectBackendEntity, Long> {
//    boolean existsByDomainNameSystem(String domainNameSystem);
//
//    // Tìm tất cả backend projects của một user
//    List<ProjectBackendEntity> findByUser(UserEntity user);
//}
//
