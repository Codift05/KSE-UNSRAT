"use server";

import { revalidatePath, updateTag } from "next/cache";
import { currentUserId, hasPermission, requirePermission } from "@/backend/authorization";
import { supabaseAdmin } from "@/backend/supabase/admin";
import { requireActivePeriod } from "@/backend/division-assignment";
import { deleteDriveFile, uploadFile } from "@/backend/drive-client";
import { ensureDocumentFolder } from "@/backend/drive-folders";
import { optionalText } from "@/backend/member-profile";
import { documentTitle, requireUploadableFile, visibilityValue } from "@/backend/document-input";

export type DocumentActionState = { message?: string; error?: string };

const field = (form: FormData, key: string) => String(form.get(key) || "");

function refreshDocuments() {
  updateTag("documents"); updateTag("dashboard");
  revalidatePath("/documents"); revalidatePath("/");
}

export async function uploadDocument(_: DocumentActionState, form: FormData): Promise<DocumentActionState> {
  try {
    const actor = await requirePermission("document.upload");
    const period = await requireActivePeriod();
    const title = documentTitle(field(form, "title"));
    const visibility = visibilityValue(field(form, "visibility"));
    const categoryId = field(form, "category_id").trim() || null;
    const programId = field(form, "program_id").trim() || null;

    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Pilih berkas yang akan diunggah");
    requireUploadableFile(file.size, file.name);

    const [{ data: category }, { data: program }] = await Promise.all([
      categoryId ? supabaseAdmin.from("categories").select("name").eq("id", categoryId).single() : Promise.resolve({ data: null }),
      programId ? supabaseAdmin.from("programs").select("name").eq("id", programId).single() : Promise.resolve({ data: null }),
    ]);

    const folderId = await ensureDocumentFolder({ periodName: period.name, programName: program?.name, categoryName: category?.name });
    const uploaded = await uploadFile(file, folderId);

    const { data, error } = await supabaseAdmin.from("documents").insert({
      title,
      description: optionalText(field(form, "description"), 300),
      period_id: period.id,
      program_id: programId,
      category_id: categoryId,
      uploader_id: actor.id,
      visibility,
      drive_file_id: uploaded.id,
      drive_folder_id: folderId,
      mime_type: uploaded.mimeType,
    }).select("id").single();

    if (error) {
      // Metadata gagal disimpan, jadi berkasnya dihapus lagi supaya Drive tidak
      // menyimpan arsip yatim yang tidak terlihat dari aplikasi mana pun.
      await deleteDriveFile(uploaded.id).catch(() => undefined);
      throw new Error(error.message);
    }

    await supabaseAdmin.from("activity_logs").insert({ actor_id: actor.id, action: `Mengunggah dokumen ${title}`, entity_type: "document", entity_id: data.id });
    refreshDocuments();
    return { message: `${title} tersimpan di Google Drive.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Dokumen gagal diunggah" }; }
}

export async function deleteDocument(_: DocumentActionState, form: FormData): Promise<DocumentActionState> {
  try {
    const userId = await currentUserId();
    const documentId = field(form, "document_id").trim();
    if (!documentId) throw new Error("Dokumen tidak dikenali");

    const { data: document, error: readError } = await supabaseAdmin.from("documents").select("title,uploader_id,drive_file_id").eq("id", documentId).single();
    if (readError) throw new Error(readError.message);
    // Kebijakan RLS documents mengizinkan penghapusan oleh pengunggah atau
    // pemegang document.delete; aturan itu ditiru di jalur service-role ini.
    if (document.uploader_id !== userId && !(await hasPermission("document.delete"))) throw new Error("Kamu hanya dapat menghapus dokumen yang kamu unggah");

    const { error } = await supabaseAdmin.from("documents").delete().eq("id", documentId);
    if (error) throw new Error(error.message);
    if (document.drive_file_id) await deleteDriveFile(document.drive_file_id).catch(() => undefined);

    await supabaseAdmin.from("activity_logs").insert({ actor_id: userId, action: `Menghapus dokumen ${document.title}`, entity_type: "document", entity_id: documentId });
    refreshDocuments();
    return { message: `${document.title} dihapus dari Drive dan sistem.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Dokumen gagal dihapus" }; }
}
