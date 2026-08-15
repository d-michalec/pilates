package pl.babastudiobe.newsletter;

record NewsletterAdminStatusResponse(
		boolean getResponseConfigured,
		String getResponseAdminUrl,
		long totalSubscriptions,
		long localOnlySubscriptions,
		long acceptedByGetResponse,
		long failedSubscriptions,
		String lastFailureReason
) {
}
