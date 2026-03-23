const app = require("../app");
const supabase = require("../config/supabase");
const activityService = require("../services/activityService");
const googleCalendar = require("../services/googleCalendarService");

// create request paylater controller
exports.requestPaylater = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role !== "KID") {
      return res.status(403).json({
        message: "Only kid can request paylater",
      });
    }

    const { name, amount, deadline } = req.body;

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
      userId: userId,
      action: "REQUEST_PAYLATER",
      entityType: "paylater",
      entityId: data.id,
      description: "Kid requested paylater",
    });

    res.json({
      message: "Paylater request created",
      data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// get list of requests paylater controller
exports.getRequests = async (req, res) => {
  try {
    const parentId = req.user.id;
    const role = req.user.role;

    if (role !== "PARENT") {
      return res.status(403).json({
        message: "Only parent can see paylater requests",
      });
    }

    const { data: kids } = await supabase
      .from("users")
      .select("id")
      .eq("parent_id", parentId);

    const kidIds = kids.map((k) => k.id);

    const { data } = await supabase
      .from("paylater")
      .select("*")
      .in("user_id", kidIds)
      .order("created_at", { ascending: false });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// approve paylater request controller
exports.approvePaylater = async (req, res) => {
  try {
    const parentId = req.user.id;
    const role = req.user.role;
    const paylaterId = req.params.id;

    if (role !== "PARENT") {
      return res.status(403).json({
        message: "Only parent can approve paylater",
      });
    }

    const { data: existing } = await supabase
      .from("paylater")
      .select("*")
      .eq("id", paylaterId)
      .single();

    if (!existing) {
      return res.status(404).json({
        message: "Paylater request not found",
      });
    }

    if (existing.status === "APPROVED") {
      return res.status(400).json({
        message: "Paylater request already approved",
      });
    }

    if (existing.calendar_event_id) {
      return res.status(400).json({
        message: "Paylater request already added to Google Calendar",
      });
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
    let parentEventId = null;

    // create event for kid
    if (kid.google_refresh_token) {
      kidEventId = await googleCalendar.createEvent({
        accessToken: kid.google_access_token,
        refreshToken: kid.google_refresh_token,
        summary: `Paylater: ${existing.name}`,
        description: `Amount ${existing.amount}`,
        date: existing.deadline,
      });
    }

    // create event for parent
    if (parent.google_refresh_token) {
      parentEventId = await googleCalendar.createEvent({
        accessToken: parent.google_access_token,
        refreshToken: parent.google_refresh_token,
        summary: `Kid Request: ${existing.name}`,
        description: `Amount: ${existing.amount}`,
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

    res.json({
      message: "Paylater request approved & added to Google Calendar",
      data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// reject paylater request controller
exports.rejectPaylater = async (req, res) => {
  try {
    const parentId = req.user.id;
    const role = req.user.role;
    const paylaterId = req.params.id;

    if (role !== "PARENT") {
      return res.status(403).json({
        message: "Only parent can reject paylater",
      });
    }

    const { data: existing } = await supabase
      .from("paylater")
      .select("*")
      .eq("id", paylaterId)
      .single();

    if (!existing) {
      return res.status(404).json({
        message: "Paylater request not found",
      });
    }

    if (existing.status === "REJECTED") {
      return res.status(400).json({
        message: "Paylater request already rejected",
      });
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

    res.json({
      message: "Paylater request rejected",
      data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
