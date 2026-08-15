package pl.babastudiobe.faq;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * FAQ to na tyle mały moduł, że kontroler i serwis mieszczą się w jednym pliku.
 * Repozytorium musi być osobno, bo Spring Data nie tworzy beanów dla interfejsów
 * zagnieżdżonych w klasie. Wzorzec operacji jest ten sam co w pozostałych modułach:
 * pełna lista identyfikatorów przy zmianie kolejności i domykanie numeracji po usunięciu.
 */
@Validated
@RestController
@RequestMapping("/api")
class FaqController {

	private final FaqService faqService;

	FaqController(FaqService faqService) {
		this.faqService = faqService;
	}

	@GetMapping("/faq")
	List<FaqResponse> list() {
		return faqService.list();
	}

	@PostMapping("/admin/faq")
	ResponseEntity<FaqResponse> create(@RequestBody @Valid FaqRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(faqService.create(request));
	}

	@PutMapping("/admin/faq/{id}")
	FaqResponse update(@PathVariable UUID id, @RequestBody @Valid FaqRequest request) {
		return faqService.update(id, request);
	}

	@DeleteMapping("/admin/faq/{id}")
	ResponseEntity<Void> delete(@PathVariable UUID id) {
		faqService.delete(id);
		return ResponseEntity.noContent().build();
	}

	@PatchMapping("/admin/faq/order")
	List<FaqResponse> reorder(@RequestBody @NotEmpty List<UUID> orderedIds) {
		return faqService.reorder(orderedIds);
	}

	/** Pola angielskie są opcjonalne - brak tłumaczenia to normalny stan. */
	record FaqRequest(
			@NotBlank @Size(max = 400) String question,
			@NotBlank @Size(max = 4000) String answer,
			@Size(max = 400) String questionEn,
			@Size(max = 4000) String answerEn
	) {
	}

	/**
	 * Zwracamy obie wersje językowe. Front wybiera właściwą przy renderowaniu, a panel
	 * dostaje komplet do edycji bez osobnego endpointu.
	 */
	record FaqResponse(
			UUID id,
			String question,
			String answer,
			String questionEn,
			String answerEn,
			Integer sortOrder
	) {

		static FaqResponse from(FaqEntry entry) {
			return new FaqResponse(
					entry.getId(),
					entry.getQuestion(),
					entry.getAnswer(),
					entry.getQuestionEn(),
					entry.getAnswerEn(),
					entry.getSortOrder());
		}
	}

	@Service
	static class FaqService {

		private final FaqRepository repository;

		FaqService(FaqRepository repository) {
			this.repository = repository;
		}

		@Transactional(readOnly = true)
		List<FaqResponse> list() {
			return repository.findAllByOrderBySortOrderAscCreatedAtAsc().stream()
					.map(FaqResponse::from)
					.toList();
		}

		@Transactional
		FaqResponse create(FaqRequest request) {
			FaqEntry entry = new FaqEntry(
					request.question().trim(),
					request.answer().trim(),
					trimToNull(request.questionEn()),
					trimToNull(request.answerEn()),
					nextSortOrder());
			return FaqResponse.from(repository.save(entry));
		}

		@Transactional
		FaqResponse update(UUID id, FaqRequest request) {
			FaqEntry entry = findOrThrow(id);
			entry.update(
					request.question().trim(),
					request.answer().trim(),
					trimToNull(request.questionEn()),
					trimToNull(request.answerEn()));

			return FaqResponse.from(repository.save(entry));
		}

		@Transactional
		void delete(UUID id) {
			repository.delete(findOrThrow(id));
			repository.flush();
			normalizeSortOrder();
		}

		@Transactional
		List<FaqResponse> reorder(List<UUID> orderedIds) {
			List<FaqEntry> entries = repository.findAll();
			List<UUID> currentIds = entries.stream().map(FaqEntry::getId).toList();

			if (orderedIds.size() != entries.size() || !orderedIds.containsAll(currentIds)) {
				throw new ResponseStatusException(
						HttpStatus.BAD_REQUEST,
						"Lista kolejności musi zawierać dokładnie te same pytania co baza.");
			}

			for (FaqEntry entry : entries) {
				entry.assignSortOrder(orderedIds.indexOf(entry.getId()));
			}

			repository.saveAll(entries);
			return list();
		}

		/** Puste tłumaczenie zapisujemy jako null, żeby front miał jeden warunek. */
		private String trimToNull(String value) {
			return StringUtils.hasText(value) ? value.trim() : null;
		}

		private FaqEntry findOrThrow(UUID id) {
			return repository.findById(id).orElseThrow(() -> new ResponseStatusException(
					HttpStatus.NOT_FOUND,
					"Nie znaleziono pytania o podanym identyfikatorze."));
		}

		private int nextSortOrder() {
			return repository.findAll().stream()
					.map(FaqEntry::getSortOrder)
					.filter(Objects::nonNull)
					.max(Comparator.naturalOrder())
					.map(highest -> highest + 1)
					.orElse(0);
		}

		private void normalizeSortOrder() {
			List<FaqEntry> entries = repository.findAllByOrderBySortOrderAscCreatedAtAsc();

			for (int position = 0; position < entries.size(); position++) {
				entries.get(position).assignSortOrder(position);
			}

			repository.saveAll(entries);
		}
	}
}
