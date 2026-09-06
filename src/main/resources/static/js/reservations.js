// ======================================================
// RESERVATIONS
// ======================================================

let selectedReservation = null;


// ======================================================
// LOAD RESERVATIONS FOR DATE
// ======================================================

async function loadReservationsForDate(date, pitchId = null) {

    const container =
        document.getElementById("calendarReservations");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="loading">
            Зареждане на резервациите...
        </div>
    `;

    try {

        let url =
            `/reservations/date/${date}`;

        if (pitchId) {
            url += `?pitchId=${pitchId}`;
        }

        const reservations =
            await window.apiFetch(url);

        const activeReservations =
            reservations.filter(
                reservation =>
                    reservation.status === "CONFIRMED"
            );

        if (activeReservations.length === 0) {

            container.innerHTML = `
                <div class="loading">
                    Няма резервации за
                    ${window.formatDateLong(date)}.
                </div>
            `;

            return;
        }

        activeReservations.sort(
            (a, b) =>
                a.startTime.localeCompare(
                    b.startTime
                )
        );

        container.innerHTML =
            activeReservations
                .map(
                    reservation =>
                        createReservationCard(
                            reservation
                        )
                )
                .join("");

        document
            .querySelectorAll(
                ".reservation-card[data-id]"
            )
            .forEach(card => {

                card.addEventListener(
                    "click",
                    () => {

                        const id =
                            Number(
                                card.dataset.id
                            );

                        const reservation =
                            activeReservations.find(
                                r =>
                                    r.id === id
                            );

                        if (reservation) {
                            openReservationDetails(
                                reservation
                            );
                        }
                    }
                );
            });

    } catch (error) {

        console.error(
            "Error loading reservations:",
            error
        );

        container.innerHTML = `
            <div class="loading">
                Неуспешно зареждане на резервациите.
            </div>
        `;

        window.showError(error);
    }
}


// ======================================================
// CREATE RESERVATION CARD
// ======================================================

function createReservationCard(reservation) {

    const start =
        window.formatTime(
            reservation.startTime
        );

    const end =
        window.calculateEndTime(
            reservation.startTime,
            reservation.durationMinutes
        );

    const pitchName =
        reservation.pitch?.name ||
        "Неизвестно игрище";

    return `
        <div
            class="reservation-card"
            data-id="${reservation.id}"
        >

            <div class="reservation-main">

                <div>

                    <div class="reservation-time">
                        ${start} – ${end}
                    </div>

                    <div class="reservation-name">
                        ${window.escapeHtml(
        reservation.customerName
    )}
                    </div>

                    <div class="reservation-meta">
                        ${window.escapeHtml(
        pitchName
    )}
                    </div>

                </div>

                <div>
                    <span class="status busy">
                        Резервирано
                    </span>
                </div>

            </div>

        </div>
    `;
}


// ======================================================
// OPEN RESERVATION DETAILS
// ======================================================

function openReservationDetails(reservation) {

    selectedReservation =
        reservation;

    const modal =
        document.getElementById(
            "reservationModal"
        );

    if (!modal) {

        console.warn(
            "Reservation modal not found."
        );

        return;
    }

    const start =
        window.formatTime(
            reservation.startTime
        );

    const end =
        window.calculateEndTime(
            reservation.startTime,
            reservation.durationMinutes
        );

    const pitchName =
        reservation.pitch?.name ||
        "Неизвестно игрище";

    const details =
        document.getElementById(
            "reservationDetails"
        );

    if (details) {

        details.innerHTML = `

            <div class="detail-row">
                <span class="detail-label">
                    Игрище
                </span>

                <span class="detail-value">
                    ${window.escapeHtml(
            pitchName
        )}
                </span>
            </div>

            <div class="detail-row">
                <span class="detail-label">
                    Дата
                </span>

                <span class="detail-value">
                    ${window.formatDate(
            reservation.date
        )}
                </span>
            </div>

            <div class="detail-row">
                <span class="detail-label">
                    Час
                </span>

                <span class="detail-value">
                    ${start} – ${end}
                </span>
            </div>

            <div class="detail-row">
                <span class="detail-label">
                    Клиент
                </span>

                <span class="detail-value">
                    ${window.escapeHtml(
            reservation.customerName
        )}
                </span>
            </div>

            <div class="detail-row">
                <span class="detail-label">
                    Телефон
                </span>

                <span class="detail-value">
                    ${window.escapeHtml(
            reservation.customerPhone
        )}
                </span>
            </div>

            <div class="detail-row">
                <span class="detail-label">
                    Email
                </span>

                <span class="detail-value">
                    ${window.escapeHtml(
            reservation.customerEmail
        )}
                </span>
            </div>

            <div class="detail-row">
                <span class="detail-label">
                    Статус
                </span>

                <span class="detail-value">
                    ${window.escapeHtml(
            reservation.status
        )}
                </span>
            </div>

        `;
    }

    modal.classList.add("show");
}


// ======================================================
// CLOSE RESERVATION MODAL
// ======================================================

function closeReservationModal() {

    const modal =
        document.getElementById(
            "reservationModal"
        );

    if (modal) {
        modal.classList.remove("show");
    }

    selectedReservation =
        null;
}


// ======================================================
// CANCEL RESERVATION
// ======================================================

async function cancelSelectedReservation() {

    if (!selectedReservation) {
        return;
    }

    const confirmed =
        confirm(
            "Сигурни ли сте, че искате да отмените тази резервация?"
        );

    if (!confirmed) {
        return;
    }

    try {

        await window.apiFetch(
            `/reservations/${selectedReservation.id}/cancel`,
            {
                method: "PUT"
            }
        );

        closeReservationModal();

        // Обновяваме избраната дата
        if (
            window.selectedCalendarDate
        ) {

            await loadReservationsForDate(
                window.selectedCalendarDate,
                window.selectedPitchId
            );
        }

        // Обновяваме календара
        if (
            typeof window.loadCalendarCounts ===
            "function"
        ) {

            await window.loadCalendarCounts();
        }

        // Обновяваме Dashboard
        if (
            typeof window.loadDashboard ===
            "function"
        ) {

            await window.loadDashboard();
        }

        alert(
            "Резервацията беше отменена успешно."
        );

    } catch (error) {

        console.error(
            "Cancel reservation error:",
            error
        );

        window.showError(error);
    }
}


// ======================================================
// REFRESH RESERVATIONS
// ======================================================

async function refreshReservations() {

    if (
        !window.selectedCalendarDate
    ) {
        return;
    }

    await loadReservationsForDate(
        window.selectedCalendarDate,
        window.selectedPitchId
    );
}


// ======================================================
// MODAL EVENTS
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const modal =
            document.getElementById(
                "reservationModal"
            );

        if (modal) {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target === modal
                    ) {

                        closeReservationModal();
                    }
                }
            );
        }

        const closeButton =
            document.getElementById(
                "closeReservationModal"
            );

        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeReservationModal
            );
        }

        const cancelButton =
            document.getElementById(
                "cancelReservationButton"
            );

        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                cancelSelectedReservation
            );
        }
    }
);


// ======================================================
// EXPORT
// ======================================================

window.selectedReservation =
    selectedReservation;

window.loadReservationsForDate =
    loadReservationsForDate;

window.createReservationCard =
    createReservationCard;

window.openReservationDetails =
    openReservationDetails;

window.closeReservationModal =
    closeReservationModal;

window.cancelSelectedReservation =
    cancelSelectedReservation;

window.refreshReservations =
    refreshReservations;