package pl.babastudiobe.fitssey;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * Pojedyncze wywołanie webhooka z Fitssey, zapisane dokładnie tak, jak przyszło.
 *
 * Encja celowo nie interpretuje treści. Fitssey nie udokumentował webhooków ani
 * jednym zdaniem - adres /docs/webhooks zwraca czterysta cztery - więc format
 * zdarzeń, sposób przesyłania klucza uwierzytelniającego i obecność danych
 * kontaktowych klientki poznamy dopiero z pierwszego prawdziwego wywołania.
 * Dlatego najpierw nagrywamy, a dopiero potem budujemy na tym mapowanie do Mety.
 */
@Entity
@Table(name = "fitssey_webhook_events")
class FitsseyWebhookEvent {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "received_at", nullable = false)
	private OffsetDateTime receivedAt;

	/**
	 * Zgadywany typ zdarzenia, odczytany z kilku prawdopodobnych pól treści.
	 * To podpowiedź dla człowieka patrzącego na listę w panelu, a nie podstawa
	 * do podejmowania decyzji - na tym etapie nie wiemy jeszcze, jak Fitssey
	 * nazywa to pole, więc wartość pusta jest poprawnym stanem.
	 */
	@Column(name = "event_type", length = 120)
	private String eventType;

	@Column(name = "external_id", length = 200)
	private String externalId;

	@Column(nullable = false, columnDefinition = "text")
	private String headers;

	@Column(nullable = false, columnDefinition = "text")
	private String payload;

	/**
	 * Czy klucz uwierzytelniający Fitssey znalazł się w wywołaniu.
	 *
	 * Rozróżniamy trzy stany i to rozróżnienie jest istotne: `null` znaczy
	 * "nie sprawdzaliśmy, bo nie mamy skonfigurowanego klucza", a `false`
	 * znaczy "klucz mamy, ale w tym wywołaniu go nie ma" - czyli albo ktoś
	 * obcy puka, albo Fitssey przesyła go inaczej, niż zakładamy.
	 */
	@Column(name = "signature_ok")
	private Boolean signatureOk;

	@Column(name = "meta_event_name", length = 60)
	private String metaEventName;

	@Column(name = "meta_sent_at")
	private OffsetDateTime metaSentAt;

	@Column(name = "meta_response", columnDefinition = "text")
	private String metaResponse;

	/**
	 * Kwota w groszach, tak jak podaje ją Fitssey ("a positive integer in the
	 * smallest currency unit"). Przeliczenie na złotówki robimy dopiero przy
	 * wyświetlaniu - dzięki temu w podglądzie widać wartość surową i pomyłka
	 * rzędu wielkości rzuca się w oczy.
	 */
	@Column(name = "value_minor_units")
	private Long valueMinorUnits;

	@Column(columnDefinition = "text")
	private String error;

	protected FitsseyWebhookEvent() {
	}

	FitsseyWebhookEvent(
			String headers,
			String payload,
			String eventType,
			String externalId,
			Boolean signatureOk,
			Long valueMinorUnits
	) {
		this.headers = headers;
		this.payload = payload;
		this.eventType = eventType;
		this.externalId = externalId;
		this.signatureOk = signatureOk;
		this.valueMinorUnits = valueMinorUnits;
	}

	@PrePersist
	void nadajCzasOdbioru() {
		if (receivedAt == null) {
			receivedAt = OffsetDateTime.now();
		}
	}

	UUID getId() {
		return id;
	}

	OffsetDateTime getReceivedAt() {
		return receivedAt;
	}

	String getEventType() {
		return eventType;
	}

	String getExternalId() {
		return externalId;
	}

	String getHeaders() {
		return headers;
	}

	String getPayload() {
		return payload;
	}

	Boolean getSignatureOk() {
		return signatureOk;
	}

	String getMetaEventName() {
		return metaEventName;
	}

	OffsetDateTime getMetaSentAt() {
		return metaSentAt;
	}

	String getMetaResponse() {
		return metaResponse;
	}

	Long getValueMinorUnits() {
		return valueMinorUnits;
	}

	String getError() {
		return error;
	}
}
