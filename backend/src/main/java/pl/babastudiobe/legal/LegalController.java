package pl.babastudiobe.legal;

import java.time.OffsetDateTime;
import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Regulamin i polityka prywatności. Moduł jest mały, więc kontroler, serwis
 * i rekordy transportowe mieszczą się w jednym pliku - tak samo jak w FAQ.
 * Repozytoria muszą być osobno, bo Spring Data nie tworzy beanów dla
 * interfejsów zagnieżdżonych w klasie.
 *
 * Dokument edytuje się jako całość: panel przysyła nagłówek i pełną listę
 * sekcji, a serwis podmienia je jednym zapisem. Nie ma osobnych operacji
 * dodawania, usuwania i zmiany kolejności sekcji, bo przy dokumencie prawnym
 * nikt nie zmienia jednego punktu w oderwaniu od reszty.
 */
@Validated
@RestController
@RequestMapping("/api")
class LegalController {

	private final LegalService legalService;

	LegalController(LegalService legalService) {
		this.legalService = legalService;
	}

	/** Lista dokumentów dla panelu - bez treści, tylko tytuły i daty zmiany. */
	@GetMapping("/legal")
	List<LegalSummaryResponse> list() {
		return legalService.list();
	}

	@GetMapping("/legal/{docKey}")
	LegalDocumentResponse get(@PathVariable String docKey) {
		return legalService.get(docKey);
	}

	@PutMapping("/admin/legal/{docKey}")
	LegalDocumentResponse update(@PathVariable String docKey, @RequestBody @Valid LegalDocumentRequest request) {
		return legalService.update(docKey, request);
	}

	/** Pola angielskie są opcjonalne - brak tłumaczenia to normalny stan. */
	record LegalSectionRequest(
			@Size(max = 300) String heading,
			@Size(max = 300) String headingEn,
			@NotNull @Size(max = 20000) String body,
			@Size(max = 20000) String bodyEn,
			boolean needsContent
	) {
	}

	record LegalDocumentRequest(
			@NotBlank @Size(max = 200) String title,
			@Size(max = 200) String titleEn,
			@Size(max = 4000) String intro,
			@Size(max = 4000) String introEn,
			/*
			 * `@NotEmpty`, nie `@NotNull`: pusta lista przechodziła walidację
			 * i kasowała wszystkie sekcje dokumentu, zwracając 200. Panel potrafi
			 * to wysłać zwykłym klikaniem w kosz.
			 *
			 * `@NotNull` na elemencie jest osobno, bo kaskada `@Valid` na
			 * elemencie null-a nie sprawdza - żądanie z `[null]` przechodziło
			 * walidację i wywracało serwis na NPE, czyli 500 zamiast 400.
			 */
			@NotEmpty List<@Valid @NotNull LegalSectionRequest> sections
	) {
	}

	record LegalSectionResponse(
			String heading,
			String headingEn,
			String body,
			String bodyEn,
			boolean needsContent,
			Integer sortOrder
	) {

		static LegalSectionResponse from(LegalSection section) {
			return new LegalSectionResponse(
					section.getHeading(),
					section.getHeadingEn(),
					section.getBody(),
					section.getBodyEn(),
					section.isNeedsContent(),
					section.getSortOrder());
		}
	}

	/**
	 * Zwracamy obie wersje językowe. Front wybiera właściwą przy renderowaniu,
	 * a panel dostaje komplet do edycji bez osobnego endpointu.
	 */
	record LegalDocumentResponse(
			String docKey,
			String title,
			String titleEn,
			String intro,
			String introEn,
			OffsetDateTime updatedAt,
			List<LegalSectionResponse> sections
	) {

		static LegalDocumentResponse from(LegalDocument document) {
			return new LegalDocumentResponse(
					document.getDocKey(),
					document.getTitle(),
					document.getTitleEn(),
					document.getIntro(),
					document.getIntroEn(),
					document.getUpdatedAt(),
					document.getSections().stream().map(LegalSectionResponse::from).toList());
		}
	}

	record LegalSummaryResponse(String docKey, String title, OffsetDateTime updatedAt) {

		static LegalSummaryResponse from(LegalDocument document) {
			return new LegalSummaryResponse(document.getDocKey(), document.getTitle(), document.getUpdatedAt());
		}
	}

	@Service
	static class LegalService {

		private final LegalDocumentRepository repository;
		private final LegalDocumentRevisionRepository revisionRepository;
		private final EntityManager entityManager;

		LegalService(
				LegalDocumentRepository repository,
				LegalDocumentRevisionRepository revisionRepository,
				EntityManager entityManager
		) {
			this.repository = repository;
			this.revisionRepository = revisionRepository;
			this.entityManager = entityManager;
		}

		@Transactional(readOnly = true)
		List<LegalSummaryResponse> list() {
			return repository.findAllByOrderByDocKeyAsc().stream()
					.map(LegalSummaryResponse::from)
					.toList();
		}

		@Transactional(readOnly = true)
		LegalDocumentResponse get(String docKey) {
			return LegalDocumentResponse.from(findOrThrow(docKey));
		}

		@Transactional
		LegalDocumentResponse update(String docKey, LegalDocumentRequest request) {
			LegalDocument document = findOrThrow(docKey);

			List<LegalSection> sections = request.sections().stream()
					.map(sekcja -> new LegalSection(
							trimToNull(sekcja.heading()),
							trimToNull(sekcja.headingEn()),
							sekcja.body() == null ? "" : sekcja.body().trim(),
							trimToNull(sekcja.bodyEn()),
							sekcja.needsContent()))
					.toList();

			document.update(
					request.title().trim(),
					trimToNull(request.titleEn()),
					trimToNull(request.intro()),
					trimToNull(request.introEn()),
					sections);

			/*
			 * Bez `repository.save(document)`: encja jest zarządzana, więc zmiany
			 * i tak polecą na commicie, a `save` na zarządzanej encji to `merge`,
			 * który dodatkowo podmienia świeżo zbudowane sekcje na swoje kopie.
			 *
			 * `flush` jest tu konieczny: wpis w historii buduje baza, czytając
			 * tabele, więc nowe sekcje muszą być w nich przed tym zapytaniem.
			 */
			entityManager.flush();
			revisionRepository.zapiszMigawke(docKey);

			return LegalDocumentResponse.from(document);
		}

		/** Puste tłumaczenie zapisujemy jako null, żeby front miał jeden warunek. */
		private String trimToNull(String value) {
			return StringUtils.hasText(value) ? value.trim() : null;
		}

		private LegalDocument findOrThrow(String docKey) {
			return repository.findByDocKey(docKey).orElseThrow(() -> new ResponseStatusException(
					HttpStatus.NOT_FOUND,
					"Nie znaleziono dokumentu o podanym kluczu."));
		}
	}
}
