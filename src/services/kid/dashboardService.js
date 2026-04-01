const supabase = require("../../config/supabase");

// date/week/month helpers
const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day; // Sunday (0) should go back 6 days

  // get Monday of the current week
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  // get Sunday of the current week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
};

const getLastWeekRange = () => {
  const { monday } = getWeekRange();

  // get Monday and Sunday of the last week
  const lastMonday = new Date(monday);
  lastMonday.setDate(lastMonday.getDate() - 7);

  // last Sunday is the day before this Monday
  const lastSunday = new Date(monday);
  lastSunday.setMilliseconds(-1);

  return { lastMonday, lastSunday };
};

const getMonthRange = () => {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// get profile info
exports.getProfileInfo = async (userId) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;

  let parentName = null;

  if (user.parent_id) {
    const { data: parent } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.parent_id)
      .single();

    parentName = parent?.name || null;
  }

  return {
    name: user.name,
    parent_name: parentName,
    parent_code: user.parent_code || "-",
  };
};

// get my savings
exports.getMySavings = async (userId) => {
  const { data: savings } = await supabase
    .from("savings")
    .select("*")
    .eq("user_id", userId)
    .single();

  const total_balance = savings?.total_balance || 0;

  const { data: lastEarned } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "INCOME")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: lastSpent } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "EXPENSE")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return {
    total_balance,
    last_income: lastEarned?.amount || 0,
    last_expense: lastSpent?.amount || 0,
  };
};

// get weekly income
exports.getWeeklyIncome = async (userId) => {
  const { monday, sunday } = getWeekRange();
  const { lastMonday, lastSunday } = getLastWeekRange();

  const { data: thisWeekIncome } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "INCOME")
    .gte("created_at", monday.toISOString())
    .lte("created_at", sunday.toISOString());

  const { data: lastWeekIncome } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "INCOME")
    .gte("created_at", lastMonday.toISOString())
    .lte("created_at", lastSunday.toISOString());

  // helper to sum amounts in an array of transactions
  const sum = (arr) => arr?.reduce((acc, cur) => acc + cur.amount, 0) || 0;

  const thisWeekIncomeTotal = sum(thisWeekIncome);
  const lastWeekIncomeTotal = sum(lastWeekIncome);
  const incomeCount = thisWeekIncome?.length || 0;

  let status = "SAME";
  let difference = 0;

  if (thisWeekIncomeTotal > lastWeekIncomeTotal) {
    status = "UP";
    difference = thisWeekIncomeTotal - lastWeekIncomeTotal;
  } else if (thisWeekIncomeTotal < lastWeekIncomeTotal) {
    status = "DOWN";
    difference = lastWeekIncomeTotal - thisWeekIncomeTotal;
  }

  return {
    this_week: thisWeekIncomeTotal,
    last_week: lastWeekIncomeTotal,
    income_count: incomeCount,
    difference,
    status,
  };
};

// get weekly expense
exports.getWeeklyExpense = async (userId) => {
  const { monday, sunday } = getWeekRange();
  const { lastMonday, lastSunday } = getLastWeekRange();

  const { data: thisWeekExpense } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "EXPENSE")
    .gte("created_at", monday.toISOString())
    .lte("created_at", sunday.toISOString());

  const { data: lastWeekExpense } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "EXPENSE")
    .gte("created_at", lastMonday.toISOString())
    .lte("created_at", lastSunday.toISOString());

  // helper to sum amounts in an array of transactions
  const sum = (arr) => arr?.reduce((acc, cur) => acc + cur.amount, 0) || 0;

  const thisWeekExpenseTotal = sum(thisWeekExpense);
  const lastWeekExpenseTotal = sum(lastWeekExpense);
  const expenseCount = thisWeekExpense?.length || 0;

  let status = "SAME";
  let difference = 0;

  if (thisWeekExpenseTotal > lastWeekExpenseTotal) {
    status = "UP";
    difference = thisWeekExpenseTotal - lastWeekExpenseTotal;
  } else if (thisWeekExpenseTotal < lastWeekExpenseTotal) {
    status = "DOWN";
    difference = lastWeekExpenseTotal - thisWeekExpenseTotal;
  }

  return {
    this_week: thisWeekExpenseTotal,
    last_week: lastWeekExpenseTotal,
    expense_count: expenseCount,
    difference,
    status,
  };
};

// get weekly report
exports.getWeeklyReport = async (userId) => {
  const { monday, sunday } = getWeekRange();
  const { lastMonday, lastSunday } = getLastWeekRange();

  const { data: thisWeek } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "INCOME")
    .gte("created_at", monday.toISOString()) // created_at >= Monday 00:00:00
    .lte("created_at", sunday.toISOString()); // created_at <= Sunday 23:59:59

  const { data: lastWeek } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "INCOME")
    .gte("created_at", lastMonday.toISOString())
    .lte("created_at", lastSunday.toISOString());

  // helper to sum amounts in an array of transactions
  const sum = (arr) => arr?.reduce((acc, cur) => acc + cur.amount, 0) || 0;

  const thisWeekTotal = sum(thisWeek);
  const lastWeekTotal = sum(lastWeek);
  const incomeWeekCount = thisWeek?.length || 0;

  let status = "SAME";
  let difference = 0;

  if (thisWeekTotal > lastWeekTotal) {
    status = "UP";
    difference = thisWeekTotal - lastWeekTotal;
  } else if (thisWeekTotal < lastWeekTotal) {
    status = "DOWN";
    difference = lastWeekTotal - thisWeekTotal;
  }

  return {
    this_week: thisWeekTotal,
    income_count: incomeWeekCount,
    difference,
    status,
  };
};

// get weekly transactions
exports.getWeeklyTransactions = async (userId) => {
  const { monday, sunday } = getWeekRange();

  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", monday.toISOString())
    .lte("created_at", sunday.toISOString());

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const result = days.map((day, index) => ({
    day,
    income: 0,
    expense: 0,
  }));

  // loop through transactions and add them to the result
  data?.forEach((trx) => {
    const d = new Date(trx.created_at);
    let dayIndex = d.getDay() - 1;
    if (dayIndex === -1) dayIndex = 6;

    if (trx.type === "INCOME") {
      result[dayIndex].income += trx.amount;
    } else {
      result[dayIndex].expense += trx.amount;
    }
  });

  return result;
};

// get monthly overview
exports.getMonthlyOverview = async (userId) => {
  const { start, end } = getMonthRange();

  const { data } = await supabase
    .from("transactions")
    .select("type")
    .eq("user_id", userId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  let incomeCount = 0;
  let expenseCount = 0;

  data?.forEach((trx) => {
    if (trx.type === "INCOME") {
      incomeCount++;
    } else if (trx.type === "EXPENSE") {
      expenseCount++;
    }
  });

  // format month response
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "short" }).toLowerCase(); // jan, feb, mar

  return {
    month,
    income_count: incomeCount,
    expense_count: expenseCount,
  };
};

// get last 5 transactions
exports.getLastTransactions = async (userId) => {
  const { data } = await supabase
    .from("transactions")
    .select("description, type")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  return data || [];
};

// get paylater data overview
exports.getPaylaterOverview = async (userId) => {
  const { data } = await supabase
    .from("paylater")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    data?.map((p) => ({
      name: p.name,
      amount: p.amount,
      deadline: p.deadline,
      status: p.status,
      is_overdue: new Date(p.deadline) < new Date(),
    })) || []
  );
};

// get reminder paylater
exports.getPaylaterReminder = async (userId) => {
  const { data } = await supabase
    .from("paylater")
    .select("amount, deadline")
    .eq("user_id", userId)
    .eq("status", "APPROVED")
    .order("deadline", { ascending: true })
    .limit(1)
    .gte("deadline", new Date().toISOString()); // only get future deadlines

  if (!data || data.length === 0) {
    return null;
  }

  const p = data[0]; // the closest upcoming paylater

  return {
    amount: p.amount,
    deadline: p.deadline,
    is_overdue: new Date(p.deadline) < new Date(),
  };
};
