package pl.babastudiobe.team;

import java.util.Map;

import jakarta.validation.ConstraintViolationException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import pl.babastudiobe.storage.StorageException;

@RestControllerAdvice
class ApiExceptionHandler {

	@ExceptionHandler({ StorageException.class, ConstraintViolationException.class })
	ResponseEntity<Map<String, String>> badRequest(Exception exception) {
		return ResponseEntity
				.status(HttpStatus.BAD_REQUEST)
				.body(Map.of("message", exception.getMessage()));
	}
}
