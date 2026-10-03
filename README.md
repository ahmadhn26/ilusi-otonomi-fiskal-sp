# Ilusi Otonomi Fiskal Daerah

**Dashboard visualisasi data kemandirian fiskal 508 kabupaten/kota di 37 provinsi Indonesia — APBD 2024 (realisasi) vs APBD 2025 (anggaran).**

> 207 dari 508 daerah (40,7%) masih mencatat kemandirian fiskal di bawah 10%.
> Rata-rata nasional hanya **19,02%** — kategori *kurang mandiri*.

Proyek ini mengeksplorasi disparitas fiskal daerah melalui empat pendekatan visual:
geospasial, multivariat, hierarkis, dan komparasi kebijakan anggaran.

## Demo Langsung

- 🌐 Deployment: `[isi link setelah deploy — GitHub Pages / Netlify / Vercel]`

## Fitur Utama

| Seksi | Visualisasi | Interaksi |
|---|---|---|
| **01 · Analisis Spasial** | Choropleth gradasi/klaster, simbol proporsional, overlay lapisan | 5 metrik, zoom/pan, klik daerah → fokus ke Seksi 04 |
| **02 · Analisis Multivariat** | Scatter PCA, biplot, radar, koordinat paralel, heatmap z-score | Brushing & linking ke peta dan treemap |
| **03 · Struktur Hierarkis** | Treemap + sunburst 3 level (Nasional → Provinsi → Kab/Kota) | Drill-down dengan breadcrumb, encoding ganda (luas = penduduk, warna = kemandirian) |
| **04 · Komparasi Kebijakan** | Bar grup + kartu delta alokasi belanja fungsi 2024 vs 2025 | Agregasi nasional / per klaster / per daerah |
| **05 · Validasi Statistik** | KMO, Bartlett, varian kumulatif PCA | — |

Panel **Filter & Parameter** menyaring seluruh dashboard secara tersinkronisasi
(jenis administrasi, provinsi, klaster K-Means, rentang kemandirian, kategori otonomi, palet aksesibel).

## Teknologi

- **Vanilla HTML/CSS/JavaScript** — tanpa proses build, SPA satu halaman
- **Apache ECharts 5.5** (CDN) — semua grafik
- **Tailwind CSS** (CDN) — layout
- Palet colorblind-safe: Viridis, Cividis, Teal–Amber + palet kualitatif Paul Tol

## Menjalankan Secara Lokal

Aplikasi memuat data via `fetch()`, sehingga **harus dijalankan melalui server HTTP**
(tidak bisa dibuka langsung sebagai `file://`).

```bash
# Opsi 1: Python
python -m http.server 8765

# Opsi 2: Node.js
npx serve -l 8765
```

Lalu buka `http://localhost:8765/index.html`.

## Deployment

Karena aplikasi 100% statis, cukup unggah folder proyek ke **GitHub Pages**, **Netlify**,
atau **Vercel**. Tidak ada langkah build; pastikan `index.html` menjadi halaman utama.

## Struktur Berkas

```
├── index.html                 # Layout, konten statis, gaya
├── app.js                     # Seluruh logika visualisasi & interaksi
├── kabkota_master_final.json  # Dataset master: 508 kab/kota (±30 variabel)
├── kabkota_simplified.geojson # Batas wilayah digital 514 fitur (508 kab/kota + 6 wilayah DKI)
└── README.md
```

## Metodologi Singkat

- **Kemandirian fiskal** = PAD ÷ total pendapatan daerah (%), dihitung dari
  Statistik Keuangan Pemerintah Daerah Tingkat II (BPS).
- **Moran's I** = 0,3927 (p = 0,001, 999 permutasi, queen-like weights, n = 507) —
  dihitung eksternal dengan join kunci lengkap `provinsi|jenis|nama`.
- **PCA** pada ≥8 variabel numerik (KMO = 0,54; Bartlett p < 0,001;
  2 komponen menjelaskan 61,14% varian), dilanjutkan **K-Means 4 klaster**
  berdasarkan skor PC1–PC2.
- Skor PCA/K-Means dihitung terpisah dan disimpan di dataset master;
  aplikasi hanya memvisualisasikan hasilnya.

## Sumber Data

1. Statistik Keuangan Pemerintah Daerah Tingkat II — BPS RI (2024 realisasi & 2025 anggaran)
2. Indeks Pembangunan Manusia (IPM) Kabupaten/Kota — BPS RI (2024)
3. Profil Kemiskinan Indonesia (P0) — BPS RI (Maret 2024)
4. PDRB Atas Dasar Harga Berlaku Kabupaten/Kota — BPS RI (2023, rilis 2024)
5. Proyeksi Penduduk Kabupaten/Kota — BPS RI (2024)
6. Batas wilayah digital kab/kota — BIG/Kemendagri (data pendukung non-BPS)

## Deklarasi Penggunaan AI

Asisten pengodean AI digunakan sebatas tata letak HTML/CSS dan konfigurasi Apache ECharts.
Perhitungan statistik (Moran's I, PCA, K-Means) dilakukan terpisah, dan interpretasi
fiskal serta analisis dilakukan secara mandiri. Deklarasi lengkap tersedia di
Seksi 05 aplikasi.

## Kredit

**Ahmad Husein Nasution** · NIM 222312952 · Kelas 3SD2
Politeknik Statistika STIS — Tugas Akhir Visualisasi Data dan Informasi, Semester 6 (2026)
