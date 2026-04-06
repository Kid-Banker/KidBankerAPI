const supabase = require("../config/supabase");

// get savings by role
exports.getSavings = async (userId, role) => {
  if (role === "KID") {
    const { data, error } = await supabase
      .from("savings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) throw error;

    return data;
  }

  if (role === "PARENT") {
    const { data: kid } = await supabase
      .from("users")
      .select("id")
      .eq("parent_id", userId)
      .single();

    const { data } = await supabase
      .from("savings")
      .select("*")
      .eq("user_id", kid.id)
      .single();

    return data;
  }
};
