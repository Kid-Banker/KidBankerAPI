const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");
const { verifyGoogleToken } = require("../services/googleAuthService");
const activityService = require("../services/activityService");

// auth controller
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    const googleUser = await verifyGoogleToken(idToken);
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("google_id", googleUser.google_id)
      .single();

    if (user) {
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "3d" },
      );

      // activity log
      await activityService.createLog({
        userId: user.id,
        action: "LOGIN",
        entityType: "user",
        entityId: user.id,
        description: `${user.name} logged in`,
      });

      return res.json({
        token,
        user,
      });
    }

    return res.json({
      status: "Register Required",
      user: googleUser,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// register controller
exports.register = async (req, res) => {
  try {
    const { name, email, google_id, role } = req.body;

    let parent_code = null;

    if (role === "PARENT") {
      parent_code = Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    const { data: user, error } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          google_id,
          role,
          parent_code,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "3d" },
    );

    // activity log
    await activityService.createLog({
      userId: user.id,
      action: "REGISTER",
      entityType: "user",
      entityId: user.id,
      description: `${user.name} registered`,
    });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// linking parent_code controller
exports.linkParent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { parent_code } = req.body;

    const { data: parent } = await supabase
      .from("users")
      .select("id")
      .eq("parent_code", parent_code)
      .single();

    if (!parent) {
      return res.status(400).json({ message: "Invalid parent code" });
    }

    await supabase
      .from("users")
      .update({
        parent_id: parent.id,
      })
      .eq("id", userId);

    // activity log
    await activityService.createLog({
      userId: userId,
      action: "LINK_PARENT",
      entityType: "user",
      entityId: parent.id,
      description: `${req.user.name} linked parent`,
    });

    res.json({ message: "Parent linked successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
