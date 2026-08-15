package pl.babastudiobe.team;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class TeamMemberApiTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void createsAndListsTeamMember() throws Exception {
		MockMultipartFile photo = new MockMultipartFile(
				"photo",
				"person.png",
				"image/png",
				new byte[] { 1, 2, 3 }
		);

		mockMvc.perform(multipart("/api/admin/team")
						.file(photo)
						.param("fullName", "Anna Kowalska")
						.param("description", "Instruktorka pilatesu"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.fullName").value("Anna Kowalska"))
				.andExpect(jsonPath("$.description").value("Instruktorka pilatesu"))
				.andExpect(jsonPath("$.image.url").value(startsWith("/uploads/team/")));

		mockMvc.perform(get("/api/team"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].fullName").value("Anna Kowalska"));
	}
}
