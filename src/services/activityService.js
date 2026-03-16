const supabase = require("../config/supabase");

exports.createLog = async ({
  userId,
  action,
  entityType = null,
  entityId = null,
  description = null,
}) => {
  const { error } = await supabase.from("activity_logs").insert([
    {
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
    },
  ]);

  if (error) {
    console.error("Activity Log Error:", error.message);
  }
};
