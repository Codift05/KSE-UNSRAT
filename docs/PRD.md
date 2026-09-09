# Product Requirements Document

## KSE Management System

### 1. Informasi Produk

Nama Produk: KSE Management System
Organisasi: Paguyuban KSE Unsrat
Jenis Produk: Web-Based Organization Management System
Platform: Web Responsive
Target Deployment: Vercel
Versi Awal: MVP v1.0

---

# 2. Latar Belakang

Paguyuban KSE Unsrat memiliki berbagai aktivitas organisasi yang mencakup pengelolaan anggota, kepengurusan, program kerja, administrasi, inventaris, agenda, dokumentasi, serta evaluasi kegiatan.

Dalam pelaksanaannya, informasi organisasi berpotensi tersebar pada berbagai media seperti Google Drive, spreadsheet, grup komunikasi, dokumen pribadi pengurus, maupun pencatatan manual. Kondisi tersebut dapat menyulitkan proses monitoring program kerja, pencarian arsip, pergantian kepengurusan, serta pelacakan aktivitas organisasi dari satu periode ke periode berikutnya.

KSE Management System dikembangkan sebagai platform internal terintegrasi untuk membantu pengurus dalam mengelola kegiatan organisasi secara terpusat.

Sistem dirancang secara dinamis sehingga struktur organisasi, divisi, program kerja, kategori dokumen, kategori inventaris, serta periode kepengurusan dapat dikelola melalui sistem tanpa perlu melakukan perubahan pada source code.

File dan arsip organisasi akan disimpan menggunakan Google Drive, sementara informasi dan metadata operasional organisasi akan dikelola melalui database.

---

# 3. Tujuan Produk

KSE Management System bertujuan untuk:

1. Menjadi pusat informasi dan operasional Paguyuban KSE Unsrat.
2. Mempermudah monitoring program kerja.
3. Menyimpan data kepengurusan secara terstruktur per periode.
4. Mempermudah pengelolaan anggota dan divisi.
5. Mengelola tugas dan tanggung jawab organisasi.
6. Mengelola inventaris organisasi.
7. Mengintegrasikan arsip organisasi dengan Google Drive.
8. Mempermudah proses pergantian kepengurusan.
9. Menjaga histori dan pengetahuan organisasi dari tahun ke tahun.
10. Menyediakan informasi organisasi melalui dashboard yang mudah dipahami.

---

# 4. Product Vision

KSE Management System menjadi:

"Central Operating System for KSE Unsrat"

Satu platform yang dapat digunakan oleh seluruh kepengurusan untuk mengelola:

* anggota;
* struktur organisasi;
* program kerja;
* tugas;
* agenda;
* dokumen;
* inventaris;
* aktivitas organisasi;
* laporan;
* histori kepengurusan.

Sistem tidak dibangun hanya untuk satu periode kepengurusan, tetapi dirancang agar dapat digunakan secara berkelanjutan oleh kepengurusan berikutnya.

---

# 5. Target Pengguna

## 5.1 Super Admin

Pengguna yang memiliki akses penuh terhadap konfigurasi sistem.

Kemampuan:

* mengelola seluruh pengguna;
* mengelola role dan permission;
* membuat periode kepengurusan;
* mengatur konfigurasi organisasi;
* mengatur kategori;
* mengelola seluruh data sistem.

---

## 5.2 Ketua dan Wakil Ketua

Pengguna yang melakukan monitoring keseluruhan organisasi.

Kemampuan:

* melihat seluruh program kerja;
* melihat perkembangan divisi;
* melihat aktivitas anggota;
* membuat dan mengelola program;
* melakukan approval tertentu;
* melihat agenda organisasi;
* melihat laporan dan evaluasi.

---

## 5.3 Sekretaris

Berfokus pada administrasi organisasi.

Kemampuan:

* mengelola dokumen;
* mengelola notulen;
* mengelola agenda;
* mengelola surat organisasi;
* mengelola arsip.

---

## 5.4 Bendahara

Berfokus pada administrasi keuangan.

Kemampuan:

* mengelola anggaran program;
* mencatat transaksi;
* melihat rekap penggunaan anggaran;
* mengunggah bukti transaksi.

Fitur keuangan lengkap dapat dikembangkan pada fase selanjutnya.

---

## 5.5 Koordinator Divisi

Berfokus pada kegiatan masing-masing divisi.

Kemampuan:

* mengelola anggota divisi;
* membuat program kerja;
* mengelola program divisi;
* membuat task;
* melakukan monitoring aktivitas divisi.

---

## 5.6 Anggota

Pengguna umum dalam organisasi.

Kemampuan:

* melihat program kerja;
* melihat agenda;
* melihat tugas;
* mengubah status task yang diberikan;
* melihat dokumen sesuai permission;
* melakukan pengajuan peminjaman inventaris.

---

# 6. Ruang Lingkup Produk

MVP KSE Management System terdiri dari:

1. Authentication
2. Dashboard
3. Organization Period
4. Member Management
5. Organization Structure
6. Division Management
7. Program Management
8. Task Management
9. Calendar & Agenda
10. Inventory Management
11. Document Management
12. Google Drive Integration
13. Role & Permission
14. Activity Log
15. System Configuration

---

# 7. Information Architecture

Struktur navigasi utama:

Dashboard

Organization

* Members
* Management
* Divisions
* Periods

Programs

* All Programs
* My Programs
* Calendar

Operations

* Tasks
* Attendance
* Inventory

Administration

* Documents
* Letters
* Finance

Insights

* Program Performance
* Member Activity
* Reports

Settings

* Organization
* Roles & Permissions
* Categories
* Integrations

Beberapa menu seperti Attendance, Letters, Finance, dan Analytics dapat dikembangkan secara bertahap setelah MVP utama selesai.

## 7.1 Kehadiran dan rekap poin beswan

Menu Kehadiran menjadi pusat pencatatan partisipasi beswan pada kegiatan. Kegiatan offline memberi 20 poin dan kegiatan online memberi 10 poin untuk kehadiran penuh. Kehadiran sebagian karena harus kembali kuliah atau alasan wajar lain memperoleh 50% poin. Status Terlambat dicatat terpisah dan tetap memperoleh poin penuh sampai organisasi menetapkan aturan potongan. Izin mendapat 0 poin, sedangkan Alpa mengikuti pengurangan poin kegiatan.

Pengurus dapat mencatat status Hadir, Terlambat, Hadir sebagian, Izin, Alpa, atau Belum dicatat untuk setiap beswan. Status Izin dapat menyertakan tautan surat atau bukti izin. Sistem menyimpan poin yang diberikan pada saat pencatatan sebagai histori tetap.

Rekap periode menampilkan total poin dan jumlah setiap status per beswan. Nama beswan membuka rincian kegiatan yang menjelaskan tanggal, pelaksanaan, status, poin, dan bukti izin. Tautan rincian dapat dibagikan, tetapi beswan wajib login dan hanya dapat melihat datanya sendiri. Pengurus dengan permission kehadiran dapat melihat seluruh rincian. Spreadsheet lama dapat diimpor pada tahap migrasi setelah pemetaan nama beswan dan kegiatan diverifikasi.

Rekap diurutkan dari total poin tertinggi dan menampilkan tingkat keaktifan. Peringatan disiplin ditentukan dari akumulasi Alpa dalam periode: SP1 pada 3 kali, SP2 pada 6 kali, dan SP3 pada 8 kali. Status keanggotaan seperti aktif, nonaktif, pindah, atau alumni ditampilkan terpisah agar tidak disamakan dengan peringatan disiplin.

Pengurus dapat membuka sesi absensi mandiri untuk suatu kegiatan. Sesi memiliki tautan acak, kode singkat, waktu buka-tutup, dan untuk kegiatan offline dapat memiliki titik lokasi serta radius. Beswan wajib login dan hanya dapat check-in satu kali per kegiatan. Sistem menyimpan waktu dan bukti lokasi hanya saat check-in/check-out. Catatan mandiri selalu menunggu verifikasi dan tidak memberikan poin sebelum disetujui pengurus. Check-out sebelum durasi minimum mengusulkan status Hadir sebagian.

---

# 8. Functional Requirements

# 8.1 Authentication

Sistem harus menyediakan autentikasi pengguna.

Fitur:

* login;
* logout;
* reset password;
* session management;
* role-based access control.

Pengguna hanya dapat mengakses fitur sesuai permission yang dimiliki.

Super Admin dapat membuat akun login untuk beswan, menonaktifkan akses, mengatur ulang password, dan menghapus akun secara permanen. Beswan tidak melakukan pendaftaran mandiri; akun dibuat hanya saat mereka membutuhkan akses ke portal.

---

# 8.2 Dashboard

Dashboard menjadi halaman utama setelah pengguna login.

Informasi yang ditampilkan dapat meliputi:

* periode aktif;
* jumlah program aktif;
* jumlah anggota aktif;
* task belum selesai;
* task overdue;
* agenda terdekat;
* progress program kerja;
* inventaris yang sedang dipinjam;
* aktivitas terbaru.

Contoh KPI:

Active Programs
Pending Tasks
Upcoming Events
Active Members

Dashboard harus menyesuaikan role pengguna.

Contoh:

Koordinator hanya melihat informasi yang berkaitan dengan divisinya.

Ketua dapat melihat seluruh organisasi.

---

# 8.3 Organization Period

Sistem harus mendukung pengelolaan beberapa periode kepengurusan.

Contoh:

2026–2027 — Active
2025–2026 — Archived
2024–2025 — Archived

Data yang memiliki hubungan periode:

* pengurus;
* divisi;
* program kerja;
* anggota aktif;
* agenda;
* laporan.

Admin dapat:

* membuat periode baru;
* menetapkan periode aktif;
* mengarsipkan periode sebelumnya.

Hanya satu periode yang dapat berstatus aktif.

---

# 8.4 Member Management

Sistem harus menyediakan database anggota.

Data anggota meliputi:

* nama;
* foto;
* email;
* nomor telepon;
* universitas;
* fakultas;
* program studi;
* angkatan;
* tahun masuk KSE;
* status anggota;
* divisi;
* jabatan;
* periode;
* catatan.

Status:

Active
Inactive
Alumni

Fitur:

* tambah anggota;
* edit anggota;
* pencarian;
* filter;
* melihat profil anggota;
* melihat histori organisasi anggota.

---

# 8.5 Organization Structure

Sistem harus dapat menyimpan struktur kepengurusan setiap periode.

Contoh posisi:

Ketua
Wakil Ketua
Sekretaris
Bendahara
Koordinator Divisi
Staff

Admin dapat menentukan:

* nama jabatan;
* pengguna;
* periode;
* urutan struktur.

Dengan demikian struktur tidak di-hardcode ke source code.

---

# 8.6 Division Management

Admin dapat membuat divisi secara dinamis.

Contoh:

Community Development
Education
Internal Development
Public Relation

Field:

* nama divisi;
* deskripsi;
* koordinator;
* periode;
* anggota.

Fitur:

* tambah divisi;
* edit;
* hapus;
* assign anggota;
* assign koordinator.

---

# 8.7 Program Management

Program kerja merupakan salah satu modul utama.

Pengguna yang memiliki permission dapat menambahkan program kerja melalui:

"+ New Program"

Field:

Nama Program
Deskripsi
Divisi
PIC
Team
Periode
Tanggal Mulai
Tanggal Selesai
Target
Anggaran
Status
Priority

Status default:

Planning
Ongoing
Evaluation
Completed
Cancelled

Setiap program memiliki workspace.

Program Workspace:

Overview
Tasks
Team
Timeline
Documents
Budget
Attendance
Evaluation

---

# 8.8 Program Progress

Progress program dapat dihitung berdasarkan task.

Contoh:

Total Task: 20
Completed: 15

Progress:

75%

Progress juga dapat diubah menjadi mekanisme manual apabila diperlukan.

Dashboard menampilkan:

Program Name
PIC
Deadline
Progress
Status

---

# 8.9 Task Management

Setiap program dapat memiliki task.

Field:

* title;
* description;
* program;
* assignee;
* priority;
* start date;
* due date;
* status.

Status:

To Do
In Progress
Review
Done

Priority:

Low
Medium
High
Urgent

Pengguna dapat melihat:

My Tasks
Program Tasks
Overdue Tasks

---

# 8.10 Calendar & Agenda

Sistem menyediakan kalender organisasi.

Jenis agenda:

* rapat;
* program kerja;
* deadline;
* sharing session;
* event;
* kegiatan internal.

Field:

* title;
* description;
* start;
* end;
* location;
* related program;
* participants.

Agenda ditampilkan dalam:

Calendar View
List View

---

# 8.11 Inventory Management

Sistem harus dapat mengelola aset dan inventaris organisasi.

Data inventaris:

* inventory code;
* nama barang;
* kategori;
* jumlah;
* jumlah tersedia;
* kondisi;
* lokasi;
* tanggal diperoleh;
* sumber;
* catatan;
* foto.

Kategori dibuat secara dinamis.

Contoh:

Electronics
Documentation
Event Equipment
Office Equipment

---

# 8.12 Inventory Status

Status barang:

Available
Borrowed
Under Repair
Damaged
Lost

Kondisi:

Good
Minor Damage
Damaged

---

# 8.13 Inventory Borrowing

Anggota dapat melakukan request peminjaman.

Data:

* barang;
* jumlah;
* peminjam;
* tujuan;
* related program;
* tanggal pinjam;
* expected return;
* status.

Flow:

Request

↓

Waiting Approval

↓

Approved

↓

Borrowed

↓

Returned

↓

Condition Check

↓

Completed

Admin atau pihak yang memiliki permission dapat melakukan approval.

---

# 8.14 Inventory History

Setiap barang harus memiliki histori.

Contoh:

Tripod Kamera

10 Sep
Dipinjam — Program KSE Mengajar

13 Sep
Dikembalikan

13 Sep
Condition: Good

Riwayat tidak boleh hilang ketika transaksi peminjaman selesai.

---

# 8.15 Document Management

Sistem menyediakan pusat dokumen organisasi.

Kategori dapat dibuat secara dinamis.

Contoh:

Proposal
LPJ
Notulen
SK
Surat
Financial Document
Documentation

Field:

* title;
* description;
* category;
* program;
* period;
* uploader;
* visibility;
* drive file ID;
* drive folder ID;
* mime type;
* created date.

---

# 8.16 Google Drive Integration

File fisik tidak disimpan di Vercel.

File disimpan di Google Drive.

Architecture:

User

↓

KSE Management System

↓

Server API

↓

Google Drive API

↓

KSE Google Drive

Metadata file disimpan di database.

Database digunakan untuk:

* pencarian;
* filter;
* kategori;
* relasi program;
* permission;
* histori.

Google Drive digunakan sebagai storage.

---

# 8.17 Google Drive Folder Structure

Contoh struktur:

KSE UNSRAT

2026-2027

Administration

Letters

Meeting Notes

SK

Programs

KSE Mengajar

Proposal

Documentation

LPJ

Sharing Session

Proposal

Documentation

LPJ

Finance

Reports

Transactions

Sistem dapat membuat folder program secara otomatis ketika program baru dibuat.

---

# 8.18 Large Documentation Folder

Untuk dokumentasi kegiatan dengan banyak foto atau video, sistem tidak diwajibkan menyimpan setiap file sebagai satu record.

Sistem dapat menyimpan satu Google Drive folder.

Contoh:

Dokumentasi KSE Mengajar

127 files

Open Folder

Pendekatan ini mengurangi kompleksitas dan penggunaan database.

---

# 8.19 Activity Log

Aktivitas penting harus dicatat.

Contoh:

Miftah created program "KSE Mengajar"

Ezra updated program status to "Ongoing"

Vinny uploaded LPJ

Fitra approved inventory borrowing

Informasi:

actor
action
entity
timestamp

Log berguna untuk audit sederhana dan transparansi internal.

---

# 8.20 Role & Permission

Role tidak hanya menentukan halaman yang dapat dibuka tetapi juga tindakan yang dapat dilakukan.

Contoh permission:

member.view
member.create
member.update

program.view
program.create
program.update
program.delete

task.create
task.assign

inventory.manage
inventory.approve

document.upload
document.delete

system.manage

Role merupakan kumpulan permission.

---

# 8.21 Dynamic Categories

Kategori tidak boleh di-hardcode.

Admin dapat mengatur:

Program Categories
Document Categories
Inventory Categories

Contoh:

Program Category

* Community Development
* Education
* Internal Development

Admin dapat menambahkan kategori baru tanpa update aplikasi.

---

# 9. Non-Functional Requirements

## 9.1 Responsive

Aplikasi harus nyaman digunakan melalui:

* desktop;
* laptop;
* tablet;
* smartphone.

Prioritas utama:

desktop dan mobile.

---

## 9.2 Performance

Target:

Initial load < 3 detik pada koneksi normal.

Dashboard tidak boleh memuat file Google Drive secara langsung.

Hanya metadata yang dipanggil dari database.

---

## 9.3 Security

Sistem harus menerapkan:

* authentication;
* authorization;
* server-side validation;
* row-level security apabila menggunakan Supabase;
* secure environment variables;
* secure Google API credentials.

Google Drive credential tidak boleh berada pada frontend.

---

## 9.4 Maintainability

Source code harus:

* modular;
* menggunakan TypeScript;
* memiliki struktur feature-based;
* menggunakan reusable components;
* menggunakan schema validation.

---

## 9.5 Scalability

Walaupun MVP menggunakan free tier, struktur aplikasi harus memungkinkan migrasi ke layanan berbayar jika diperlukan.

---

# 10. Recommended Technology Stack

Frontend:

Next.js
React
TypeScript

UI:

Tailwind CSS
shadcn/ui

Backend:

Next.js Route Handlers
Server Actions

Database:

Supabase PostgreSQL

Authentication:

Supabase Auth

Storage:

Google Drive API

Deployment:

Vercel

Charts:

Recharts

Validation:

Zod

Forms:

React Hook Form

Optional:

Resend
Google Calendar API

---

# 11. Proposed Database Entities

Database utama dapat terdiri dari:

users

profiles

periods

roles

permissions

role_permissions

user_roles

divisions

division_members

positions

management_members

programs

program_members

tasks

events

inventory_categories

inventory_items

inventory_transactions

document_categories

documents

activity_logs

settings

---

# 12. Entity Relationship Concept

Hubungan utama:

Period

↓

Management

↓

Divisions

↓

Programs

↓

Tasks

Program juga terhubung ke:

Team
Documents
Events
Inventory Transactions

User dapat memiliki:

Role
Division
Position
Programs
Tasks

---

# 13. Main User Flows

## Flow 1 — Membuat Program Kerja

Coordinator

↓

Programs

↓

New Program

↓

Input program information

↓

Select Team

↓

Create

↓

Program Workspace Generated

↓

Add Tasks / Documents / Events

---

## Flow 2 — Upload Proposal

User

↓

Program Workspace

↓

Documents

↓

Upload

↓

Server

↓

Google Drive API

↓

Save File

↓

Save Metadata

↓

Document Appears in Program

---

## Flow 3 — Borrow Inventory

Member

↓

Inventory

↓

Select Item

↓

Request Borrow

↓

Coordinator/Admin Approval

↓

Borrowed

↓

Return

↓

Condition Check

↓

Completed

---

## Flow 4 — New Management Period

Super Admin

↓

Periods

↓

Create Period

↓

2027–2028

↓

Set Management

↓

Create Divisions

↓

Assign Members

↓

Activate Period

↓

Previous Period Archived

---

# 14. Dashboard Design Principle

Dashboard tidak menggunakan terlalu banyak card dekoratif.

Prioritas:

* informasi;
* hierarchy;
* readability;
* speed.

Contoh:

KSE UNSRAT
Period 2026–2027

Active Programs 6
Pending Tasks 12
Upcoming Events 3
Active Members 48

Program Progress

KSE Mengajar
████████░░ 82%

Sharing Session
██████░░░░ 65%

Needs Attention

3 overdue tasks

1 program approaching deadline

2 inventory items overdue

Upcoming

08 Sep — Rapat Pengurus
12 Sep — Sharing Session

---

# 15. Design Direction

Visual direction:

Modern
Minimal
Clean
Professional
Operational Dashboard

Inspirasi:

Linear
Notion
Vercel Dashboard
GitHub
Modern SaaS Application

Hindari:

* gradient berlebihan;
* glassmorphism berlebihan;
* terlalu banyak floating cards;
* icon dekoratif tidak penting;
* landing-page style pada internal dashboard.

Interface harus terasa seperti aplikasi kerja, bukan website promosi organisasi.

---

# 16. MVP Priority

## P0 — Core

Wajib tersedia sebelum release:

Authentication

Dashboard

Period Management

Member Management

Management Structure

Division Management

Program Management

Task Management

Inventory

Documents

Google Drive Integration

Roles & Permissions

---

## P1 — Important

Calendar

Activity Logs

Inventory Borrowing

Program Evaluation

Basic Reporting

---

## P2 — Enhancement

Attendance

QR Attendance

Finance

Letters

Analytics

Notification

Google Calendar Integration

---

## P3 — Future

Automatic LPJ Generator

Automatic Organization Report

Advanced Analytics

Member Contribution Score

Email Notification

PWA

Mobile Application

AI Knowledge Search

---

# 17. Future Feature — Organizational Knowledge Base

Sistem dapat menyimpan pengetahuan organisasi.

Contoh:

SOP

Template

Program Evaluation

Previous Proposal

Previous LPJ

Lesson Learned

Important Contacts

Tujuan:

pengurus periode berikutnya tidak perlu memulai dari nol.

---

# 18. Future Feature — Automatic LPJ Generator

Data program dapat dikompilasi menjadi draft laporan.

Sumber data:

program information

team

timeline

task completion

budget

attendance

documentation

evaluation

Sistem dapat menghasilkan struktur LPJ yang kemudian diedit oleh pengurus.

---

# 19. Future Feature — Organization Analytics

Dashboard pimpinan dapat menyediakan:

Program Completion Rate

Task Completion Rate

Member Participation

Inventory Utilization

Attendance Rate

Budget Realization

Data dapat dibandingkan antarperiode.

---

# 20. Success Metrics

Keberhasilan sistem dapat diukur melalui:

90% program kerja tercatat dalam sistem.

80% dokumen organisasi terindeks melalui sistem.

Seluruh inventaris memiliki record digital.

Seluruh kepengurusan tercatat berdasarkan periode.

Task program dapat dimonitor melalui dashboard.

Pengurus periode berikutnya dapat mengakses arsip periode sebelumnya.

---

# 21. Product Constraints

Sistem dirancang menggunakan layanan gratis pada tahap awal.

Batasan:

Vercel Free Tier

Supabase Free Tier

Google Drive account storage

Karena itu:

file besar tidak disimpan di database;

foto kegiatan jumlah besar menggunakan folder Drive;

database hanya menyimpan metadata;

proses berat diminimalkan;

aplikasi tidak menggunakan dedicated backend server pada MVP.

---

# 22. Deployment Architecture

Client Browser

↓

Vercel

↓

Next.js Application

├── UI

├── Server Actions

└── API Routes

↓

Supabase

├── PostgreSQL

└── Authentication

↓

Google Drive API

↓

KSE Google Drive

Dengan arsitektur tersebut, sistem dapat berjalan tanpa VPS pada tahap awal.

---

# 23. Proposed Development Phases

## Phase 1 — Foundation

Project setup

Authentication

Database

Roles

Periods

Members

Organization Structure

---

## Phase 2 — Operations

Programs

Tasks

Divisions

Calendar

Dashboard

---

## Phase 3 — Asset & Documents

Inventory

Borrowing

Google Drive

Documents

Activity Logs

---

## Phase 4 — Insights

Reporting

Program Evaluation

Member Activity

Analytics

---

## Phase 5 — Advanced

Finance

Attendance

LPJ Generator

Knowledge Base

Notifications

---

# 24. Definition of Done MVP

MVP dianggap selesai apabila pengguna dapat:

login;

membuat periode kepengurusan;

mengelola anggota;

membuat struktur kepengurusan;

membuat divisi;

membuat program kerja;

menambahkan anggota ke program;

membuat dan assign task;

melihat progress program;

membuat agenda;

mengelola inventaris;

mengajukan peminjaman;

mengunggah dokumen ke Google Drive;

mengakses dokumen dari sistem;

melihat dashboard organisasi;

dan seluruh akses mengikuti role dan permission.

---

# 25. Final Product Concept

KSE Management System bukan hanya website administratif.

Produk ini dirancang menjadi infrastruktur digital organisasi yang menyimpan:

people,

programs,

tasks,

assets,

documents,

history,

dan institutional knowledge.

Tujuan akhirnya adalah menjadikan proses pengelolaan Paguyuban KSE Unsrat lebih terstruktur, terdokumentasi, transparan, dan mudah dilanjutkan oleh kepengurusan berikutnya.
