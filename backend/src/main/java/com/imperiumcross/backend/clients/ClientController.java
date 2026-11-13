package com.imperiumcross.backend.clients;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/clientes")
@Validated
public class ClientController {

    private final ClientQueryService clientQueryService;

    public ClientController(ClientQueryService clientQueryService) {
        this.clientQueryService = clientQueryService;
    }

    @GetMapping
    public List<ClientSummary> findAll() {
        return clientQueryService.findAll();
    }

    @GetMapping("/{id}/foto")
    public ResponseEntity<byte[]> photo(@PathVariable @Positive int id) {
        ClientQueryService.ClientPhoto photo = clientQueryService.findPhoto(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.type()))
                .cacheControl(CacheControl.noCache())
                .body(photo.data());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void create(@Valid @RequestBody ClientRequest request) {
        clientQueryService.create(request);
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void update(
            @PathVariable @Positive int id,
            @Valid @RequestBody ClientRequest request) {
        clientQueryService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable @Positive int id) {
        clientQueryService.deactivate(id);
    }
}
