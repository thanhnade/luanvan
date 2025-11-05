package my_spring_app.my_spring_app.repository;

import my_spring_app.my_spring_app.entity.ServerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServerRepository extends JpaRepository<ServerEntity, Long> {
}


