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
exports.getProfileInfo = async (parentId) => {
  const { data: parent } = await supabase
    .from("users")
    .select("id, name, parent_code")
    .eq("id", parentId)
    .single();

  const { data: kid } = await supabase
    .from("users")
    .select("id, name")
    .eq("parent_id", parentId)
    .single();

  return {
    name: parent.name,
    kid_name: kid?.name || "-",
    parent_code: parent.parent_code,
  };
};

// get kid savings
exports.getKidSavings = async (parentId) => {
  const { data: kid } = await supabase
    .from("users")
    .select("id")
    .eq("parent_id", parentId)
    .single();

  if (!kid) throw new Error("Kid not found");

  const kidId = kid.id;

  const { data: savings } = await supabase
    .from("savings")
    .select("total_balance")
    .eq("user_id", kidId)
    .single();

  const { data: lastEarned } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", kidId)
    .eq("type", "INCOME")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: lastSpent } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", kidId)
    .eq("type", "EXPENSE")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return {
    total_balance: savings?.total_balance || 0,
    last_earned: lastEarned?.amount || 0,
    last_spent: lastSpent?.amount || 0,
  };
};

// get weekly report
exports.getWeeklyReport = async (parentId) => {
  const { monday, sunday } = getWeekRange();
  const { lastMonday, lastSunday } = getLastWeekRange();

  const { data: kid } = await supabase
    .from("users")
    .select("id")
    .eq("parent_id", parentId)
    .single();

  const kidId = kid?.id;

  const { data: thisWeekIncome } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", kidId)
    .eq("type", "INCOME")
    .gte("created_at", monday.toISOString())
    .lte("created_at", sunday.toISOString());

  const { data: lastWeekIncome } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", kidId)
    .eq("type", "INCOME")
    .gte("created_at", lastMonday.toISOString())
    .lte("created_at", lastSunday.toISOString());

  // helper to sum amounts in an array of transactions
  const sum = (arr) => arr?.reduce((acc, cur) => acc + cur.amount, 0) || 0;

  const thisWeekIncomeTotal = sum(thisWeekIncome);
  const lastWeekIncomeTotal = sum(lastWeekIncome);
  const thisWeekincomeCount = thisWeekIncome?.length || 0;

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
    income_count: thisWeekincomeCount,
    difference,
    status,
  };
};

// get monthly report
exports.getMonthlyReport = async (parentId) => {
  const { start, end } = getMonthRange();

  const lastStart = new Date(start);
  lastStart.setMonth(start.getMonth() - 1);

  const lastEnd = new Date(end);
  lastEnd.setMonth(end.getMonth() - 1);

  const { data: kid } = await supabase
    .from("users")
    .select("id")
    .eq("parent_id", parentId)
    .single();

  const kidId = kid?.id;

  const { data: thisMonthIncome } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", kidId)
    .eq("type", "INCOME")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  const { data: lastMonthIncome } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", kidId)
    .eq("type", "INCOME")
    .gte("created_at", lastStart.toISOString())
    .lte("created_at", lastEnd.toISOString());

  // helper to sum amounts in an array of transactions
  const sum = (arr) => arr?.reduce((acc, cur) => acc + cur.amount, 0) || 0;

  const thisMonthIncomeTotal = sum(thisMonthIncome);
  const lastMonthIncomeTotal = sum(lastMonthIncome);
  const thisMonthincomeCount = thisMonthIncome?.length || 0;

  let status = "SAME";
  let difference = 0;

  if (thisMonthIncomeTotal > lastMonthIncomeTotal) {
    status = "UP";
    difference = thisMonthIncomeTotal - lastMonthIncomeTotal;
  } else if (thisMonthIncomeTotal < lastMonthIncomeTotal) {
    status = "DOWN";
    difference = lastMonthIncomeTotal - thisMonthIncomeTotal;
  }

  return {
    this_month: thisMonthIncomeTotal,
    income_count: thisMonthincomeCount,
    difference,
    status,
  };
};

// get weekly transactions
exports.getWeeklyTransactions = async (parentId) => {
  const { monday, sunday } = getWeekRange();

  const { data: kid } = await supabase
    .from("users")
    .select("id")
    .eq("parent_id", parentId)
    .single();

  const kidId = kid?.id;

  const { data } = await supabase
    .from("transactions")
    .select("created_at, type, amount")
    .eq("user_id", kidId)
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
exports.getMonthlyOverview = async (parentId) => {
  const { start, end } = getMonthRange();

  const { data: kid } = await supabase
    .from("users")
    .select("id")
    .eq("parent_id", parentId)
    .single();

  const kidId = kid?.id;

  const { data } = await supabase
    .from("transactions")
    .select("type")
    .eq("user_id", kidId)
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

// get all transactions with pagionation
exports.getTransactions = async (parentId, page = 1, limit = 10) => {
  const parsedPage = parseInt(page, 10) || 1;
  const parsedLimit = parseInt(limit, 10) || 10;

  const from = (parsedPage - 1) * parsedLimit;
  const to = from + parsedLimit - 1;

  const { data: kid } = await supabase
    .from("users")
    .select("id")
    .eq("parent_id", parentId)
    .single();

  const kidId = kid?.id;

  const { data, count } = await supabase
    .from("transactions")
    .select("description, type, amount, created_at", { count: "exact" })
    .eq("user_id", kidId)
    .order("created_at", { ascending: false })
    .range(from, to);

  return {
    data,
    pagination: {
      total: count,
      per_page: parsedLimit,
      current_page: parsedPage,
      last_page: Math.ceil(count / parsedLimit),
      has_next_page: parsedPage * parsedLimit < count,
      has_prev_page: parsedPage > 1,
    },
  };
};

// get last 5 transactions
exports.getLastTransactions = async (parentId) => {
  const { data: kid } = await supabase
    .from("users")
    .select("id")
    .eq("parent_id", parentId)
    .single();

  const kidId = kid?.id;

  const { data } = await supabase
    .from("transactions")
    .select("description, type")
    .eq("user_id", kidId)
    .order("created_at", { ascending: false })
    .limit(5);

  return data || [];
};

// get pending paylater
exports.getPendingPaylater = async (parentId) => {
  const { data: kid } = await supabase
    .from("users")
    .select("id")
    .eq("parent_id", parentId)
    .single();

  const kidId = kid?.id;

  const { data } = await supabase
    .from("paylater")
    .select("name, status, created_at")
    .eq("user_id", kidId)
    .eq("status", "PENDING")
    .order("created_at", { ascending: false })
    .limit(5);

  return data || [];
};

// get paylater data overview
exports.getPaylaterOverview = async (parentId) => {
  const { data: kid } = await supabase
    .from("users")
    .select("id")
    .eq("parent_id", parentId)
    .single();

  const kidId = kid?.id;

  const { data } = await supabase
    .from("paylater")
    .select("id, name, amount, status, deadline, approved_at")
    .eq("user_id", kidId)
    .order("created_at", { ascending: false });

  return data || [];
};

// get paylater status
exports.getPaylaterStatus = async (parentId) => {
  const { data: kid } = await supabase
    .from("users")
    .select("id")
    .eq("parent_id", parentId)
    .single();

  const kidId = kid?.id;

  const { data } = await supabase
    .from("paylater")
    .select("status")
    .eq("user_id", kidId);

  let approvedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;

  data?.forEach((p) => {
    if (p.status === "APPROVED") {
      approvedCount++;
    } else if (p.status === "PENDING") {
      pendingCount++;
    } else if (p.status === "REJECTED") {
      rejectedCount++;
    }
  });

  return {
    approved_count: approvedCount,
    pending_count: pendingCount,
    rejected_count: rejectedCount,
  };
};

// paylater reminder
exports.getPaylaterReminder = async (parentId) => {
  const { data: kid } = await supabase
    .from("users")
    .select("id")
    .eq("parent_id", parentId)
    .single();

  const kidId = kid?.id;

  const now = new Date().toISOString();

  const { data } = await supabase
    .from("paylater")
    .select("amount, deadline")
    .eq("user_id", kidId)
    .eq("status", "APPROVED")
    .gte("deadline", now)
    .order("deadline", { ascending: true })
    .limit(1);

  if (!data || data.length === 0) {
    return null; // no upcoming paylater
  }

  const closest = data[0];

  // count upcoming paylater
  const { count } = await supabase
    .from("paylater")
    .select("*", { count: "exact", head: true })
    .eq("user_id", kidId)
    .eq("status", "APPROVED")
    .gte("deadline", now);

  return {
    amount: closest.amount,
    deadline: closest.deadline,
    is_overdue: new Date(closest.deadline) < new Date(),
    total_upcoming: count > 0 ? count - 1 : 0,
  };
};
