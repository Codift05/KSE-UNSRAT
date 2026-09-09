"use client";

import { CheckCircle, Crosshair, SignOut } from "@phosphor-icons/react";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { submitSelfAttendance } from "@/app/attendance/actions";

type SelfAttendanceData = Awaited<ReturnType<typeof import("@/backend/self-attendance-data").loadSelfAttendance>>;

export function SelfAttendanceView({ token, name, data }: { token: string; name: string; data: SelfAttendanceData }) {
  const [state, action, pending] = useActionState(submitSelfAttendance, {});
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const router = useRouter();
  useEffect(() => { if (state.message) router.refresh(); }, [router, state.message]);
  const locate = () => {
    setLocationError("");
    navigator.geolocation.getCurrentPosition(position => setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }), error => setLocationError(error.code === 1 ? "Izin lokasi ditolak." : "Lokasi belum dapat dibaca."), { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  };
  const needsLocation = data.event.mode === "Offline";
  const alreadyRecorded = Boolean(data.record && !data.record.checkedIn && (data.record.source === "manual" || data.record.verification === "verified"));
  const canSend = (data.record?.checkedIn ? data.canCheckOut : data.isOpen) && (!needsLocation || location) && !pending;
  return <main className="self-attendance-page"><section className="self-attendance-card">
    <header><span>{data.event.mode}</span><h1>{data.event.title}</h1><p>{data.event.startsAt}</p></header>
    <div className="self-member"><CheckCircle size={20} /><div><strong>{name}</strong><span>Absensi terhubung ke akun ini</span></div></div>
    {data.record && <dl className="attendance-state"><div><dt>Status</dt><dd>{data.record.status}</dd></div><div><dt>Verifikasi</dt><dd>{data.record.verification === "verified" ? "Disetujui" : data.record.verification === "rejected" ? "Ditolak" : "Menunggu"}</dd></div><div><dt>Check-in</dt><dd>{data.record.checkedIn || "-"}</dd></div><div><dt>Check-out</dt><dd>{data.record.checkedOut || "-"}</dd></div></dl>}
    {!data.isOpen && !data.record?.checkedIn && <p className="inline-message error" role="alert">Sesi check-in belum dibuka atau sudah ditutup.</p>}
    <form action={action}>
      <input type="hidden" name="token" value={token} /><input type="hidden" name="latitude" value={location?.latitude || ""} /><input type="hidden" name="longitude" value={location?.longitude || ""} /><input type="hidden" name="accuracy" value={location?.accuracy || ""} />
      {!data.record?.checkedIn && !alreadyRecorded && <label>Kode kegiatan<input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required /></label>}
      {needsLocation && !alreadyRecorded && <button className="location-button" type="button" onClick={locate}><Crosshair size={17} />{location ? location.accuracy > 200 ? `Lokasi perkiraan · ${Math.round(location.accuracy)} m` : `Lokasi siap · akurasi ${Math.round(location.accuracy)} m` : "Ambil lokasi saat ini"}</button>}
      {locationError && <p className="inline-message error" role="alert">{locationError}</p>}
      {state.error && <p className="inline-message error" role="alert">{state.error}</p>}{state.message && <p className="inline-message success" role="status">{state.message}</p>}
      {alreadyRecorded ? <p className="inline-message success">Kehadiranmu sudah dicatat pengurus. Tidak perlu check-in lagi.</p> : !data.record?.checkedIn ? <button className="primary-button" name="intent" value="check-in" disabled={!canSend}><CheckCircle size={17} />{pending ? "Mengirim..." : "Check-in"}</button> : !data.record.checkedOut ? <button className="primary-button" name="intent" value="check-out" disabled={!canSend}><SignOut size={17} />{pending ? "Mengirim..." : "Check-out"}</button> : null}
    </form>
    <small>Lokasi hanya dikirim saat kamu menekan tombol absensi. Catatan akan diperiksa pengurus sebelum poin diberikan.</small>
  </section></main>;
}
