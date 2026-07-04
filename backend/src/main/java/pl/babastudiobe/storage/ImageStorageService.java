package pl.babastudiobe.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ImageStorageService {

	private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

	private final Path uploadsRoot;

	public ImageStorageService(@Value("${app.uploads-dir:../uploads}") String uploadsDir) {
		this.uploadsRoot = Paths.get(uploadsDir).toAbsolutePath().normalize();
	}

	public StoredFile storeTeamPhoto(MultipartFile file) {
		validateImage(file);

		String contentType = file.getContentType();
		String extension = extensionFor(contentType);
		String fileName = UUID.randomUUID() + extension;
		Path teamDirectory = uploadsRoot.resolve("team").normalize();
		Path target = teamDirectory.resolve(fileName).normalize();

		try {
			Files.createDirectories(teamDirectory);
			file.transferTo(target);
		}
		catch (IOException exception) {
			throw new StorageException("Nie udalo sie zapisac zdjecia.", exception);
		}

		return new StoredFile("team/" + fileName, contentType, file.getSize());
	}

	private void validateImage(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new StorageException("Zdjecie jest wymagane.");
		}

		String contentType = file.getContentType();
		if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
			throw new StorageException("Dozwolone sa tylko pliki JPG, PNG albo WebP.");
		}
	}

	private String extensionFor(String contentType) {
		return switch (contentType.toLowerCase(Locale.ROOT)) {
			case "image/jpeg" -> ".jpg";
			case "image/png" -> ".png";
			case "image/webp" -> ".webp";
			default -> throw new StorageException("Nieobslugiwany format zdjecia.");
		};
	}
}
