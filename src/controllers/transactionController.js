const supabase = require("../config/supabase");
const activityService = require("../services/activityService");

exports.createTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role !== "KID") {
      return res.status(403).json({
        message: "Only kid can create transaction",
      });
    }

    const { type, amount, description } = req.body;

    // insert transaction
    const { data: transaction, error } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: userId,
          type,
          amount,
          description,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // get current savings
    const { data: savings, error: savingsError } = await supabase
      .from("savings")
      .select("*")
      .eq("user_id", userId)
      .single();

    let newBalance = 0;

    if (savings) {
      newBalance = savings.total_balance;
    }

    if (type === "INCOME") {
      newBalance += amount;
    }

    if (type === "EXPENSE") {
      newBalance -= amount;
    }

    // update or create savings
    if (savings) {
      await supabase
        .from("savings")
        .update({ total_balance: newBalance })
        .eq("user_id", userId);
    } else {
      await supabase
        .from("savings")
        .insert([{ user_id: userId, total_balance: newBalance }]);
    }

    // activity log
    const action = type === "INCOME" ? "CREATE_INCOME" : "CREATE_EXPENSE";
    const logDescription =
      type === "INCOME"
        ? `Income with amount ${amount}`
        : `Expense with amount ${amount}`;

    await activityService.createLog({
      userId: userId,
      action,
      entityType: "transaction",
      entityId: transaction.id,
      description: logDescription,
    })

    res.json({
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === "KID") {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      return res.json(data);
    }

    if (role === "PARENT") {
      const { data: kids } = await supabase
        .from("users")
        .select("id")
        .eq("parent_id", userId);

      const kidIds = kids.map((k) => k.id);

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .in("user_id", kidIds)
        .order("created_at", { ascending: false });

      return res.json(data);
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
