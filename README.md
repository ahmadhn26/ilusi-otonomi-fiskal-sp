# Ilusi Otonomi Fiskal Daerah

**Dashboard visualisasi data kemandirian fiskal 508 kabupaten/kota di Indonesia — APBD 2024 (realisasi) vs APBD 2025 (anggaran).**

> 📊 **Fakta Kunci:**
> * **239 dari 507 daerah (47,1%)** masih mencatat kemandirian fiskal pada kategori *sangat kurang* (0–10%).
> * Rata-rata nasional tingkat kemandirian fiskal adalah **19,02%**.

Proyek ini mengeksplorasi disparitas fiskal daerah melalui empat pendekatan visual utama: geospasial, multivariat, hierarkis, dan komparasi kebijakan anggaran.

---

## 🌐 Demo Langsung

Aplikasi dapat diakses secara daring melalui tautan berikut:
* **Live URL:** [https://ahmadhn26.github.io/ilusi-otonomi-fiskal-sp/](https://ahmadhn26.github.io/ilusi-otonomi-fiskal-sp/)

---

## 🚀 Fitur Utama

| Seksi | Visualisasi | Interaksi |
| :--- | :--- | :--- |
| **01 · Analisis Spasial** | Choropleth gradasi/klaster, simbol proporsional, peta LISA inferensial | Filter metrik, zoom/pan, klik daerah untuk menyorot ke tampilan lain |
| **02 · Analisis Multivariat** | Scatter PCA, koordinat paralel, peta panas terklaster (`z-score`) | *Brushing & linking* antar-grafik dan peta |
| **03 · Struktur Hierarkis** | Treemap + Sunburst 3 level (Nasional → Provinsi → Kab/Kota) | *Drill-down* dengan *breadcrumb*, encoding ganda (ukuran = penduduk, warna = kemandirian) |
| **04 · Komparasi Kebijakan** | Grafik *dumbbell* alokasi belanja fungsi 2024 (realisasi) vs 2025 (anggaran) | Seleksi daerah atau fungsi, pengurutan berdasarkan besar selisih |
| **05 · Validasi & Metodologi** | Ringkasan kualitas data, uji KMO & Bartlett, varian kumulatif PCA | — |

> 🛠️ **Panel Filter & Parameter:** Memungkinkan penyaringan data secara sinkron (jenis administrasi, provinsi, klaster K-Means, rentang kemandirian, dan palet warna ramah buta warna).

---

## 💻 Teknologi & Stack

* **Core:** Vanilla HTML5, CSS3, & JavaScript (SPA statis tanpa proses *build*)
* **Library Visualisasi:** Apache ECharts 5.5 (via CDN)
* **Framework CSS:** Tailwind CSS (via CDN)
* **Desain Warna:** Palet sekuensial aman buta warna (*Viridis* dan *Cividis*)

---

## ⚙️ Menjalankan Secara Lokal

Aplikasi memuat data menggunakan fungsi `fetch()`. Oleh karena itu, proyek ini **wajib dijalankan melalui server HTTP lokal** dan tidak dapat dibuka langsung sebagai berkas lokal (`file://`).

Silakan gunakan salah satu opsi perintah di bawah ini melalui terminal Anda:

### Opsi 1: Menggunakan Python
```bash
python -m http.server 8765
```

### Opsi 2: Menggunakan Node.js
```bash
npx serve -l 8765
```

Setelah server berjalan, buka peramban web dan akses alamat berikut:
```text
http://localhost:8765/index.html
```

---

## 📦 Deployment

Karena aplikasi bersifat 100% statis, Anda dapat langsung mengunggah folder proyek ke layanan berikut:
* **GitHub Pages**
* **Netlify**
* **Vercel**

*Pastikan berkas utama berada pada direktori akar (root) sebagai `index.html`.*

---

## 📂 Struktur Berkas

```text
├── index.html                  # Kerangka antarmuka, tata letak, dan struktur HTML
├── app.js                      # Logika pemuatan data, interaksi, dan konfigurasi ECharts
├── kabkota_master_final.json   # Dataset master 508 kab/kota beserta hasil PCA & klaster
├── kabkota_simplified.geojson  # Peta batas wilayah digital terkompresi (5,68 MB)
└── README.md                   # Dokumentasi proyek
```

---

## 🔬 Metodologi Singkat

* **Rasio Kemandirian Fiskal**
  \[\text{Rasio Kemandirian Fiskal} = \left( \frac{\text{Realisasi PAD}}{\text{Realisasi Transfer}} \right) \times 100\%\]
  *(Berdasarkan petunjuk teknis Badan Pusat Statistik)*

* **Global Moran's I**
  Mencapai **+0,3920** (p < 0.05, bobot kontingensi *Queen*, n = 507). Dihitung menggunakan pustaka PySAL untuk mengonfirmasi adanya autokorelasi spasial.

* **PCA & K-Means**
  Reduksi dimensi dilakukan atas 8 indikator keuangan utama (KMO = 0,54; varian kumulatif 2 komponen utama = **61,14%**). Dilanjutkan dengan pengklusteran K-Means (K=4) untuk menghasilkan tipologi struktural daerah.

---

## 📊 Sumber Data

1. **Badan Pusat Statistik (BPS):** Publikasi *Statistik Keuangan Pemerintah Kabupaten/Kota 2024 dan 2025* (Volume 43).
2. **Badan Pusat Statistik (BPS):** Data Pendukung Indeks Pembangunan Manusia (IPM) dan Persentase Penduduk Miskin (P₀) Tahun 2024.
3. **Badan Informasi Geospasial (BIG):** Data geospasial batas administrasi kabupaten/kota melalui repositori komunitas terbuka (`Alf-Anas/batas-administrasi-indonesia`).

---

## 🤖 Deklarasi Penggunaan AI

Penggunaan kecerdasan buatan (*Generative AI*) pada proyek ini dibatasi hanya sebagai asisten teknis untuk membantu penyusunan skrip pengolahan data Python, penyusunan draf naskah makalah, serta penulisan sintaksis visualisasi web. Seluruh hasil analisis statistik, validasi data terhadap tabel BPS, dan interpretasi temuan divalidasi serta dikerjakan secara mandiri oleh penulis.

---

## 💳 Kredit & Identitas

* **Penulis:** Ahmad Husein Nasution
* **NIM:** `222312952`
* **Kelas:** `3SD2`
* **Program Studi:** D-IV Komputasi Statistik
* **Institusi:** Politeknik Statistika STIS

*Tugas Akhir Mata Kuliah Visualisasi Data dan Informasi, Semester Genap T.A. 2025/2026.*
