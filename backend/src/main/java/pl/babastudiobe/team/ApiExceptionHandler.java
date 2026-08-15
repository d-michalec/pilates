package pl.babastudiobe.team;

import java.util.Map;

import jakarta.validation.ConstraintViolationException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MultipartException;

import pl.babastudiobe.storage.StorageException;

@RestControllerAdvice
class ApiExceptionHandler {

	@ExceptionHandler({ StorageException.class, ConstraintViolationException.class })
	ResponseEntity<Map<String, String>> badRequest(Exception exception) {
		return ResponseEntity
				.status(HttpStatus.BAD_REQUEST)
				.body(Map.of("message", exception.getMessage()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<Map<String, String>> validationError(MethodArgumentNotValidException exception) {
		String message = exception.getBindingResult().getFieldErrors().stream()
				.findFirst()
				.map(fieldError -> fieldError.getDefaultMessage())
				.orElse("Uzupełnij poprawnie formularz.");
		return ResponseEntity
				.status(HttpStatus.BAD_REQUEST)
				.body(Map.of("message", message));
	}

	@ExceptionHandler(MultipartException.class)
	ResponseEntity<Map<String, String>> payloadTooLarge() {
		return ResponseEntity
				.status(HttpStatus.PAYLOAD_TOO_LARGE)
				.body(Map.of("message", "Plik lub zestaw plików jest za duży."));
	}
}
