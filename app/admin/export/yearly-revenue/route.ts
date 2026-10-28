import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInLagos } from "@/lib/availability";
import { YearlyRevenueDocument, type RevenueRow } from "@/lib/pdf/YearlyRevenueDocument";

const REVENUE_STATUSES = ["confirmed", "completed"];
const PAID_STATUSES = ["deposit_paid", "confirmed", "completed"];

function csvCell(value: string | number) {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function toCsvRow(cells: (string | number)[]) {
  return cells.map(csvCell).join(",");
}

async function loadYearRows(year: number) {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const supabase = createAdminClient();
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "booking_ref, booking_date, start_time, subtotal_ngn, deposit_ngn, balance_ngn, status, client_id, service_id, service_price_id",
    )
    .gte("booking_date", yearStart)
    .lte("booking_date", yearEnd)
    .order("booking_date");

  if (error) {
    throw new Error("Failed to load bookings");
  }

  const clientIds = Array.from(new Set((bookings ?? []).map((b) => b.client_id)));
  const serviceIds = Array.from(new Set((bookings ?? []).map((b) => b.service_id)));
  const priceIds = Array.from(
    new Set((bookings ?? []).map((b) => b.service_price_id).filter(Boolean)),
  ) as string[];

  const [{ data: clients }, { data: services }, { data: prices }] = await Promise.all([
    clientIds.length
      ? supabase.from("clients").select("id, name, phone").in("id", clientIds)
      : Promise.resolve({ data: [] as { id: string; name: string; phone: string }[] }),
    serviceIds.length
      ? supabase.from("services").select("id, name").in("id", serviceIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    priceIds.length
      ? supabase.from("service_prices").select("id, length_label").in("id", priceIds)
      : Promise.resolve({ data: [] as { id: string; length_label: string }[] }),
  ]);

  const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));
  const serviceMap = new Map((services ?? []).map((s) => [s.id, s.name]));
  const priceMap = new Map((prices ?? []).map((p) => [p.id, p.length_label]));

  const rows = (bookings ?? []).map((b) => {
    const client = clientMap.get(b.client_id);
    return {
      bookingDate: b.booking_date,
      startTime: b.start_time.slice(0, 5),
      bookingRef: b.booking_ref,
      clientName: client?.name ?? "—",
      clientPhone: client?.phone ?? "",
      serviceName: serviceMap.get(b.service_id) ?? "—",
      lengthLabel: b.service_price_id ? (priceMap.get(b.service_price_id) ?? "") : "",
      subtotalNgn: b.subtotal_ngn,
      depositNgn: b.deposit_ngn,
      balanceNgn: b.balance_ngn,
      status: b.status,
    };
  });

  const totalRevenue = rows
    .filter((r) => REVENUE_STATUSES.includes(r.status))
    .reduce((sum, r) => sum + r.subtotalNgn, 0);
  const totalDeposits = rows
    .filter((r) => PAID_STATUSES.includes(r.status))
    .reduce((sum, r) => sum + r.depositNgn, 0);
  const totalOutstanding = rows
    .filter((r) => !["cancelled", "no_show"].includes(r.status))
    .reduce((sum, r) => sum + r.balanceNgn, 0);

  return { rows, totalRevenue, totalDeposits, totalOutstanding };
}

function buildCsv(year: number, rows: Awaited<ReturnType<typeof loadYearRows>>["rows"], totalRevenue: number, totalDeposits: number) {
  const header = [
    "Date",
    "Time",
    "Booking Ref",
    "Client",
    "Phone",
    "Service",
    "Length",
    "Subtotal (NGN)",
    "Deposit (NGN)",
    "Balance (NGN)",
    "Status",
  ];

  const csvRows = rows.map((r) =>
    toCsvRow([
      r.bookingDate,
      r.startTime,
      r.bookingRef,
      r.clientName,
      r.clientPhone,
      r.serviceName,
      r.lengthLabel,
      r.subtotalNgn,
      r.depositNgn,
      r.balanceNgn,
      r.status,
    ]),
  );

  const lines = [
    toCsvRow(header),
    ...csvRows,
    "",
    toCsvRow(["Total appointments", rows.length]),
    toCsvRow(["Total revenue (confirmed/completed)", totalRevenue]),
    toCsvRow(["Total deposits received", totalDeposits]),
  ];

  return lines.join("\r\n");
}

export async function GET(request: NextRequest) {
  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : Number(todayInLagos().slice(0, 4));
  const format = (request.nextUrl.searchParams.get("format") ?? "csv").toLowerCase();

  let data: Awaited<ReturnType<typeof loadYearRows>>;
  try {
    data = await loadYearRows(year);
  } catch {
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }

  const { rows, totalRevenue, totalDeposits, totalOutstanding } = data;

  if (format === "pdf") {
    const pdfRows: RevenueRow[] = rows.map((r) => ({
      bookingDate: r.bookingDate,
      startTime: r.startTime,
      bookingRef: r.bookingRef,
      clientName: r.clientName,
      serviceName: r.serviceName,
      lengthLabel: r.lengthLabel,
      subtotalNgn: r.subtotalNgn,
      depositNgn: r.depositNgn,
      balanceNgn: r.balanceNgn,
      status: r.status,
    }));

    const buffer = await renderToBuffer(
      YearlyRevenueDocument({
        year,
        rows: pdfRows,
        totalAppointments: rows.length,
        totalRevenueNgn: totalRevenue,
        totalDepositsNgn: totalDeposits,
        totalOutstandingNgn: totalOutstanding,
        generatedAt: new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }),
      }),
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="thenailhive-revenue-${year}.pdf"`,
      },
    });
  }

  const csv = buildCsv(year, rows, totalRevenue, totalDeposits);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="thenailhive-revenue-${year}.csv"`,
    },
  });
}
