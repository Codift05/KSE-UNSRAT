import assert from "node:assert/strict";
import test from "node:test";
import { documentTitle, maxUploadBytes, requireUploadableFile, visibilityLabel, visibilityValue } from "./document-input.ts";

test("merapikan judul dokumen dan menolak panjang di luar batas", () => {
  assert.equal(documentTitle("  Proposal   KSE Mengajar "), "Proposal KSE Mengajar");
  assert.throws(() => documentTitle("LP"), /3–140 karakter/);
  assert.throws(() => documentTitle("x".repeat(141)), /3–140 karakter/);
});

test("visibilitas kosong berarti semua anggota", () => {
  assert.equal(visibilityValue(""), "members");
  assert.equal(visibilityValue("private"), "private");
  assert.throws(() => visibilityValue("umum"), /tidak dikenali/);
  assert.equal(visibilityLabel("management"), "Pengurus");
  assert.equal(visibilityLabel("lainnya"), "lainnya");
});

test("menolak berkas kosong dan berkas melebihi batas unggah", () => {
  assert.equal(requireUploadableFile(1024, "proposal.pdf"), 1024);
  assert.equal(requireUploadableFile(maxUploadBytes, "tepat.pdf"), maxUploadBytes);
  assert.throws(() => requireUploadableFile(0, "kosong.pdf"), /Pilih berkas/);
  assert.throws(() => requireUploadableFile(maxUploadBytes + 1, "besar.pdf"), /lebih dari 10 MB/);
});
