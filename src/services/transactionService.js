const supabase = require("../config/supabase");
const activityService = require("./activityService");

// create a new transaction and update savings balance
exports.createTransaction = async (userId, { type, amount, description }) => {
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
  const { data: savings } = await supabase
    .from("savings")
    .select("total_balance")
    .eq("user_id", userId)
    .single();

  let newBalance = savings ? savings.total_balance : 0;

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
    userId,
    action,
    entityType: "transaction",
    entityId: transaction.id,
    description: logDescription,
  });

  return transaction;
};

// get transactions by role
exports.getTransactions = async (userId, role) => {
  if (role === "KID") {
    const { data } = await supabase
      .from("transactions")
      .select("id, type, amount, description, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return data;
  }

  if (role === "PARENT") {
    const { data: kid } = await supabase
      .from("users")
      .select("id")
      .eq("parent_id", userId)
      .single();

    const { data } = await supabase
      .from("transactions")
      .select("id, type, amount, description, created_at")
      .eq("user_id", kid.id)
      .order("created_at", { ascending: false });

    return data;
  }
};
