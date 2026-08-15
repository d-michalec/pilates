package pl.babastudiobe.bar;

import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

/** Godziny otwarcia jednego dnia przesyłane z panelu. */
record BarDayRequest(
		short dayOfWeek,
		@JsonFormat(pattern = "HH:mm") LocalTime opensAt,
		@JsonFormat(pattern = "HH:mm") LocalTime closesAt,
		boolean closed
) {
}
