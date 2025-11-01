package my_spring_app.my_spring_app.service;

import my_spring_app.my_spring_app.dto.reponse.CreateUserResponse;
import my_spring_app.my_spring_app.dto.reponse.LoginResponse;
import my_spring_app.my_spring_app.dto.request.CreateUserRequest;
import my_spring_app.my_spring_app.dto.request.LoginRequest;

public interface UserService {

    CreateUserResponse createUser(CreateUserRequest request);

    LoginResponse login(LoginRequest request);
}

