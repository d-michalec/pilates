package pl.babastudiobe.faq;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "faq_entries")
class FaqEntry {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, length = 400)
	private String question;

	@Column(nullable = false, columnDefinition = "text")
	private String answer;

	@Column(name = "sort_order", nullable = false)
	private Integer sortOrder;


	@Column(name = "question_en", length = 400)
	private String questionEn;

	@Column(name = "answer_en", columnDefinition = "text")
	private String answerEn;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	protected FaqEntry() {
	}

	FaqEntry(String question, String answer, String questionEn, String answerEn, int sortOrder) {
		this.question = question;
		this.answer = answer;
		this.questionEn = questionEn;
		this.answerEn = answerEn;
		this.sortOrder = sortOrder;
	}

	@PrePersist
	void prePersist() {
		OffsetDateTime now = OffsetDateTime.now();
		this.createdAt = now;
		this.updatedAt = now;
	}

	@PreUpdate
	void preUpdate() {
		this.updatedAt = OffsetDateTime.now();
	}

	void update(String question, String answer, String questionEn, String answerEn) {
		this.question = question;
		this.answer = answer;
		this.questionEn = questionEn;
		this.answerEn = answerEn;
	}

	void assignSortOrder(int sortOrder) {
		this.sortOrder = sortOrder;
	}

	UUID getId() {
		return id;
	}

	String getQuestion() {
		return question;
	}

	String getAnswer() {
		return answer;
	}

	Integer getSortOrder() {
		return sortOrder;
	}

	OffsetDateTime getCreatedAt() {
		return createdAt;
	}

	String getQuestionEn() {
		return questionEn;
	}

	String getAnswerEn() {
		return answerEn;
	}
}
