"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { requireActivePeriod } from "@/backend/division-assignment";
import { agendaTypeValue, attendanceEventType, eventTitle, requireOrderedMoments } from "@/backend/event-input";
import { organizationDateTimeToIso } from "@/backend/time-format";
import { optionalText } from "@/backend/member-profile";

export type CalendarActionState = { message?: string; error?: string };

const field = (form: FormData, key: string) => String(form.get(key) || "");

function refreshCalendar() {
  updateTag("calendar"); updateTag("dashboard"); updateTag("sections");
  revalidatePath("/calendar"); revalidatePath("/");
}

async function log(actorId: string, action: string, eventId: string) {
  await supabaseAdmin.from("activity_logs").insert({ actor_id: actorId, action, entity_type: "event", entity_id: eventId });
}

// Kegiatan kehadiran membawa konfigurasi poin dan token, dan menghapusnya akan
// menghapus attendance_records lewat on delete cascade. Kalender tidak boleh
// menyentuhnya; pengelolaannya tetap di halaman Kehadiran.
async function requireAgendaEvent(eventId: string) {
  const { data, error } = await supabaseAdmin.from("events").select("title,type").eq("id", eventId).single();
  if (error) throw new Error(error.message);
  if (data.type === attendanceEventType) throw new Error("Kegiatan kehadiran dikelola di halaman Kehadiran, bukan dari kalender.");
  return data;
}

function agendaFields(form: FormData) {
  const startsAt = organizationDateTimeToIso(field(form, "starts_at"));
  const rawEnd = field(form, "ends_at").trim();
  const { endsAt } = requireOrderedMoments(startsAt, rawEnd ? organizationDateTimeToIso(rawEnd) : null);
  return {
    title: eventTitle(field(form, "title")),
    type: agendaTypeValue(field(form, "type")),
    description: optionalText(field(form, "description"), 300),
    location: optionalText(field(form, "location"), 120),
    program_id: field(form, "program_id").trim() || null,
    starts_at: startsAt,
    ends_at: endsAt,
  };
}

export async function createAgenda(_: CalendarActionState, form: FormData): Promise<CalendarActionState> {
  try {
    const actor = await requirePermission("program.update");
    const period = await requireActivePeriod();
    const values = agendaFields(form);
    const { data, error } = await supabaseAdmin.from("events").insert({ ...values, period_id: period.id, created_by: actor.id }).select("id").single();
    if (error) throw new Error(error.message);
    await log(actor.id, `Membuat agenda ${values.title}`, data.id);
    refreshCalendar();
    return { message: `Agenda ${values.title} ditambahkan.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Agenda gagal dibuat" }; }
}

export async function updateAgenda(_: CalendarActionState, form: FormData): Promise<CalendarActionState> {
  try {
    const actor = await requirePermission("program.update");
    const eventId = field(form, "event_id").trim();
    if (!eventId) throw new Error("Agenda tidak dikenali");
    await requireAgendaEvent(eventId);
    const values = agendaFields(form);
    const { error } = await supabaseAdmin.from("events").update(values).eq("id", eventId);
    if (error) throw new Error(error.message);
    await log(actor.id, `Mengubah agenda ${values.title}`, eventId);
    refreshCalendar();
    return { message: "Agenda berhasil diperbarui." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Agenda gagal diperbarui" }; }
}

export async function deleteAgenda(_: CalendarActionState, form: FormData): Promise<CalendarActionState> {
  try {
    const actor = await requirePermission("program.update");
    const eventId = field(form, "event_id").trim();
    if (!eventId) throw new Error("Agenda tidak dikenali");
    const event = await requireAgendaEvent(eventId);
    // Penjaga kedua: bila suatu saat agenda biasa ikut punya catatan kehadiran,
    // penghapusan tetap ditolak agar riwayat poin tidak hilang diam-diam.
    const { count } = await supabaseAdmin.from("attendance_records").select("*", { count: "exact", head: true }).eq("event_id", eventId);
    if (count) throw new Error(`Agenda ini punya ${count} catatan kehadiran. Hapus dari halaman Kehadiran bila memang perlu.`);
    const { error } = await supabaseAdmin.from("events").delete().eq("id", eventId);
    if (error) throw new Error(error.message);
    await log(actor.id, `Menghapus agenda ${event.title}`, eventId);
    refreshCalendar();
    return { message: `Agenda ${event.title} dihapus.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Agenda gagal dihapus" }; }
}
