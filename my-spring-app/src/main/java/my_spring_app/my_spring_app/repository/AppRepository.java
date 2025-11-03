package my_spring_app.my_spring_app.repository;

import my_spring_app.my_spring_app.entity.AppEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppRepository extends JpaRepository<AppEntity, Long> {

    List<AppEntity> findByUser_Username(String username);
}

