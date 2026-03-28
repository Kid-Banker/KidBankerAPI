const { google } = require("googleapis");

exports.createEvent = async ({
  refreshToken,
  summary,
  description,
  date,
}) => {
  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    auth.setCredentials({
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth });

    const event = {
      summary,
      description,
      start: {
        date: date,
      },
      end: {
        date: date,
      },
      reminders: {
        useDefault: false,
        overrides: [
          {
            method: "popup",
            minutes: 1440, // H-1 day
          },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    return response.data.id;
  } catch (error) {
    console.error("Google Calendar Error:", error.message);
    throw error;
  }
};