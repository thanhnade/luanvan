package my_spring_app.my_spring_app.service.impl;

import my_spring_app.my_spring_app.entity.FileEntity;
import my_spring_app.my_spring_app.repository.FileRepository;
import my_spring_app.my_spring_app.service.FileEntityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FileEntityServiceImpl implements FileEntityService {

    @Autowired
    private FileRepository fileRepository;

    @Override
    public List<FileEntity> findAll() {
        return fileRepository.findAll();
    }
}


