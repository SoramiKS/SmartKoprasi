import Link from 'next/link'
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Banknote,
  ChartNoAxesCombined,
  ClipboardList,
  Landmark,
  LockKeyhole,
  Sprout,
  UsersRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="site-header">
        <Link href="/" className="brand" aria-label="SmartKoperasi, beranda">
          <span className="brand-mark"><Sprout size={20} strokeWidth={2.2} /></span>
          <span>Smart<span className="brand-light">Koperasi</span></span>
        </Link>
        <nav className="site-nav" aria-label="Navigasi utama">
          <Link href="#fitur">Fitur</Link>
          <Link href="#cara-kerja">Cara kerja</Link>
          <Link href="#koperasi">Untuk koperasi</Link>
        </nav>
        <Link href="/login" className="header-login">
          Masuk <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="hero-kicker"><span /> Tumbuh bersama, dikelola bersama</p>
            <h1 id="hero-title">Koperasi kuat dimulai dari pengelolaan yang <em>terpercaya.</em></h1>
            <p className="hero-description">
              Satu ruang kerja untuk merapikan data anggota, mencatat simpanan dan pinjaman, serta menjaga setiap proses tetap mudah ditelusuri.
            </p>
            <div className="hero-actions">
              <Link href="/login">
                <Button className="hero-primary">
                  Masuk ke ruang kerja <ArrowRight size={17} aria-hidden="true" />
                </Button>
              </Link>
              <Link href="#fitur" className="hero-secondary">
                Kenali fiturnya <ArrowDown size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="hero-note">
              <LockKeyhole size={15} aria-hidden="true" />
              Informasi anggota ditampilkan sesuai hak akses
            </div>
          </div>
          <div className="hero-caption" aria-hidden="true">
            <span>Berangkat dari kepercayaan</span>
            <span>01 / 03</span>
          </div>
        </section>

        <section className="intro-section" id="fitur" aria-labelledby="features-title">
          <div className="section-heading">
            <p className="section-kicker">Semua proses, satu alur</p>
            <h2 id="features-title">Administrasi lebih tertata.<br /><em>Kerja bersama lebih berarti.</em></h2>
            <p className="section-lede">
              Catatan yang jelas membantu pengurus bekerja dengan tenang dan anggota memahami perkembangan koperasinya.
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature-item">
              <span className="feature-icon"><UsersRound size={21} /></span>
              <p className="feature-index">01 / KEANGGOTAAN</p>
              <h3>Kenali setiap anggota</h3>
              <p>Kelola profil dan status keanggotaan dalam catatan yang terpusat dan mudah diperbarui.</p>
            </article>
            <article className="feature-item">
              <span className="feature-icon feature-icon-amber"><Banknote size={21} /></span>
              <p className="feature-index">02 / KEUANGAN</p>
              <h3>Catat setiap pergerakan</h3>
              <p>Hubungkan transaksi simpanan, pengajuan pinjaman, dan pembayaran angsuran.</p>
            </article>
            <article className="feature-item">
              <span className="feature-icon feature-icon-blue"><ChartNoAxesCombined size={21} /></span>
              <p className="feature-index">03 / KETERBUKAAN</p>
              <h3>Pahami kondisi bersama</h3>
              <p>Lihat ringkasan dan laporan yang disusun dari catatan transaksi koperasi.</p>
            </article>
          </div>
        </section>

        <section className="workflow-section" id="cara-kerja" aria-labelledby="workflow-title">
          <div className="workflow-heading">
            <p className="section-kicker">Sederhana dari awal</p>
            <h2 id="workflow-title">Alur yang jelas,<br /><em>untuk semua peran.</em></h2>
            <p>Pengurus dan anggota melihat hal yang mereka perlukan, dari ruang kerja yang sama.</p>
          </div>
          <div className="workflow-list">
            <article className="workflow-step">
              <span className="step-number">01</span>
              <div><h3>Pengurus mencatat</h3><p>Data anggota dan aktivitas koperasi dikelola dalam satu sistem.</p></div>
              <ClipboardList size={22} aria-hidden="true" />
            </article>
            <article className="workflow-step">
              <span className="step-number">02</span>
              <div><h3>Proses tercatat rapi</h3><p>Simpanan, pinjaman, dan angsuran memiliki riwayat yang dapat ditelusuri.</p></div>
              <BadgeCheck size={22} aria-hidden="true" />
            </article>
            <article className="workflow-step">
              <span className="step-number">03</span>
              <div><h3>Anggota mendapat akses</h3><p>Anggota dapat melihat informasi miliknya melalui portal pribadi.</p></div>
              <LockKeyhole size={22} aria-hidden="true" />
            </article>
          </div>
        </section>

        <section className="cooperative-section" id="koperasi" aria-labelledby="cooperative-title">
          <div className="cooperative-symbol"><Landmark size={28} strokeWidth={1.7} /></div>
          <div className="cooperative-copy">
            <p className="section-kicker">Dibangun untuk kerja bersama</p>
            <h2 id="cooperative-title">Teknologi yang mendukung semangat <em>gotong royong.</em></h2>
          </div>
          <p className="cooperative-description">
            SmartKoperasi membantu pengurus menjaga administrasi tetap tertib, sekaligus memberi anggota akses yang lebih mudah ke informasi pribadi mereka.
          </p>
          <Link href="/login" className="cooperative-link">Masuk ke SmartKoperasi <ArrowRight size={17} /></Link>
        </section>
      </main>

      <footer className="site-footer">
        <Link href="/" className="brand footer-brand">
          <span className="brand-mark"><Sprout size={18} strokeWidth={2.2} /></span>
          <span>Smart<span className="brand-light">Koperasi</span></span>
        </Link>
        <p>Ruang digital untuk koperasi yang bertumbuh bersama.</p>
        <span className="footer-copyright">© SmartKoperasi</span>
      </footer>
    </div>
  )
}
