const supabase = require("../config/supabase");

exports.getSavings = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === "KID") {
      const { data, error } = await supabase
        .from("savings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      return res.json(data);
    }

    if (role === "PARENT") {
      const { data: kids } = await supabase
        .from("users")
        .select("id")
        .eq("parent_id", userId);

      const kidIds = kids.map((k) => k.id);

      const { data } = await supabase
        .from("savings")
        .select("*")
        .in("user_id", kidIds);

      return res.json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
