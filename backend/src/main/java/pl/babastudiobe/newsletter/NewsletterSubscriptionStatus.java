package pl.babastudiobe.newsletter;

enum NewsletterSubscriptionStatus {
	LOCAL_ONLY,
	GETRESPONSE_ACCEPTED,
	FAILED,
	/**
	 * Osoba zrezygnowała. Wiersz zostaje, a nie znika od razu, bo jest dowodem na
	 * to, że zgoda kiedyś była i kiedy została wycofana. Zadanie sprzątające kasuje
	 * takie wpisy po roku.
	 */
	UNSUBSCRIBED
}
