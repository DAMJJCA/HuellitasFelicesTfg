package com.veterinaria.demo.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.multipart.MultipartFile;

import com.veterinaria.demo.dto.ProfileImageRequest;
import com.veterinaria.demo.dto.ProfileResponse;
import com.veterinaria.demo.service.ProfileService;

@RestController
@RequestMapping("/api/perfil")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ProfileResponse getProfile() {
        return profileService.getProfile();
    }

    @PutMapping("/imagen")
    public ProfileResponse updateProfileImage(@RequestBody ProfileImageRequest request) {
        return profileService.updateProfileImage(request.getProfileImageUrl());
    }

    @PostMapping("/imagen/archivo")
    public ProfileResponse uploadProfileImage(@RequestPart("file") MultipartFile file) {
        return profileService.uploadProfileImage(file);
    }

    @DeleteMapping("/imagen")
    public ProfileResponse clearProfileImage() {
        return profileService.clearProfileImage();
    }
}
