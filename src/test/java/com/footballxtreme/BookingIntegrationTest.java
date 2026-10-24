package com.footballxtreme;

import com.footballxtreme.email.EmailService;
import com.footballxtreme.pitch.*;
import com.footballxtreme.reservation.*;
import com.footballxtreme.settings.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import java.time.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=${TEST_DB_URL:jdbc:h2:mem:booking;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000}",
    "spring.datasource.username=${TEST_DB_USER:sa}", "spring.datasource.password=${TEST_DB_PASSWORD:}",
    "spring.jpa.hibernate.ddl-auto=create-drop", "app.admin.password=test-only-long-password",
    "server.servlet.session.cookie.secure=false"
})
@AutoConfigureMockMvc
class BookingIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ReservationService service;
    @Autowired ReservationRepository reservations;
    @Autowired PitchRepository pitches;
    @Autowired BlockedTimeRepository blocks;
    @Autowired BlockedTimeService blockedService;
    @Autowired WorkingHoursRepository hours;
    @MockitoBean EmailService email;
    Pitch pitch;
    LocalDate date;
    @BeforeEach void setup() {
        reservations.deleteAll(); blocks.deleteAll(); pitches.deleteAll(); hours.deleteAll();
        pitch=pitches.save(new Pitch("Test pitch"));
        date=LocalDate.now(ZoneId.of("Europe/Sofia")).plusDays(2);
        for(var day:DayOfWeek.values()) hours.save(new WorkingHours(day,LocalTime.of(9,0),LocalTime.of(23,0),false));
    }
    Reservation book(LocalDate day, LocalTime start, int duration) {
        return service.createReservation(pitch.getId(),day,start,duration,"Test Customer","test@example.com","0888123456",true);
    }
    String body() { return """
        {"pitchId":%d,"date":"%s","startTime":"12:00","durationMinutes":60,
         "customerName":"Test Customer","customerEmail":"test@example.com","customerPhone":"0888123456","termsAccepted":true}
        """.formatted(pitch.getId(),date); }

    @Test void publicAvailabilityDoesNotExposePersonalData() throws Exception {
        book(date,LocalTime.NOON,60);
        mvc.perform(get("/api/reservations/pitch/"+pitch.getId()).param("date",date.toString()))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].startTime").value("12:00:00"))
            .andExpect(jsonPath("$[0].customerName").doesNotExist()).andExpect(jsonPath("$[0].customerPhone").doesNotExist())
            .andExpect(jsonPath("$[0].customerEmail").doesNotExist()).andExpect(jsonPath("$[0].id").doesNotExist());
    }
    @Test void anonymousCannotCancelEvenWithCsrf() throws Exception {
        var r=book(date,LocalTime.NOON,60);
        mvc.perform(put("/api/reservations/"+r.getId()+"/cancel").with(csrf())).andExpect(status().isUnauthorized());
        assertThat(reservations.findById(r.getId()).orElseThrow().getStatus()).isEqualTo(ReservationStatus.CONFIRMED);
    }
    @Test void privateListsAndAdminPitchesRequireAuthentication() throws Exception {
        for(var url:new String[]{"/api/reservations","/api/reservations/search?phone=0888","/api/pitches/admin","/api/blocked-times","/api/blocked-times/admin/pitch/1?date="+date})
            mvc.perform(get(url)).andExpect(status().isUnauthorized());
    }
    @Test void csrfRequiredForPublicBooking() throws Exception {
        mvc.perform(post("/api/reservations").contentType("application/json").content(body())).andExpect(status().isForbidden());
        assertThat(reservations.count()).isZero();
    }
    @Test void validBookingSucceedsAndOverlappingBookingReturnsConflict() throws Exception {
        mvc.perform(post("/api/reservations").with(csrf()).contentType("application/json").content(body())).andExpect(status().isCreated());
        mvc.perform(post("/api/reservations").with(csrf()).contentType("application/json").content(body())).andExpect(status().isConflict());
        assertThat(reservations.count()).isEqualTo(1);
        verify(email,times(1)).sendReservationConfirmation(any());
    }
    @Test void invalidRequestReturnsBadRequest() throws Exception {
        mvc.perform(post("/api/reservations").with(csrf()).contentType("application/json").content("{}"))
            .andExpect(status().isBadRequest());
        mvc.perform(post("/api/reservations").with(csrf()).contentType("application/json").content(body().replace("test@example.com","not-email")))
            .andExpect(status().isBadRequest());
    }
    @Test void rejectsPastMidnightAndUnalignedStarts() {
        assertThatThrownBy(()->book(date.minusYears(1),LocalTime.NOON,60)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(()->book(date,LocalTime.of(23,30),90)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(()->book(date,LocalTime.of(12,1),60)).isInstanceOf(IllegalArgumentException.class);
        assertThat(reservations.count()).isZero();
    }
    @Test void configuredHoursAndClosedDaysAreEnforced() {
        var h=hours.findByDayOfWeek(date.getDayOfWeek()).orElseThrow();
        h.setOpeningTime(LocalTime.of(14,0)); hours.save(h);
        assertThatThrownBy(()->book(date,LocalTime.NOON,60)).isInstanceOf(IllegalArgumentException.class);
        h.setClosed(true); hours.save(h);
        assertThatThrownBy(()->book(date,LocalTime.of(15,0),60)).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void inactivePitchRejected() {
        pitch.setActive(false); pitches.save(pitch);
        assertThatThrownBy(()->book(date,LocalTime.NOON,60)).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void adjacentReservationsAllowed() {
        book(date,LocalTime.NOON,90); book(date,LocalTime.of(13,30),60);
        assertThat(reservations.count()).isEqualTo(2);
    }
    @Test void blockPreventsReservationAndReasonIsPrivate() throws Exception {
        blockedService.createBlockedTime(pitch.getId(),date,LocalTime.NOON,LocalTime.of(14,0),"Private maintenance note");
        assertThatThrownBy(()->book(date,LocalTime.NOON,60)).isInstanceOf(BookingConflictException.class);
        mvc.perform(get("/api/blocked-times/pitch/"+pitch.getId()).param("date",date.toString()))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].reason").doesNotExist());
    }
    @Test void cannotBlockAnExistingReservation() {
        book(date,LocalTime.NOON,60);
        assertThatThrownBy(()->blockedService.createBlockedTime(pitch.getId(),date,LocalTime.NOON,LocalTime.of(14,0),"test"))
            .isInstanceOf(BookingConflictException.class);
        assertThat(blocks.count()).isZero();
    }
    @Test void concurrentRequestsCannotDoubleBook() throws Exception {
        var gate=new CountDownLatch(1);
        try(var executor=Executors.newFixedThreadPool(2)) {
            Callable<Boolean> task=()-> { gate.await(); try { book(date,LocalTime.NOON,60); return true; }
                catch(BookingConflictException expected) { return false; } };
            var first=executor.submit(task); var second=executor.submit(task); gate.countDown();
            assertThat(java.util.List.of(first.get(15,TimeUnit.SECONDS),second.get(15,TimeUnit.SECONDS)))
                .containsExactlyInAnyOrder(true,false);
        }
        assertThat(reservations.count()).isEqualTo(1);
        verify(email,times(1)).sendReservationConfirmation(any());
    }
    @Test void adminCanCancelButCsrfIsRequired() throws Exception {
        var r=book(date,LocalTime.NOON,60);
        mvc.perform(put("/api/reservations/"+r.getId()+"/cancel").with(user("admin").roles("ADMIN")))
            .andExpect(status().isForbidden());
        mvc.perform(put("/api/reservations/"+r.getId()+"/cancel").with(user("admin").roles("ADMIN")).with(csrf()))
            .andExpect(status().isOk());
        assertThat(reservations.findById(r.getId()).orElseThrow().getStatus()).isEqualTo(ReservationStatus.CANCELLED);
    }
    @Test void nonAdminCannotManagePitches() throws Exception {
        mvc.perform(get("/api/pitches/admin").with(user("viewer").roles("USER"))).andExpect(status().isForbidden());
    }
    @Test void emailFailureDoesNotUndoCommittedBooking() {
        doThrow(new RuntimeException("simulated outage")).when(email).sendReservationConfirmation(any());
        book(date,LocalTime.NOON,60);
        assertThat(reservations.count()).isEqualTo(1);
    }
    @Test void realCsrfTokenWorksForLogin() throws Exception {
        var result=mvc.perform(get("/api/csrf")).andExpect(status().isOk()).andReturn();
        var json=new com.fasterxml.jackson.databind.ObjectMapper().readTree(result.getResponse().getContentAsString());
        mvc.perform(post("/login").session((org.springframework.mock.web.MockHttpSession)result.getRequest().getSession())
            .param("username","admin").param("password","test-only-long-password").param(json.get("parameterName").asText(),json.get("token").asText()))
            .andExpect(status().is3xxRedirection()).andExpect(redirectedUrl("/admin.html"));
    }
}
