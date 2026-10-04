# Ilusi Otonomi Fiskal Daerah

**Dashboard visualisasi data kemandirian fiskal 508 kabupaten/kota di Indonesia — APBD 2024 (realisasi) vs APBD 2025 (anggaran).**

> 239 dari 507 daerah (47,1%) masih mencatat kemandirian fiskal pada kategori sangat kurang (0–10%).
> Rata-rata nasional tingkat kemandirian fiskal adalah **19,02%**.

Proyek ini mengeksplorasi disparitas fiskal daerah melalui empat pendekatan visual utama: geospasial, multivariat, hierarkis, dan komparasi kebijakan anggaran.

## Demo Langsung

- 🌐 **Live URL:** [https://ahmadhn26.github.io/ilusi-otonomi-fiskal-sp/](https://ahmadhn26.github.io/ilusi-otonomi-fiskal-sp/)

## Fitur Utama

| Seksi | Visualisasi | Interaksi |
|---|---|---|
| **01 · Analisis Spasial** | Choropleth gradasi/klaster, simbol proporsional, peta LISA inferensial | Filter metrik, zoom/pan, klik daerah untuk menyorot ke tampilan lain |
| **02 · Analisis Multivariat** | Scatter PCA, koordinat paralel, peta panas terklaster (`z-score`) | *Brushing & linking* antar-grafik dan peta |
| **03 · Struktur Hierarkis** | Treemap + Sunburst 3 level (Nasional → Provinsi → Kab/Kota) | *Drill-down* dengan *breadcrumb*, encoding ganda (ukuran = penduduk, warna = kemandirian) |
| **04 · Komparasi Kebijakan** | Grafik *dumbbell* alokasi belanja fungsi 2024 (realisasi) vs 2025 (anggaran) | Seleksi daerah atau fungsi, pengurutan berdasarkan besar selisih |
| **05 · Validasi & Metodologi** | Ringkasan kualitas data, uji KMO & Bartlett, varian kumulatif PCA | — |

Panel **Filter & Parameter** memungkinkan penyaringan data secara sinkronisasi (jenis administrasi, provinsi, klaster K-Means, rentang kemandirian, dan palet warna ramah buta warna).

## Teknologi

- **Vanilla HTML/CSS/JavaScript** — berbasis SPA (*Single Page Application*) statis tanpa proses *build*.
- **Apache ECharts 5.5** (via CDN) — pustaka utama visualisasi interaktif.
- **Tailwind CSS** (via CDN) — kerangka tata letak antarmuka[cite: 16].
- **Palet Warna:** Memanfaatkan palet sekuensial yang aman bagi buta warna (*Viridis* dan *Cividis*)[cite: 16].

## Menjalankan Secara Lokal

Aplikasi memuat data melalui fungsi `fetch()`, sehingga **wajib dijalankan melalui server HTTP lokal** (tidak dapat dibuka langsung sebagai berkas lokal `file://`).

```bash
# Opsi 1: Menggunakan Python
python -m http.server 8765

# Opsi 2: Menggunakan Node.js
npx serve -l 8765

Setelah itu, buka peramban web dan akses: `http://localhost:8765/index.html`.

## Deployment

Karena aplikasi bersifat 100% statis, Anda dapat langsung mengunggah folder proyek ke **GitHub Pages**, **Netlify**, atau **Vercel**[cite: 16]. Pastikan berkas utama berada pada direktori akar sebagai `index.html`.

## Struktur Berkas

```text
├── index.html               # Kerangka antarmuka, tata letak, dan struktur HTML
├── app.js                   # Logika pemuatan data, interaksi, dan ECharts
├── kabkota_master_final.json  # Dataset master 508 kab/kota beserta hasil PCA & klaster
├── kabkota_simplified.geojson # Peta batas wilayah digital terkompresi (5,68 MB)
└── README.md                # Dokumentasi proyek

## Metodologi Singkat

- **Rasio Kemandirian Fiskal** = $(\text{Realisasi PAD} \div \text{Realisasi Transfer}) \times 100\%$ (berdasarkan petunjuk teknis BPS)[cite: 16].
- **Global Moran's I** = **+0,3920** ($p < 0.05$, bobot kontingensi *Queen*, $n = 507$) — dihitung menggunakan pustaka PySAL untuk mengonfirmasi autokorelasi spasial[cite: 16].
- **PCA & K-Means** = Reduksi dimensi atas 8 indikator keuangan utama (KMO = 0,54; varian kumulatif 2 komponen utama = **61,14%**), dilanjutkan pengklusteran K-Means ($K=4$) menghasilkan tipologi struktural daerah[cite: 16].

## Sumber Data

1. **Badan Pusat Statistik (BPS):** Publikasi *Statistik Keuangan Pemerintah Kabupaten/Kota 2024 dan 2025* (Volume 43)[cite: 16].
2. **BPS:** Data Pendukung Indeks Pembangunan Manusia (IPM) dan Persentase Penduduk Miskin ($P_0$) Tahun 2024[cite: 16].
3. **Badan Informasi Geospasial (BIG):** Data geospasial batas administrasi kabupaten/kota yang diakses melalui repositori terbuka komunitas (`Alf-Anas/batas-administrasi-indonesia`)[cite: 16].

## Deklarasi Penggunaan AI

Penggunaan kecerdasan buatan (*Generative AI*) dibatasi sebagai asisten teknis untuk membantu penyusunan skrip pengolahan data Python, penyusunan draf naskah makalah, serta penulisan sintaksis visualisasi web. Seluruh hasil analisis statistik, validasi data terhadap tabel BPS, dan interpretasi temuan divalidasi dan dikerjakan secara mandiri oleh penulis[cite: 16].

## Kredit

**Ahmad Husein Nasution** · NIM: `222312952` · Kelas: `3SD2`[cite: 16]  
Program Studi D-IV Komputasi Statistik — Politeknik Statistika STIS  
Tugas Akhir Mata Kuliah Visualisasi Data dan Informasi, Semester Genap T.A. 2025/2026[cite: 17, 18]