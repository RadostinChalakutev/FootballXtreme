package com.footballxtreme.email;

import com.footballxtreme.reservation.Reservation;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    private static final DateTimeFormatter TIME_FORMAT =
            DateTimeFormatter.ofPattern("HH:mm");

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendReservationConfirmation(
            Reservation reservation
    ) {

        String customerEmail =
                reservation.getCustomerEmail();

        if (customerEmail == null ||
                customerEmail.isBlank()) {

            return;
        }

        String customerName =
                reservation.getCustomerName();

        String pitchName =
                reservation.getPitch() != null
                        ? reservation.getPitch().getName()
                        : "Игрище";

        String reservationDate =
                reservation.getDate().toString();

        LocalTime startTime =
                reservation.getStartTime();

        LocalTime endTime =
                startTime.plusMinutes(
                        reservation.getDurationMinutes()
                );

        String formattedStartTime =
                startTime.format(TIME_FORMAT);

        String formattedEndTime =
                endTime.format(TIME_FORMAT);

        String subject =
                "FootballXtreme – Потвърдена резервация ⚽";

        String text = """
                Здравейте, %s!

                Вашата резервация във FootballXtreme е потвърдена.

                Игрище: %s
                Дата: %s
                Час: %s – %s
                Продължителност: %d минути

                Благодарим Ви, че избрахте FootballXtreme!

                FootballXtreme
                """.formatted(
                customerName,
                pitchName,
                reservationDate,
                formattedStartTime,
                formattedEndTime,
                reservation.getDurationMinutes()
        );

        String html = """
                <!DOCTYPE html>
                <html lang="bg">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport"
                          content="width=device-width, initial-scale=1.0">

                    <title>FootballXtreme - Потвърдена резервация</title>
                </head>

                <body style="
                    margin:0;
                    padding:0;
                    background:#f4f6f8;
                    font-family:Arial,Helvetica,sans-serif;
                    color:#17202a;
                ">

                    <table
                        width="100%%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                        style="
                            background:#f4f6f8;
                            padding:30px 15px;
                        "
                    >

                        <tr>
                            <td align="center">

                                <table
                                    width="100%%"
                                    cellpadding="0"
                                    cellspacing="0"
                                    border="0"
                                    style="
                                        max-width:600px;
                                        background:#ffffff;
                                        border-radius:16px;
                                        overflow:hidden;
                                        box-shadow:
                                            0 5px 25px
                                            rgba(0,0,0,0.08);
                                    "
                                >

                                    <!-- HEADER -->

                                    <tr>
                                        <td
                                            style="
                                                background:#111827;
                                                padding:28px 30px;
                                                text-align:center;
                                            "
                                        >

                                            <div
                                                style="
                                                    color:#ffffff;
                                                    font-size:28px;
                                                    font-weight:800;
                                                    letter-spacing:-0.5px;
                                                "
                                            >
                                                ⚽ FootballXtreme
                                            </div>

                                            <div
                                                style="
                                                    color:#9ca3af;
                                                    font-size:13px;
                                                    margin-top:6px;
                                                "
                                            >
                                                Football Pitch Reservation
                                            </div>

                                        </td>
                                    </tr>

                                    <!-- CONTENT -->

                                    <tr>
                                        <td
                                            style="
                                                padding:35px 30px;
                                            "
                                        >

                                            <h1
                                                style="
                                                    margin:0 0 10px;
                                                    font-size:25px;
                                                    color:#111827;
                                                "
                                            >
                                                Резервацията е потвърдена ✅
                                            </h1>

                                            <p
                                                style="
                                                    margin:0 0 25px;
                                                    color:#6b7280;
                                                    font-size:15px;
                                                    line-height:1.6;
                                                "
                                            >
                                                Здравейте,
                                                <strong style="color:#111827;">
                                                    %s
                                                </strong>!
                                                <br>
                                                Вашата резервация във
                                                FootballXtreme е успешно потвърдена.
                                            </p>

                                            <!-- RESERVATION BOX -->

                                            <table
                                                width="100%%"
                                                cellpadding="0"
                                                cellspacing="0"
                                                border="0"
                                                style="
                                                    background:#f8fafc;
                                                    border:1px solid #e5e7eb;
                                                    border-radius:12px;
                                                "
                                            >

                                                <tr>
                                                    <td
                                                        style="
                                                            padding:18px 20px;
                                                        "
                                                    >

                                                        <div
                                                            style="
                                                                color:#6b7280;
                                                                font-size:12px;
                                                                margin-bottom:5px;
                                                            "
                                                        >
                                                            ИГРИЩЕ
                                                        </div>

                                                        <div
                                                            style="
                                                                font-size:17px;
                                                                font-weight:700;
                                                                color:#111827;
                                                            "
                                                        >
                                                            ⚽ %s
                                                        </div>

                                                    </td>
                                                </tr>

                                                <tr>
                                                    <td
                                                        style="
                                                            padding:0 20px 18px;
                                                        "
                                                    >

                                                        <div
                                                            style="
                                                                height:1px;
                                                                background:#e5e7eb;
                                                            "
                                                        ></div>

                                                    </td>
                                                </tr>

                                                <tr>

                                                    <td
                                                        style="
                                                            padding:0 20px 18px;
                                                        "
                                                    >

                                                        <div
                                                            style="
                                                                color:#6b7280;
                                                                font-size:12px;
                                                                margin-bottom:5px;
                                                            "
                                                        >
                                                            ДАТА
                                                        </div>

                                                        <div
                                                            style="
                                                                font-size:17px;
                                                                font-weight:700;
                                                                color:#111827;
                                                            "
                                                        >
                                                            📅 %s
                                                        </div>

                                                    </td>

                                                </tr>

                                                <tr>
                                                    <td
                                                        style="
                                                            padding:0 20px 18px;
                                                        "
                                                    >

                                                        <div
                                                            style="
                                                                color:#6b7280;
                                                                font-size:12px;
                                                                margin-bottom:5px;
                                                            "
                                                        >
                                                            ЧАС
                                                        </div>

                                                        <div
                                                            style="
                                                                font-size:22px;
                                                                font-weight:800;
                                                                color:#111827;
                                                            "
                                                        >
                                                            🕒 %s – %s
                                                        </div>

                                                    </td>
                                                </tr>

                                                <tr>

                                                    <td
                                                        style="
                                                            padding:0 20px 20px;
                                                        "
                                                    >

                                                        <div
                                                            style="
                                                                color:#6b7280;
                                                                font-size:12px;
                                                                margin-bottom:5px;
                                                            "
                                                        >
                                                            ПРОДЪЛЖИТЕЛНОСТ
                                                        </div>

                                                        <div
                                                            style="
                                                                font-size:16px;
                                                                font-weight:700;
                                                                color:#111827;
                                                            "
                                                        >
                                                            ⏱ %d минути
                                                        </div>

                                                    </td>

                                                </tr>

                                            </table>

                                            <!-- MESSAGE -->

                                            <p
                                                style="
                                                    margin:25px 0 0;
                                                    text-align:center;
                                                    color:#6b7280;
                                                    font-size:14px;
                                                    line-height:1.6;
                                                "
                                            >
                                                Благодарим Ви, че избрахте
                                                <strong style="color:#111827;">
                                                    FootballXtreme
                                                </strong>!
                                            </p>

                                        </td>
                                    </tr>

                                    <!-- FOOTER -->

                                    <tr>

                                        <td
                                            style="
                                                background:#f8fafc;
                                                border-top:1px solid #e5e7eb;
                                                padding:20px 30px;
                                                text-align:center;
                                            "
                                        >

                                            <div
                                                style="
                                                    color:#111827;
                                                    font-size:14px;
                                                    font-weight:700;
                                                "
                                            >
                                                ⚽ FootballXtreme
                                            </div>

                                            <div
                                                style="
                                                    color:#9ca3af;
                                                    font-size:12px;
                                                    margin-top:6px;
                                                "
                                            >
                                                Благодарим Ви за доверието.
                                            </div>

                                        </td>

                                    </tr>

                                </table>

                            </td>
                        </tr>

                    </table>

                </body>
                </html>
                """.formatted(
                escapeHtml(customerName),
                escapeHtml(pitchName),
                escapeHtml(reservationDate),
                escapeHtml(formattedStartTime),
                escapeHtml(formattedEndTime),
                reservation.getDurationMinutes()
        );

        try {

            MimeMessage message =
                    mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(
                            message,
                            true,
                            "UTF-8"
                    );

            // Изпращач
            helper.setFrom(
                    "chalakutev@gmail.com"
            );

            // Получател
            helper.setTo(
                    customerEmail
            );

            // Subject
            helper.setSubject(
                    subject
            );

            // Text + HTML
            helper.setText(
                    text,
                    html
            );

            // Изпращане
            mailSender.send(
                    message
            );

        } catch (MessagingException e) {

            throw new RuntimeException(
                    "Unable to create confirmation email.",
                    e
            );
        }
    }

    private String escapeHtml(
            String value
    ) {

        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#039;");
    }
}