package pl.babastudiobe.storage;

public record StoredFile(
		String path,
		String contentType,
		long size
) {
}
