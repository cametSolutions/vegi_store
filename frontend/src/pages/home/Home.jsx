import {
  ArrowUpRight,
  BadgeIndianRupee,
  Boxes,
  ChartNoAxesColumnIncreasing,
  CircleCheckBig,
  Clock3,
  Package,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";

const kpis = [
  {
    title: "Today's Sales",
    value: "Rs 1,24,500",
    delta: "+12.4%",
    icon: BadgeIndianRupee,
    iconBg: "from-emerald-500 to-teal-500",
    spark: [40, 48, 44, 64, 69, 75, 82],
  },
  {
    title: "Orders",
    value: "324",
    delta: "+8.1%",
    icon: ShoppingBag,
    iconBg: "from-cyan-500 to-sky-500",
    spark: [18, 24, 28, 22, 31, 37, 42],
  },
  {
    title: "Active Items",
    value: "1,842",
    delta: "+3.2%",
    icon: Boxes,
    iconBg: "from-amber-500 to-orange-500",
    spark: [30, 33, 28, 35, 42, 41, 46],
  },
  {
    title: "Stock Alerts",
    value: "19",
    delta: "-4.5%",
    icon: Package,
    iconBg: "from-rose-500 to-pink-500",
    spark: [31, 28, 26, 23, 21, 22, 19],
  },
];

const weeklySales = [62, 75, 54, 84, 92, 73, 98];

const topProducts = [
  { name: "Fresh Banana", sold: 325, revenue: "Rs 18,200", trend: "+11%" },
  { name: "Premium Rice 5kg", sold: 207, revenue: "Rs 26,100", trend: "+6%" },
  { name: "Coconut Oil 1L", sold: 188, revenue: "Rs 22,900", trend: "+4%" },
  { name: "Tomato", sold: 144, revenue: "Rs 9,400", trend: "-2%" },
];

const activities = [
  { title: "Purchase order #PO-291 approved", time: "8 mins ago" },
  { title: "Stock adjustment completed for Branch A", time: "21 mins ago" },
  { title: "Cash receipt posted from Retail Counter", time: "43 mins ago" },
  { title: "Price level update applied", time: "1 hr ago" },
];

function Home() {
  const maxSales = Math.max(...weeklySales);

  return (
    <div className="relative min-h-full overflow-hidden px-2 py-6 sm:px-2 lg:px-3">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-28 h-80 w-80 rounded-full bg-cyan-300/35 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-amber-200/20 blur-3xl" />

      <section className="relative z-10 overflow-hidden rounded-sm border border-white/70 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-5 text-white shadow-xl shadow-emerald-900/15 sm:p-6">
        <div className="absolute right-4 top-4 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
          Live Preview
        </div>

        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/15 blur-2xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <Sparkles className="h-3.5 w-3.5" />
              Dashboard
            </p>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl lg:text-4xl">
              VegiStore Command Center
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/90 sm:text-base">
              A clean operational snapshot for sales, stock movement, and store
              activity. All values are dummy data for UI preview.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-auto">
            <div className="rounded-2xl border border-white/25 bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-xs text-white/80">Gross Margin</p>
              <p className="text-xl font-semibold">22.8%</p>
            </div>
            <div className="rounded-2xl border border-white/25 bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-xs text-white/80">Customer Growth</p>
              <p className="text-xl font-semibold">+14.2%</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item, index) => (
          <article
            key={item.title}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-slate-100/80 transition group-hover:scale-110" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {item.title}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {item.value}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                  <TrendingUp className="h-4 w-4" />
                  {item.delta}
                </p>
              </div>

              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.iconBg} text-white shadow-md`}
              >
                <item.icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 flex h-10 items-end gap-1">
              {item.spark.map((v, i) => (
                <span
                  key={`${item.title}-${i}`}
                  className={`w-full rounded-sm ${index % 2 === 0 ? "bg-emerald-400/60" : "bg-cyan-400/60"}`}
                  style={{ height: `${v}%` }}
                />
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="relative z-10 mt-5 grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/70 bg-white/75 p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Weekly Sales</h2>
              <p className="text-xs text-slate-500">Last 7 days performance</p>
            </div>
            <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              Detailed Report
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[2.7fr_1.3fr]">
            <div className="flex h-56 items-end gap-3 rounded-xl bg-gradient-to-b from-emerald-50 to-cyan-50 p-4">
              {weeklySales.map((value, index) => (
                <div key={index} className="flex w-full flex-col items-center gap-2">
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-emerald-500 to-cyan-400 transition-all duration-500"
                    style={{ height: `${(value / maxSales) * 100}%` }}
                  />
                  <span className="text-xs text-slate-500">{"SMTWTFS"[index]}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Revenue Mix
              </p>
              <div className="mt-3 flex items-center justify-center">
                <div className="relative h-28 w-28 rounded-full bg-[conic-gradient(#10b981_0%_46%,#06b6d4_46%_78%,#f59e0b_78%_100%)]">
                  <div className="absolute inset-3 rounded-full bg-white" />
                </div>
              </div>
              <div className="mt-4 space-y-1 text-xs text-slate-600">
                <p>Retail: 46%</p>
                <p>Wholesale: 32%</p>
                <p>Online: 22%</p>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/70 bg-white/75 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">System Health</h2>
            <ChartNoAxesColumnIncreasing className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-600">Sync Status</span>
                <div className="inline-flex items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Healthy
                  </span>
                  <span className="font-semibold text-emerald-700">98%</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-full w-[98%] rounded-full bg-emerald-500" />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-600">Invoice Queue</span>
                <div className="inline-flex items-center gap-2">
                  <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-semibold text-cyan-700">
                    Stable
                  </span>
                  <span className="font-semibold text-cyan-700">72%</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-full w-[72%] rounded-full bg-cyan-500" />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-600">Backup Readiness</span>
                <div className="inline-flex items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    Watch
                  </span>
                  <span className="font-semibold text-amber-700">85%</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-full w-[85%] rounded-full bg-amber-500" />
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
            <p className="flex items-center gap-2 font-medium">
              <CircleCheckBig className="h-4 w-4" />
              All core services are running normally.
            </p>
          </div>
        </article>
      </section>

      <section className="relative z-10 mt-5 grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/70 bg-white/75 p-5 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Top Products</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 font-medium">Product</th>
                  <th className="py-2 font-medium">Units Sold</th>
                  <th className="py-2 font-medium">Revenue</th>
                  <th className="py-2 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr
                    key={product.name}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="py-3 font-medium text-slate-700">{product.name}</td>
                    <td className="py-3 text-slate-600">{product.sold}</td>
                    <td className="py-3 font-semibold text-slate-900">
                      {product.revenue}
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          product.trend.startsWith("+")
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {product.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/70 bg-white/75 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          <ul className="mt-4 space-y-3">
            {activities.map((activity) => (
              <li key={activity.title} className="rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-700">{activity.title}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {activity.time}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-100">
              Add Product
            </button>
            <button className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
              Create Invoice
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">Manager on Duty</p>
            <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              <UserRound className="h-4 w-4" />
              Arun Rajan
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}

export default Home;
