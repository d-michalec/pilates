package pl.babastudiobe.media;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Iterator;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import pl.babastudiobe.storage.StorageException;

@Service
public class MediaStorageService {

	private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
	private static final int THUMBNAIL_MAX_WIDTH = 420;
	private static final float THUMBNAIL_QUALITY = 0.78f;

	private final Path uploadsRoot;
	private final MediaAssetRepository repository;

	public MediaStorageService(
			@Value("${app.uploads-dir:../uploads}") String uploadsDir,
			MediaAssetRepository repository
	) {
		this.uploadsRoot = Paths.get(uploadsDir).toAbsolutePath().normalize();
		this.repository = repository;
	}

	public MediaAsset storeImage(String category, MultipartFile file) {
		validateImage(file);

		String normalizedCategory = normalizeCategory(category);
		String contentType = file.getContentType();
		String extension = extensionFor(contentType);
		String storedFileName = UUID.randomUUID() + extension;
		Path targetDirectory = uploadsRoot.resolve(normalizedCategory).normalize();
		Path target = targetDirectory.resolve(storedFileName).normalize();

		if (!target.startsWith(uploadsRoot)) {
			throw new StorageException("Nieprawidłowa ścieżka zapisu pliku.");
		}

		try {
			Files.createDirectories(targetDirectory);
			file.transferTo(target);
		}
		catch (IOException exception) {
			throw new StorageException("Nie udało się zapisać zdjęcia.", exception);
		}

		String relativePath = normalizedCategory + "/" + storedFileName;
		ThumbnailMetadata thumbnail = createThumbnailIfPossible(normalizedCategory, storedFileName, target);
		MediaAsset asset = new MediaAsset(
				normalizedCategory,
				originalFileName(file),
				storedFileName,
				relativePath,
				contentType,
				file.getSize(),
				thumbnail == null ? null : thumbnail.relativePath(),
				thumbnail == null ? null : thumbnail.contentType(),
				thumbnail == null ? null : thumbnail.sizeBytes()
		);

		return repository.save(asset);
	}

	/**
	 * Kasuje plik, miniaturę i rekord. Bez tego każde usunięcie encji i każda podmiana
	 * zdjęcia zostawiałaby osierocony plik na dysku VPS-a.
	 */
	@Transactional
	public void delete(MediaAsset asset) {
		if (asset == null) {
			return;
		}

		deleteFile(asset.getRelativePath());
		deleteFile(asset.getThumbnailRelativePath());
		repository.delete(asset);
	}

	private void deleteFile(String relativePath) {
		if (relativePath == null || relativePath.isBlank()) {
			return;
		}

		Path target = uploadsRoot.resolve(relativePath).normalize();
		if (!target.startsWith(uploadsRoot)) {
			return;
		}

		try {
			Files.deleteIfExists(target);
		}
		catch (IOException exception) {
			// Brak pliku nie może wywrócić usuwania rekordu - baza jest źródłem prawdy.
			throw new StorageException("Nie udało się usunąć pliku " + relativePath + ".", exception);
		}
	}

	@EventListener(ApplicationReadyEvent.class)
	@Transactional
	public void createMissingThumbnails() {
		for (MediaAsset asset : repository.findAllByThumbnailRelativePathIsNull()) {
			Path sourcePath = uploadsRoot.resolve(asset.getRelativePath()).normalize();
			if (!sourcePath.startsWith(uploadsRoot) || !Files.isRegularFile(sourcePath)) {
				continue;
			}

			ThumbnailMetadata thumbnail = createThumbnailIfPossible(asset.getCategory(), asset.getStoredFileName(), sourcePath);
			if (thumbnail != null) {
				asset.assignThumbnail(thumbnail.relativePath(), thumbnail.contentType(), thumbnail.sizeBytes());
			}
		}
	}

	private void validateImage(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new StorageException("Zdjęcie jest wymagane.");
		}

		String contentType = file.getContentType();
		if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
			throw new StorageException("Dozwolone są tylko pliki JPG, PNG albo WebP.");
		}
	}

	private String normalizeCategory(String category) {
		String normalized = category == null ? "" : category.toLowerCase(Locale.ROOT).trim();
		if (!normalized.matches("[a-z0-9][a-z0-9-]{0,78}[a-z0-9]")) {
			throw new StorageException("Nieprawidłowa kategoria pliku.");
		}

		return normalized;
	}

	private String originalFileName(MultipartFile file) {
		String originalFileName = file.getOriginalFilename();
		if (originalFileName == null || originalFileName.isBlank()) {
			return "upload" + extensionFor(file.getContentType());
		}

		return Path.of(originalFileName).getFileName().toString();
	}

	private String extensionFor(String contentType) {
		return switch (contentType.toLowerCase(Locale.ROOT)) {
			case "image/jpeg" -> ".jpg";
			case "image/png" -> ".png";
			case "image/webp" -> ".webp";
			default -> throw new StorageException("Nieobsługiwany format zdjęcia.");
		};
	}

	private ThumbnailMetadata createThumbnailIfPossible(String category, String storedFileName, Path sourcePath) {
		try (InputStream inputStream = Files.newInputStream(sourcePath)) {
			BufferedImage source = ImageIO.read(inputStream);
			if (source == null) {
				return null;
			}

			int thumbnailWidth = Math.min(THUMBNAIL_MAX_WIDTH, source.getWidth());
			int thumbnailHeight = Math.max(1, (int) Math.round(source.getHeight() * (thumbnailWidth / (double) source.getWidth())));
			BufferedImage thumbnail = new BufferedImage(thumbnailWidth, thumbnailHeight, BufferedImage.TYPE_INT_RGB);

			Graphics2D graphics = thumbnail.createGraphics();
			try {
				graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
				graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
				graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
				graphics.setColor(Color.WHITE);
				graphics.fillRect(0, 0, thumbnailWidth, thumbnailHeight);
				graphics.drawImage(source, 0, 0, thumbnailWidth, thumbnailHeight, null);
			}
			finally {
				graphics.dispose();
			}

			Path thumbnailDirectory = uploadsRoot.resolve(category).resolve("thumbs").normalize();
			if (!thumbnailDirectory.startsWith(uploadsRoot)) {
				throw new StorageException("Nieprawidłowa ścieżka zapisu miniatury.");
			}

			Files.createDirectories(thumbnailDirectory);
			String thumbnailFileName = stripExtension(storedFileName) + "-thumb.jpg";
			Path thumbnailPath = thumbnailDirectory.resolve(thumbnailFileName).normalize();
			if (!thumbnailPath.startsWith(uploadsRoot)) {
				throw new StorageException("Nieprawidłowa ścieżka zapisu miniatury.");
			}

			writeJpeg(thumbnail, thumbnailPath);
			return new ThumbnailMetadata(
					category + "/thumbs/" + thumbnailFileName,
					"image/jpeg",
					Files.size(thumbnailPath)
			);
		}
		catch (IOException | RuntimeException exception) {
			return null;
		}
	}

	private void writeJpeg(BufferedImage image, Path target) throws IOException {
		Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
		if (!writers.hasNext()) {
			ImageIO.write(image, "jpg", target.toFile());
			return;
		}

		ImageWriter writer = writers.next();
		try (ImageOutputStream outputStream = ImageIO.createImageOutputStream(target.toFile())) {
			ImageWriteParam parameters = writer.getDefaultWriteParam();
			if (parameters.canWriteCompressed()) {
				parameters.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
				parameters.setCompressionQuality(THUMBNAIL_QUALITY);
			}

			writer.setOutput(outputStream);
			writer.write(null, new IIOImage(image, null, null), parameters);
		}
		finally {
			writer.dispose();
		}
	}

	private String stripExtension(String fileName) {
		int dotIndex = fileName.lastIndexOf('.');
		if (dotIndex <= 0) {
			return fileName;
		}

		return fileName.substring(0, dotIndex);
	}

	private record ThumbnailMetadata(String relativePath, String contentType, long sizeBytes) {
	}
}
