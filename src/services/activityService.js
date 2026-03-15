const supabase = require("../config/supabase");

exports.createLog = async (userId, action, description) => {
  await supabase.from("activity_logs").insert([
    {
      user_id: userId,
      action,
      description,
    },
  ]);
};
