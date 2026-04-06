const supabase = require("../config/supabase");
const activityService = require("./activityService");
const googleCalendar = require("./googleCalendarService");

// request paylater
exports.requestPaylater = async (userId, { name, amount, deadline }) => {
  const { data, error } = await supabase
    .from("paylater")
    .insert([
      {
        user_id: userId,
        name,
        amount,
        deadline,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // activity log
  await activityService.createLog({
    userId,
    action: "REQUEST_PAYLATER",
    entityType: "paylater",
    entityId: data.id,
    description: "Kid requested paylater",
  });

  return data;
};

// get list of paylater requests for a parent
exports.getRequests = async (parentId) => {
  const { data: kid } = await supabase
    .from("users")
    .select("id")
    .eq("parent_id", parentId)
    .single();

  const { data } = await supabase
    .from("paylater")
    .select("*")
    .eq("user_id", kid.id)
    .order("created_at", { ascending: false });

  return data;
};

// approve paylater request
exports.approvePaylater = async (parentId, paylaterId) => {
  const { data: existing } = await supabase
    .from("paylater")
    .select("*")
    .eq("id", paylaterId)
    .single();

  if (!existing) {
    const err = new Error("Paylater request not found");
    err.statusCode = 404;
    throw err;
  }

  if (existing.status === "APPROVED") {
    const err = new Error("Paylater request already approved");
    err.statusCode = 400;
    throw err;
  }

  if (existing.status === "REJECTED") {
    const err = new Error("Cannot approve a rejected paylater request");
    err.statusCode = 400;
    throw err;
  }

  if (existing.calendar_event_id) {
    const err = new Error("Paylater request already added to Google Calendar");
    err.statusCode = 400;
    throw err;
  }

  const { data: kid } = await supabase
    .from("users")
    .select("*")
    .eq("id", existing.user_id)
    .single();

  const { data: parent } = await supabase
    .from("users")
    .select("*")
    .eq("id", parentId)
    .single();

  let kidEventId = null;

  const motivationalQuotes = [
    "Save today, enjoy the rewards tomorrow! 🌟",
    "Every penny you manage wisely is an investment in your future! 💰",
    "Learning to manage money early is your superpower! 🦸",
    "Great things start with small steps — like this one! 🚀",
    "You're awesome for being so responsible with your money! ⭐",
  ];
  const randomQuote =
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  // create event for kid
  if (kid.google_refresh_token) {
    const kidSummary = `🔔 Paylater Reminder: ${existing.name}`;
    const kidDescription = [
      `🏦 KID BANKER — PAYLATER REMINDER`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `Hey ${kid.name}! 👋`,
      `Just a friendly reminder — your paylater is coming up!`,
      ``,
      `📋 Paylater Details:`,
      `   • Name     : ${existing.name}`,
      `   • Amount   : ${existing.amount}`,
      `   • Due Date : ${existing.deadline}`,
      `   • Status   : Approved`,
      ``,
      `📌 Approved by: ${parent.name}`,
      ``,
      `💡 "${randomQuote}"`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Powered by Kid Banker 🏦`,
    ].join("\n");

    kidEventId = await googleCalendar.createEvent({
      refreshToken: kid.google_refresh_token,
      summary: kidSummary,
      description: kidDescription,
      date: existing.deadline,
    });
  }

  // create event for parent
  if (parent.google_refresh_token) {
    const parentSummary = `🔔 Kid's Paylater: ${existing.name} — ${existing.amount}`;
    const parentDescription = [
      `🏦 KID BANKER — PAYLATER NOTIFICATION`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `Hi ${parent.name}! 👋`,
      `This is a reminder for a paylater you approved.`,
      `The due date is coming up soon — here are the details:`,
      ``,
      `📋 Paylater Details:`,
      `   • Name     : ${existing.name}`,
      `   • Amount   : ${existing.amount}`,
      `   • Due Date : ${existing.deadline}`,
      `   • Status   : Approved`,
      ``,
      `📌 Requested by: ${kid.name}`,
      ``,
      `📊 Tip: Keep track of your kid financial`,
      `   activities with Kid Banker!`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Powered by Kid Banker 🏦`,
    ].join("\n");

    await googleCalendar.createEvent({
      refreshToken: parent.google_refresh_token,
      summary: parentSummary,
      description: parentDescription,
      date: existing.deadline,
    });
  }

  const { data, error } = await supabase
    .from("paylater")
    .update({
      status: "APPROVED",
      approved_by: parentId,
      approved_at: new Date(),
      calendar_event_id: kidEventId,
    })
    .eq("id", paylaterId)
    .select()
    .single();

  if (error) throw error;

  // activity log
  await activityService.createLog({
    userId: parentId,
    action: "APPROVE_PAYLATER",
    entityType: "paylater",
    entityId: paylaterId,
    description: "Parent approved paylater",
  });

  return data;
};

// reject paylater request
exports.rejectPaylater = async (parentId, paylaterId) => {
  const { data: existing } = await supabase
    .from("paylater")
    .select("*")
    .eq("id", paylaterId)
    .single();

  if (!existing) {
    const err = new Error("Paylater request not found");
    err.statusCode = 404;
    throw err;
  }

  if (existing.status === "REJECTED") {
    const err = new Error("Paylater request already rejected");
    err.statusCode = 400;
    throw err;
  }

  if (existing.status === "APPROVED") {
    const err = new Error("Cannot reject an approved paylater request");
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from("paylater")
    .update({
      status: "REJECTED",
      approved_by: parentId,
      approved_at: new Date(),
    })
    .eq("id", paylaterId)
    .select()
    .single();

  if (error) throw error;

  // activity log
  await activityService.createLog({
    userId: parentId,
    action: "REJECT_PAYLATER",
    entityType: "paylater",
    entityId: paylaterId,
    description: "Parent rejected paylater",
  });

  return data;
};
