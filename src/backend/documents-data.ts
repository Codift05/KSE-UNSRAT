import "server-only";
import { unstable_cache } from "next/cache";
import { currentUserId, hasPermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { driveConfig } from "@/backend/drive-config";
import { organizationTimeZone } from "@/backend/time-format";

export type DocumentRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  program: string;
  owner: string;
  uploaderId: string;
  updated: string;
  status: string;
  visibility: string;
  visibilityLabel: string;
  driveFileId: string;
  driveLink: string;
  mine: boolean;
};
export type Option = { id: string; name: string };

const stamp = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: organizationTimeZone });
const visibilityLabel = (value: string) => ({ members: "Semua anggota", management: "Pengurus", private: "Pribadi" })[value] || value;

const loadDocumentRows = unstable_cache(async () => {
  const { data: period } = await supabaseAdmin.from("periods").select("id,name").eq("is_active", true).maybeSingle();

  const [{ data: documents, error }, { data: categories }, { data: programs }, { data: profiles }] = await Promise.all([
    supabaseAdmin.from("documents").select("id,title,description,category_id,program_id,uploader_id,visibility,drive_file_id,mime_type,created_at").order("created_at", { ascending: false }).limit(300),
    supabaseAdmin.from("categories").select("id,name").eq("type", "document").order("name"),
    period ? supabaseAdmin.from("programs").select("id,name").eq("period_id", period.id).order("name") : Promise.resolve({ data: [] as Option[] }),
    supabaseAdmin.from("profiles").select("id,full_name").limit(500),
  ]);
  if (error) throw new Error(`Gagal memuat dokumen: ${error.message}`);

  const categoryNameById = new Map((categories || []).map(category => [category.id, category.name]));
  const programNameById = new Map((programs || []).map(program => [program.id, program.name]));
  const nameById = new Map((profiles || []).map(profile => [profile.id, profile.full_name]));

  return {
    periodName: period?.name || "",
    categories: (categories || []).map(category => ({ id: category.id, name: category.name })),
    programs: (programs || []).map(program => ({ id: program.id, name: program.name })),
    documents: (documents || []).map(document => ({
      id: document.id,
      title: document.title,
      description: document.description || "",
      category: document.category_id ? categoryNameById.get(document.category_id) || "Kategori terhapus" : "Tanpa kategori",
      program: document.program_id ? programNameById.get(document.program_id) || "Program lain" : "Organisasi",
      owner: document.uploader_id ? nameById.get(document.uploader_id) || "Pengguna terhapus" : "Sistem",
      uploaderId: document.uploader_id || "",
      updated: stamp.format(new Date(document.created_at)),
      // Kelengkapan metadata: dokumen tanpa kategori masih perlu ditinjau.
      status: document.category_id ? "Lengkap" : "Perlu review",
      visibility: document.visibility,
      visibilityLabel: visibilityLabel(document.visibility),
      driveFileId: document.drive_file_id || "",
      driveLink: document.drive_file_id ? `https://drive.google.com/file/d/${document.drive_file_id}/view` : "",
      mine: false,
    })),
  };
}, ["documents"], { revalidate: 30, tags: ["documents", "programs", "members"] });

export async function loadDocuments() {
  const [userId, canDeleteAny, canUpload] = await Promise.all([currentUserId(), hasPermission("document.delete"), hasPermission("document.upload")]);
  const data = await loadDocumentRows();
  // Kebijakan RLS documents menyembunyikan dokumen private milik orang lain
  // dari siapa pun tanpa system.manage; aturan itu ditiru di sini.
  const visible = data.documents
    .map(document => ({ ...document, mine: document.uploaderId === userId }))
    .filter(document => document.visibility !== "private" || document.mine || canDeleteAny);

  return {
    ...data,
    documents: visible,
    currentUserId: userId,
    canUpload,
    canDeleteAny,
    driveConfigured: driveConfig().configured,
  };
}
