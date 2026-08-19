package pl.babastudiobe.newsletter;

record NewsletterAdminStatusResponse(
		boolean getResponseConfigured,
		String getResponseAdminUrl,
		long totalSubscriptions,
		long localOnlySubscriptions,
		long acceptedByGetResponse,
		long failedSubscriptions,
		/** Adresy, których GetResponse nie przyjmie - zwykle po wcześniejszej rezygnacji. */
		long rejectedByGetResponse,
		/** Osoby, które zrezygnowały. Liczą się do sumy, ale nie dostają wiadomości. */
		long unsubscribed,
		String lastFailureReason
) {
}
