import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

const anonymousPortrait = "/img refrensi/pengurus-anonim.webp";

export function PublicLanding() {
  return (
    <main className="public-site" id="konten">
      <section className="public-hero" aria-labelledby="public-hero-title">
        <Image className="public-hero-image" src="/kse-hero-enhanced.webp" alt="Beswan KSE Unsrat berkumpul dan berdiskusi di kampus" fill priority quality={100} sizes="100vw" />
        <header className="public-nav">
          <Link className="public-brand" href="/" aria-label="PSKSE Unsrat, beranda">
            <Image src="/pskse-logo-transparent.webp" alt="Paguyuban KSE Unsrat" width={388} height={216} priority />
          </Link>
          <nav aria-label="Navigasi halaman publik"><a href="#tentang">Tentang</a><a href="#nilai">Nilai</a><a href="#kepengurusan">Kepengurusan</a><a href="#faq">FAQ</a></nav>
          <Link className="public-nav-action" href="/login">Masuk portal</Link>
        </header>
        <div className="public-container public-hero-content">
          <p className="public-hero-label">Paguyuban KSE Unsrat</p>
          <h1 id="public-hero-title">Tumbuh bersama, memberi dampak.</h1>
          <p>Ruang bagi Beswan KSE Unsrat untuk berbagi, berkembang, dan membangun jejaring bersama.</p>
          <div className="public-cta-row"><a className="public-button primary" href="#tentang">Kenali KSE <ArrowRight size={18} /></a></div>
        </div>
      </section>

      <section className="public-section public-about public-container" id="tentang" aria-labelledby="tentang-title">
        <div className="public-copy">
          <p className="public-kicker">Tentang PSKSE</p>
          <h2 id="tentang-title">Lebih dari sebuah beasiswa.</h2>
          <p>Paguyuban KSE Unsrat adalah ruang bertumbuh bagi penerima Beasiswa Karya Salemba Empat di Universitas Sam Ratulangi.</p>
          <p>Kami belajar, menggerakkan kegiatan, dan saling menguatkan melalui pengalaman yang bermakna.</p>
          <Link className="public-text-link" href="/login">Masuk ke portal anggota <ArrowRight size={17} /></Link>
        </div>
        <ol className="public-journey" aria-label="Perjalanan bersama KSE">
          <li><span>01</span><div><strong>Menerima kesempatan</strong><p>Beasiswa menjadi awal untuk melanjutkan pendidikan dengan lebih tenang.</p></div></li>
          <li><span>02</span><div><strong>Menemukan komunitas</strong><p>Beswan saling bertemu, belajar, dan membangun jejaring lintas angkatan.</p></div></li>
          <li><span>03</span><div><strong>Membawa dampak</strong><p>Setiap pengalaman mendorong kami mengambil peran bagi sekitar.</p></div></li>
        </ol>
      </section>

      <section className="public-values" id="nilai" aria-labelledby="nilai-title">
        <div className="public-container public-values-layout">
          <div className="public-section-heading"><p className="public-kicker">Nilai kami</p><h2 id="nilai-title">Hal sederhana yang kami lakukan bersama.</h2><p>Di KSE, kebersamaan tumbuh lewat perhatian kecil yang dilakukan secara konsisten.</p></div>
          <div className="public-value-list">
            <article><strong>Berbagi</strong><p>Membuka ruang untuk pengetahuan, pengalaman, dan bantuan yang saling menguatkan.</p></article>
            <article><strong>Terhubung</strong><p>Membangun jejaring yang hangat lintas angkatan, jurusan, dan perjalanan hidup.</p></article>
            <article><strong>Berkembang</strong><p>Berani mencoba, mengambil peran, dan memberi dampak yang nyata bagi sekitar.</p></article>
          </div>
        </div>
      </section>

      <section className="public-section public-structure" id="kepengurusan" aria-labelledby="structure-title">
        <div className="public-container public-structure-layout">
          <div className="public-structure-copy">
            <p className="public-kicker">Struktur organisasi</p>
            <h2 id="structure-title">Digerakkan bersama.</h2>
            <p>Di balik setiap kegiatan, ada orang-orang yang menjaga arah, merawat kerja sama, dan membuka ruang bagi beswan.</p>
            <Link className="public-button primary" href="/login">Masuk portal <ArrowRight size={18} /></Link>
          </div>

          <div className="public-org-panel">
            <div className="public-org-heading"><span>BPH</span><h3>Pengurus inti</h3><p>Lima pengurus yang menjaga organisasi tetap berjalan.</p></div>
            <div className="public-bph-grid" aria-label="Struktur pengurus inti">
              <article><Image src={anonymousPortrait} alt="" width={1086} height={1448} sizes="(max-width: 760px) 90vw, 22vw" /><div><span>Ketua</span><h4>Ezra Apriani Sinaga</h4><p>Mengoordinasikan arah organisasi dan kerja pengurus.</p></div></article>
              <article><Image src={anonymousPortrait} alt="" width={1086} height={1448} sizes="(max-width: 760px) 45vw, 14vw" /><div><span>Wakil Ketua</span><h4>Miftahuddin S. Arsyad</h4></div></article>
              <article><Image src={anonymousPortrait} alt="" width={1086} height={1448} sizes="(max-width: 760px) 45vw, 14vw" /><div><span>Sekretaris I</span><h4>Fitra Rani Sari Saragih</h4></div></article>
              <article><Image src={anonymousPortrait} alt="" width={1086} height={1448} sizes="(max-width: 760px) 45vw, 14vw" /><div><span>Sekretaris II</span><h4>Enjel Winu Panjaitan</h4></div></article>
              <article><Image src={anonymousPortrait} alt="" width={1086} height={1448} sizes="(max-width: 760px) 45vw, 14vw" /><div><span>Bendahara</span><h4>Vinny Lilly Langi</h4></div></article>
            </div>

            <div className="public-org-heading public-department-heading"><h3>Kepala departemen</h3><p>Enam departemen yang saling melengkapi.</p></div>
            <div className="public-department-grid" aria-label="Daftar departemen organisasi">
              <article><div><span>HR</span><h4>Angelita Lahete</h4><p>Human Resources</p></div><Image src={anonymousPortrait} alt="" width={1086} height={1448} sizes="76px" /></article>
              <article><div><span>Medinfo</span><h4>Elsa Monica Siwy</h4><p>Media &amp; Information</p></div><Image src={anonymousPortrait} alt="" width={1086} height={1448} sizes="76px" /></article>
              <article><div><span>Lintel</span><h4>Kalyana Sahla</h4><p>Litbang &amp; Intelektual</p></div><Image src={anonymousPortrait} alt="" width={1086} height={1448} sizes="76px" /></article>
              <article><div><span>Comdev</span><h4>Vikariessia Br Tarigan</h4><p>Community Development</p></div><Image src={anonymousPortrait} alt="" width={1086} height={1448} sizes="76px" /></article>
              <article><div><span>ION</span><h4>Shabriena Qanitien</h4><p>Internal &amp; External Relation</p></div><Image src={anonymousPortrait} alt="" width={1086} height={1448} sizes="76px" /></article>
              <article><div><span>BE</span><h4>Regina Paza</h4><p>Business &amp; Entrepreneurship</p></div><Image src={anonymousPortrait} alt="" width={1086} height={1448} sizes="76px" /></article>
            </div>
            <p className="public-portrait-note">Avatar anonim adalah penanda sementara, bukan foto pengurus.</p>
          </div>
        </div>
      </section>

      <section className="public-section public-faq" id="faq" aria-labelledby="faq-title">
        <div className="public-container public-faq-layout"><div className="public-section-heading"><p className="public-kicker">FAQ</p><h2 id="faq-title">Pertanyaan yang sering muncul.</h2><p>Hal-hal dasar tentang Paguyuban KSE Unsrat, dirangkum agar mudah ditemukan.</p></div><div className="public-faq-list">
          <details open><summary>Apa itu Paguyuban KSE Unsrat?</summary><p>Paguyuban KSE Unsrat adalah ruang bagi penerima Beasiswa Karya Salemba Empat di Universitas Sam Ratulangi untuk bertemu, belajar, berbagi, dan membangun dampak bersama.</p></details>
          <details><summary>Siapa yang dapat bergabung dalam PSKSE Unsrat?</summary><p>Keanggotaan diperuntukkan bagi penerima Beasiswa Karya Salemba Empat yang terhubung dengan Paguyuban KSE Unsrat.</p></details>
          <details><summary>Kegiatan apa yang dijalankan?</summary><p>Kegiatan mencakup pengembangan diri, pengabdian, jejaring beswan, pembelajaran, serta program yang digerakkan bersama departemen.</p></details>
          <details><summary>Bagaimana mendapatkan informasi kegiatan?</summary><p>Informasi resmi dibagikan melalui kanal komunikasi paguyuban dan portal anggota bagi beswan yang telah memiliki akses.</p></details>
          <details><summary>Apakah tersedia portal anggota?</summary><p>Ada. Portal anggota membantu pengurus dan beswan mengakses agenda, kehadiran, dokumen, serta informasi organisasi sesuai perannya.</p></details>
        </div></div>
      </section>

      <footer className="public-footer"><div className="public-container"><Image src="/pskse-logo-transparent.webp" alt="Paguyuban KSE Unsrat" width={388} height={216} /><p>Sharing. Networking. Developing.</p><div><Link href="/privacy">Kebijakan privasi</Link><Link href="/terms">Ketentuan</Link><Link href="/login">Portal anggota</Link></div></div></footer>
    </main>
  );
}
