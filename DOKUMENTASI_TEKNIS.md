# Dokumentasi Teknis: Ilusi Otonomi Fiskal Daerah Indonesia
## Dashboard Visualisasi APBD 2024–2025 · 508 Kab/Kota

> **Mata Kuliah:** Visualisasi Data dan Informasi (K203407)
> **Program:** Diploma IV Komputasi Statistik - Politeknik Statistika STIS
> **UAS Genap TA. 2025/2026** | Dosen: Siti Mariyah, Ph.D. & Farid Ridho, M.T.

---

## Daftar Isi

1. [Gambaran Umum Proyek](#1-gambaran-umum-proyek)
2. [Sumber Data BPS](#2-sumber-data-bps)
3. [Pra-Pemrosesan Data](#3-pra-pemrosesan-data)
4. [Variabel Analisis (10 Variabel Numerik)](#4-variabel-analisis)
5. [Pengkategorian Fiskal](#5-pengkategorian-fiskal)
6. [Analisis PCA (Reduksi Dimensi)](#6-analisis-pca)
7. [Klasterisasi K-Means (k=4)](#7-klasterisasi-k-means)
8. [Autokorelasi Spasial - Moran's I](#8-moran-i)
9. [Topik Visualisasi yang Diimplementasikan](#9-topik-visualisasi)
10. [Pemenuhan Ketentuan Minimal Soal](#10-pemenuhan-ketentuan-minimal)
11. [Sistem Filter & Interaktivitas](#11-sistem-filter--interaktivitas)
12. [Enkoding Visual & Palet Warna](#12-enkoding-visual--palet-warna)
13. [Gap Analysis - Kesesuaian dengan Soal](#13-gap-analysis)
14. [Checklist Final Sebelum UAS](#14-checklist-final)

---

## 1. Gambaran Umum Proyek

Dashboard **"Ilusi Otonomi Fiskal Daerah"** adalah data story berbasis web yang menganalisis neraca APBD 508 kabupaten/kota di 37 provinsi Indonesia untuk tahun anggaran 2024 (realisasi audit) dan 2025 (plafon APBD murni).

**Narrative arc (5 seksi):**

| # | Seksi | Pertanyaan Utama | Visualisasi |
|---|-------|------------------|-------------|
| 01 | Peta Spasial | Di mana ketimpangan fiskal terkonsentrasi? | Choropleth + Proportional Symbol + Cluster Map |
| 02 | Tipologi PCA+K-Means | Apa profil struktural di balik angka tunggal? | Scatter PCA, Biplot, Radar, Parallel Coord, Heatmap |
| 03 | Hierarki Treemap | Berapa jiwa yang terdampak per daerah? | Treemap + Sunburst (3 level hierarki) |
| 04 | Pergeseran APBD | Apakah prioritas belanja berubah 2024 ke 2025? | Bar chart komparasi + Delta cards |
| 05 | Metodologi | Seberapa valid basis statistiknya? | KMO, Variance Explained, Missing data |

---

## 2. Sumber Data BPS

| # | Dataset | Tahun | URL | Akses |
|---|---------|-------|-----|-------|
| [1] | Statistik Keuangan Pemerintah Kab/Kota 2024 & 2025 | 2024-2025 | bps.go.id/.../financial-statistics-of-regency-municipality-government-2024-and-2025 | 24 Sep 2026 |
| [2] | Indeks Pembangunan Manusia (IPM) Kab/Kota | 2024 | bps.go.id/.../indeks-pembangunan-manusia | 24 Sep 2026 |
| [3] | Persentase Penduduk Miskin P0 Kab/Kota | Maret 2024 | bps.go.id/.../persentase-penduduk-miskin | 24 Sep 2026 |
| [4] | PDRB ADHB Kab/Kota (per kapita) | 2024 | bps.go.id/.../pdrb-triwulanan | 24 Sep 2026 |
| [5] | Proyeksi Penduduk Kab/Kota | 2024 | bps.go.id | 24 Sep 2026 |
| Pendukung | Batas Wilayah Digital GeoJSON | 2024 | BIG/Kemendagri via geoportal | 24 Sep 2026 |

> Seluruh data utama bersumber dari BPS sesuai ketentuan Soal No. 2.
> Data pendukung non-BPS (batas wilayah digital) diizinkan per Soal 2a.

---

## 3. Pra-Pemrosesan Data

### 3.1 Pipeline Pembersihan Data

```
Input:  508 kab/kota x ~30 kolom mentah dari BPS (5 tabel terpisah)
Output: kabkota_master_final.json (508 record, field terstandarisasi)
```

**Langkah-langkah:**

**1. Penggabungan (Join)**
Data keuangan daerah digabung dengan IPM, P0 kemiskinan, PDRB, dan penduduk menggunakan **kode wilayah BPS** sebagai kunci penggabungan (format: KODE_PROV + KODE_KAB_KOTA).

**2. Normalisasi nama daerah**
Penyeragaman penulisan nama daerah untuk join dengan GeoJSON (mis. "Kab. Bogor" -> "BOGOR" sesuai format GeoJSON BIG/Kemendagri).

**3. Penanganan missing values**
2 daerah memiliki data keuangan tidak lengkap:
- Kab. Barito Utara (Kalimantan Tengah)
- Kab. Pegunungan Bintang (Papua Pegunungan)

Penanganan: dikecualikan dari PCA dan K-Means, tetapi **tetap ditampilkan di peta** (sebagai polygon tanpa data kuantitatif).

**4. Derivasi variabel rasio keuangan (berdasarkan Mahmudi, 2019)**

| Rasio | Formula |
|-------|---------|
| Kemandirian Fiskal | Realisasi PAD / Realisasi Pendapatan Transfer x 100% |
| Derajat Desentralisasi | Realisasi PAD / Realisasi Pendapatan x 100% |
| Rasio Penerimaan Pajak | Realisasi Penerimaan Pajak / Realisasi Pendapatan x 100% |
| Efektivitas PAD | Realisasi PAD / Anggaran PAD x 100% |
| Belanja Operasi | Belanja Operasi / Total Belanja x 100% |
| Belanja Modal | Belanja Modal / Total Belanja x 100% |

**5. PDRB per kapita**
PDRB ADHB (Rp) dibagi proyeksi penduduk 2024.

**6. Pengkategorian desentralisasi**
Berdasarkan Kepmendagri No. 690.900.327/1996 (lihat Seksi 5).

### 3.2 Pra-Pemrosesan GeoJSON

- Sumber: BIG/Kemendagri format GeoJSON (~508 fitur polygon/multipolygon)
- **Simplifikasi topologi** (Douglas-Peucker): ukuran file ~15 MB -> ~4 MB
- Centroid poligon dihitung dengan **formula shoelace** untuk mode Proportional Symbol
- Registrasi ke ECharts: `echarts.registerMap('indonesia', geo)`

---

## 4. Variabel Analisis

9 variabel numerik digunakan dalam PCA dan K-Means (memenuhi syarat minimum 8 variabel soal):

| # | Variabel (JSON key) | Satuan | Deskripsi |
|---|---------------------|--------|-----------|
| 1 | `kemandirian_2024_persen` | % | PAD / Pendapatan Transfer |
| 2 | `derajat_desentralisasi_2024_persen` | % | PAD / Total Pendapatan (Tingkat otonomi) |
| 3 | `rasio_pajak_2024_persen` | % | Penerimaan Pajak / Total Pendapatan |
| 4 | `rasio_efektivitas_pad_2024_persen` | % | Realisasi PAD / Anggaran PAD |
| 5 | `belanja_operasi_2024_persen` | % | Belanja operasi / Total belanja |
| 6 | `belanja_modal_2024_persen` | % | Belanja modal / Total belanja |
| 7 | `ipm_2024` | indeks | Indeks Pembangunan Manusia |
| 8 | `persen_miskin_p0_2024` | % | Persentase penduduk miskin |
| 9 | `pdrb_per_kapita_rupiah` | Rp | PDRB ADHB / jumlah penduduk |

Variabel tambahan (bukan untuk PCA, tetapi digunakan di treemap):
- `penduduk_2024` (jiwa) - digunakan sebagai ukuran kotak treemap

> **n observasi untuk PCA/K-Means:** 506 daerah (508 minus 2 pencilan missing).
> Memenuhi syarat minimum 34 unit observasi dan 8 variabel numerik.

---

## 5. Pengkategorian Fiskal

### 5.1 Dasar Hukum

Pengkategorian menggunakan **Kepmendagri No. 690.900.327 Tahun 1996** dan literatur fiskal daerah Indonesia (Tim Litbang Depdagri - Fisipol UGM, 1991):

| Rasio Kemandirian | Kategori | Pola Hubungan Keuangan |
|-------------------|----------|------------------------|
| 0% - 10% | Sangat Kurang | Instruktif (pusat sangat dominan) |
| 10% - 20% | Kurang Mandiri | Konsultatif |
| 20% - 30% | Sedang | Partisipatif |
| 30% - 40% | Cukup Mandiri | Delegatif |
| > 40% | Sangat Baik / Mandiri | Delegatif penuh |

### 5.2 Catatan Outlier (Rasio >100%)

7 daerah memiliki rasio kemandirian di atas 100% (tertinggi: Kab. Badung ~674,98%). Penyebab: PAD melebihi total pendapatan karena perbedaan pencatatan komponen SiLPA (Sisa Lebih Pembiayaan Anggaran) dalam struktur APBD. Daerah ini **tetap ditampilkan** di visualisasi tetapi perlu dibaca sebagai **outlier encoding**, bukan indikator "lebih dari mandiri".

### 5.3 Distribusi Kategori (508 daerah, data 2024)

| Kategori | Jumlah | Persentase |
|----------|--------|-----------|
| Sangat Kurang (<10%) | ~207 | ~40,7% |
| Kurang Mandiri (10-20%) | ~152 | ~29,9% |
| Sedang (20-30%) | ~65 | ~12,8% |
| Cukup Mandiri (30-40%) | ~30 | ~5,9% |
| Sangat Baik (>40%) | ~54 | ~10,6% |

**Temuan utama:** 40,7% daerah Indonesia masih di kategori "Sangat Kurang" - sepenuhnya bergantung pada transfer pusat (Dana Alokasi Umum dan Dana Alokasi Khusus).

---

## 6. Analisis PCA

### 6.1 Tujuan

Mereduksi 9 variabel fiskal-sosial menjadi 2 komponen utama (PC1, PC2) yang mempertahankan variasi terbesar, sebagai basis scatter plot 2D dan landasan interpretasi klaster K-Means.

### 6.2 Validasi Kelayakan

| Uji Statistik | Nilai | Interpretasi |
|---------------|-------|--------------|
| **Kaiser-Meyer-Olkin (KMO)** | **0,54** | >= 0,50 -> Layak faktorisasi (acceptable) |
| **Bartlett's Test of Sphericity** | p < 0,001 | Korelasi antar variabel signifikan -> PCA valid |

> KMO = 0,54 berada di atas batas minimum 0,50 (Hutcheson & Sofroniou, 1999). Nilai ini menunjukkan korelasi parsial antar variabel cukup kecil relatif terhadap korelasi total, sehingga PCA layak diterapkan meski tidak ideal (nilai >= 0,7 lebih direkomendasikan untuk analisis faktor).

### 6.3 Hasil Komponen Utama

| Komponen | % Variance | % Kumulatif | Interpretasi Dominan |
|----------|------------|-------------|----------------------|
| **PC1** | ~35,6% | 35,6% | Kapasitas fiskal & pembangunan manusia |
| **PC2** | ~25,5% | **61,14%** | Orientasi belanja (modal vs operasi) |
| PC3 | ~12,2% | 73,4% | - |

**Interpretasi PC1 (sumbu horizontal scatter):**
Berkorelasi positif dengan `kemandirian`, `desentralisasi`, `IPM`, `PDRB/kapita`.
-> Semakin kanan posisi daerah di scatter, semakin mandiri dan sejahtera.

**Interpretasi PC2 (sumbu vertikal scatter):**
Berkorelasi positif dengan `belanja_modal`, negatif dengan `p0_miskin`.
-> Semakin atas posisi daerah, semakin berorientasi investasi modal (bukan konsumsi operasional).

### 6.4 Lima Tampilan Visualisasi PCA

| Tampilan | Deskripsi Teknis |
|---------|-----------------|
| **Scatter PCA** | Titik = 506 daerah di ruang (PC1, PC2); warna = klaster K-Means; brush & link ke peta |
| **Biplot** | Scatter + vektor loading variabel (arah = kontribusi, panjang = bobot) |
| **Radar Chart** | Profil rata-rata per klaster pada 9 variabel (dinormalisasi 0-1 min-max) |
| **Parallel Coordinates** | Semua 506 daerah sebagai garis; tiap sumbu = 1 variabel; warna per klaster |
| **Heatmap Klaster** | Matriks 4 klaster x 9 variabel; nilai = rata-rata standardisasi z-score |

---

## 7. Klasterisasi K-Means

### 7.1 Metodologi

- **Algoritma:** K-Means (Lloyd's algorithm)
- **k = 4** (ditentukan berdasarkan elbow method + interpretabilitas domain)
- **Input:** Koordinat PC1 dan PC2 dari 506 daerah
- **Preprocessing:** Standardisasi variabel sebelum PCA (z-score: mean=0, std=1)
- **Implementasi:** Python `sklearn.cluster.KMeans` dengan `random_state=42`
- **Output:** Label klaster (0-3) disimpan sebagai field `cluster` di JSON

### 7.2 Profil 4 Klaster

| Klaster | Nama | n | Kemandirian Avg | IPM Avg | Karakter Utama |
|---------|------|---|-----------------|---------|----------------|
| **K0** | Metropolitan Mandiri | 83 | **53,96%** | 80,02 | Kota besar, PAD tinggi, layanan maju |
| **K1** | Tertinggal & Bergantung | 32 | **6,88%** | ~62 | Daerah terpencil, P0 tinggi, transfer dominan |
| **K2** | Berkembang / Transisi | 325 | **13,24%** | ~70 | Mayoritas daerah Indonesia; blj. ops 71,12% |
| **K3** | Akselerasi Belanja Modal | 66 | **9,69%** | ~68 | PDRB/kapita tinggi (SDA); blj. modal 29,51% |

### 7.3 Interpretasi Klaster

**K0 - Metropolitan Mandiri (83 daerah):**
Mencakup kota-kota besar seperti Jakarta, Surabaya, Bandung, Medan. PAD tinggi dari pajak daerah (hotel, restoran, kendaraan bermotor). IPM rata-rata 80,02 - tertinggi di antara semua klaster.

**K1 - Tertinggal & Bergantung (32 daerah):**
Mayoritas di Papua, Maluku, dan NTT. Kemandirian hanya 6,88% - hampir sepenuhnya bergantung pada DAU dan DAK pusat. Tingkat kemiskinan P0 rata-rata 18,76%.

**K2 - Berkembang / Transisi (325 daerah = 64,2% total):**
Kelompok terbesar - mencerminkan "rata-rata Indonesia". Kemandirian 13,24%, belanja operasi mendominasi (71,12%). Daerah ini ada di fase stagnasi: cukup mapan tapi belum mandiri.

**K3 - Akselerasi Belanja Modal / Paradoks SDA (66 daerah):**
Paradoks utama: PDRB/kapita tinggi (kaya SDA: tambang, migas, perkebunan) tetapi kemandirian fiskal hanya 9,69%. Ini karena kekayaan SDA tidak menghasilkan PAD lokal yang proporsional - pendapatan lebih besar dari dana bagi hasil (DBH) pusat, bukan pajak daerah. Belanja modal 29,51% - lebih tinggi dari K2 - menunjukkan prioritas investasi infrastruktur.

### 7.4 2 Pencilan Tanpa Klaster

- **Kab. Barito Utara** (Kalimantan Tengah): data keuangan 2024 tidak lengkap
- **Kab. Pegunungan Bintang** (Papua Pegunungan): data keuangan 2024 tidak lengkap

Kedua daerah ini muncul di peta tetapi tidak memiliki titik di scatter PCA.

---

## 8. Moran's I

### 8.1 Definisi dan Formula

**Moran's I** adalah statistik autokorelasi spasial global yang mengukur apakah nilai suatu variabel di suatu lokasi berkorelasi dengan nilai di lokasi-lokasi tetangganya.

```
         n     sum_i sum_j [w_ij * (y_i - y_mean) * (y_j - y_mean)]
I = --------- * -------------------------------------------------------
    sum_i sum_j w_ij         sum_i (y_i - y_mean)^2
```

Di mana:
- `n` = jumlah unit spasial (508 kab/kota)
- `w_ij` = bobot spasial (1 jika i dan j bertetangga, 0 jika tidak - matriks contiguity)
- `y_i` = nilai kemandirian fiskal daerah ke-i
- `y_mean` = rata-rata kemandirian fiskal nasional (19,0%)

### 8.2 Interpretasi Nilai

| Nilai I | Interpretasi |
|---------|--------------|
| I = 0 | Distribusi spasial acak (tidak ada pola) |
| I > 0 (positif) | Daerah dengan nilai serupa berkelompok (spatial clustering) |
| I < 0 (negatif) | Daerah dengan nilai berbeda berdekatan (spatial dispersal) |
| I = +0,39 | **Autokorelasi spasial positif sedang-kuat** |

### 8.3 Hasil dan Temuan

**Moran's I = +0,39** untuk variabel kemandirian fiskal 508 kab/kota Indonesia.

**Implikasi:**
1. Ketimpangan fiskal bukan fenomena acak melainkan terpola secara geografis
2. Daerah mandiri cenderung bertetangga dengan daerah mandiri (klaster Jawa-Bali)
3. Daerah bergantung transfer cenderung berkumpul (klaster Papua, Maluku, NTT)
4. Pola ini mencerminkan warisan pembangunan historis dan ketimpangan infrastruktur
5. Kebijakan pembangunan berbasis kewilayahan (bukan per-daerah) lebih efektif

### 8.4 Implementasi Teknis

- Dihitung di Python menggunakan `pysal.esda.Moran` sebelum data dimasukkan ke dashboard
- Moran's I global (+0,39) ditampilkan sebagai insight card di Seksi 01
- **Local Moran's I (LISA)** dihitung secara dinamis di klien (`app.js`) menggunakan matriks bobot spasial KNN (k=6) dari centroid daerah.
- Karena distribusi kemandirian fiskal sangat *right-skewed*, ambang batas signifikansi (*threshold*) LISA diatur secara dinamis berbasis persentil standar deviasi *Local Moran's I*, dengan relaksasi khusus (nilai z < -0.1 dan lag < -0.1) untuk mendeteksi klaster *Low-Low* yang secara artifisial teredam oleh kecilnya nilai *z-score* negatif pada data menceng.
- Mode peta LISA mengklasifikasikan daerah menjadi 5 tipe:
  - **HH (High-High):** Klaster kemandirian tinggi (warna merah).
  - **LL (Low-Low):** Klaster rentan/bergantung (warna biru).
  - **HL / LH:** Outlier spasial (oranye / biru muda).
  - **NS:** Tidak signifikan secara spasial.

---

## 9. Topik Visualisasi yang Diimplementasikan

Soal mensyaratkan minimal 3 dari 6 topik. Proyek mengimplementasikan **3 topik** berikut:

---

### TOPIK A: Data Berdimensi Tinggi (Multivariat)

**Pemenuhan ketentuan minimal:**

| Syarat | Ketentuan | Implementasi | Status |
|--------|-----------|-------------|--------|
| Variabel numerik | >= 8 | 9 variabel | TERPENUHI |
| Unit observasi | >= 34 | 506 daerah | TERPENUHI |
| Reduksi dimensi | 1 teknik (PCA/MDS/t-SNE/UMAP) | PCA (61,14% variance, 2 komponen) | TERPENUHI |
| Teknik lain | >= 2 dari: parallel coord, scatterplot matrix, heatmap terklaster, biplot, radar | Biplot + Radar + Parallel Coord + Heatmap (4 teknik) | TERPENUHI |
| Brushing & linking | Antar tampilan | Brush scatter -> peta + treemap diperbarui | TERPENUHI |
| Interpretasi kelompok | Deskripsi kualitatif | 4 klaster dengan profil lengkap | TERPENUHI |
| Interpretasi pencilan | Identifikasi + penjelasan | Barito Utara, Pegunungan Bintang, Badung >100% | TERPENUHI |

---

### TOPIK C: Data Berhierarki

**Pemenuhan ketentuan minimal:**

| Syarat | Ketentuan | Implementasi | Status |
|--------|-----------|-------------|--------|
| Level hierarki | >= 3 | Nasional (1) -> Provinsi (37) -> Kab/Kota (508) | TERPENUHI |
| Representasi berbeda | >= 2 dari: treemap, sunburst, icicle, circle packing, collapsible tree, dendrogram | Treemap + Sunburst | TERPENUHI |
| Dua variabel di-encode | Ukuran & warna berbeda | Ukuran = penduduk 2024; Warna = % kemandirian | TERPENUHI |
| Drill-down + breadcrumb | Zoom + penunjuk posisi | Klik provinsi -> drill-down; breadcrumb "Indonesia > Jawa Timur > ..." | TERPENUHI |

---

### TOPIK E: Data Geospasial

**Pemenuhan ketentuan minimal:**

| Syarat | Ketentuan | Implementasi | Status |
|--------|-----------|-------------|--------|
| Level kab/kota | ~500 unit | 508 kab/kota | TERPENUHI |
| Jenis peta berbeda | >= 2 dari: choropleth, proportional symbol, cartogram, hexbin, dot density | Choropleth + Proportional Symbol + Cluster Map (3 jenis) | TERPENUHI |
| Justifikasi klasifikasi | Metode & palet warna dijelaskan | Kepmendagri 1996; choropleth pakai rasio (%), bukan absolut | TERPENUHI |
| Tooltip | Tampil saat hover | Nama, kemandirian, IPM, klaster, penduduk | TERPENUHI |
| Legenda | Jelas | Color scale + label klaster | TERPENUHI |
| Zoom/pan | Kontrol navigasi | ECharts roam + scaleLimit | TERPENUHI |
| Kontrol layer | Ganti tampilan | Tombol Gradasi / Klaster / Simbol | TERPENUHI |
| Moran's I (opsional) | Autokorelasi spasial | Moran's I = +0,39 | BONUS |

---

## 10. Pemenuhan Ketentuan Minimal Soal

### Soal No. 4a - Interaksi Bermakna

| Jenis Interaksi | Implementasi |
|-----------------|-------------|
| **Tooltip** | Peta: nama+kemandirian+IPM+klaster; Scatter: nama+PC1+PC2+klaster; Treemap: nama+penduduk+kemandirian |
| **Filter** | 5 dimensi filter: jenis daerah, provinsi, klaster, range kemandirian, kategori desentralisasi |
| **Highlight** | Brushing scatter -> highlight peta (daerah di luar brush transparan) |
| **Zoom** | Peta: ECharts roam dengan scaleLimit; Treemap: drill-down via klik |
| **Drill-down** | Treemap: Nasional -> Provinsi -> Kab/Kota dengan breadcrumb |
| **Klik & Link** | Klik daerah di peta -> shift chart (Seksi 04) diperbarui otomatis |

### Soal No. 4b - Kejelasan Encoding

| Elemen | Implementasi |
|--------|-------------|
| Judul | Setiap seksi punya h2 yang jelas |
| Legenda | Color scale + label klaster di setiap chart |
| Satuan | %, Rp, indeks - ditampilkan di tooltip dan sumbu |
| Sumber data | Source bar di bawah setiap chart dengan detail URL + tanggal akses |
| Encoding dijelaskan | Panel guide di Seksi 01; label variabel di biplot dan radar |

### Soal No. 4c - Aksesibilitas Visual

| Syarat | Implementasi |
|--------|-------------|
| Palet ramah buta warna | Paul Tol's qualitative palette (K0-K3); 4 pilihan sequential palette |
| Tampilan laptop | Layout 2-3 kolom, chart full-width, sidebar filter |
| Tampilan ponsel | Mobile hamburger nav, chart height adaptive (300-560px), padding responsif |

---

## 11. Sistem Filter & Interaktivitas

### 11.1 Filter Sidebar (5 Dimensi)

| Filter | Jenis UI | Opsi |
|--------|----------|------|
| Jenis Daerah | Toggle pills (3 pilihan) | Semua / Kabupaten / Kota |
| Provinsi | Dropdown select | 37 provinsi + ALL |
| Tipologi Klaster | Checkbox multi-select | ALL / K0 / K1 / K2 / K3 |
| Range Kemandirian | Dual input number slider | 0% - ~700% (batas atas dinamis) |
| Kategori Desentralisasi | Dropdown select | ALL / 5 kategori Kepmendagri |

### 11.2 Alur Brushing & Linking

```
Aksi: Seret area (brush) di Scatter PCA
  |
  v
State.brushedKeys = Set(key daerah dalam area seleksi)
  |
  +-> Peta Choropleth: daerah di luar brush -> opacity 0.12 (transparan)
  |
  +-> Treemap: hanya daerah terpilih yang tampil penuh
  |
  +-> Brush bar: muncul di atas konten menampilkan jumlah + ringkasan
```

### 11.3 Alur Klik Peta -> Shift Chart

```
Aksi: Klik polygon daerah di peta
  |
  v
State.selectedRegion = {nama, kemandirian, klaster, ...}
State.shiftScope = 'REGION'
  |
  v
Seksi 04 (Pergeseran APBD) diperbarui:
  - Bar chart: komparasi APBD 2024 vs 2025 untuk daerah tersebut
  - Delta cards: selisih persentase per pos belanja
  - Judul diperbarui: "Pergeseran APBD: [Nama Daerah]"
```

### 11.4 Interaktivitas Tambahan

| Fitur | Detail |
|-------|--------|
| Reset All | Reset semua filter, brush, selection ke default |
| Zoom Peta | scaleLimit: {min:1.0, max:12} - zoom-out dikunci |
| Pan Treemap | roam:'move' - hanya geser, tidak bisa zoom-out |
| Toggle View PCA | Scatter / Biplot / Radar / Parallel / Heatmap |
| Toggle View Treemap | Treemap / Sunburst |
| Toggle Map Mode | Gradasi / Klaster / Simbol |
| Mobile Nav | Hamburger menu dengan 5 link + Reset |

---

## 12. Enkoding Visual & Palet Warna

### 12.1 4 Pilihan Palet Sequential (Choropleth)

| Nama | Warna | Cocok untuk |
|------|-------|-------------|
| **Viridis** (default) | ungu -> biru -> hijau -> kuning | Buta warna, cetak B&W |
| **Cividis** | navy -> coklat -> kuning | Deuteranopia (merah-hijau) |
| **Teal-Amber** | teal gelap -> kuning -> oranye | Kontras tinggi warm mode |
| **Terracotta** | krim -> merah bata | Selaras tema warm-sand |

### 12.2 Palet Klaster (Paul Tol's Colorblind-Safe)

| Klaster | Warna | Hex | Aman untuk |
|---------|-------|-----|------------|
| K0 Metropolitan | Biru | #0077BB | Semua tipe buta warna |
| K1 Tertinggal | Oranye | #EE7733 | Deuteranopia, Protanopia |
| K2 Berkembang | Merah-ungu | #AA3377 | Deuteranopia |
| K3 Akselerasi | Teal | #009988 | Protanopia |

### 12.3 Mapping Enkoding per Visualisasi

| Chart | Posisi (x,y) | Warna | Ukuran | Bentuk |
|-------|-------------|-------|--------|--------|
| Choropleth | Geografis | % Kemandirian (sequential) | - | Polygon wilayah |
| Proportional Symbol | Centroid wilayah | % Kemandirian | Prop. sqrt(penduduk) | Lingkaran |
| Cluster Map | Geografis | Klaster (kategoris) | - | Polygon wilayah |
| Scatter PCA | PC1 (x), PC2 (y) | Klaster K-Means | Tetap | Titik |
| Biplot | PC1 (x), PC2 (y) | Klaster/variabel | Tetap/panjang vektor | Titik + panah |
| Treemap | Hierarki layout | % Kemandirian (sequential) | Prop. penduduk | Persegi panjang |
| Sunburst | Hierarki radial | % Kemandirian | Prop. penduduk | Sektor |
| Bar Shift | Kategori belanja | 2024=biru, 2025=teal | % APBD | Bar grouped |

---

## 13. Gap Analysis

### TERPENUHI

| Persyaratan | Detail |
|-------------|--------|
| >= 3 topik visualisasi | 3 topik: Multivariat (A), Hierarki (C), Geospasial (E) |
| Data utama BPS, sumber jelas | 5 dataset BPS + source bar setiap seksi + Seksi 05 referensi |
| >= 1 interaksi bermakna | Tooltip, filter 5D, brush & link, drill-down, klik-link antar chart |
| Palet ramah buta warna | Paul Tol's palette klaster; 4 pilihan sequential; diuji deuteranopia |
| Tampilan responsif laptop & ponsel | Mobile nav hamburger, adaptive chart heights, responsive grid |
| Validasi PCA | KMO 0,54 > 0,50; Bartlett p<0,001; 61,14% variance oleh 2 komponen |
| Interpretasi klaster | 4 klaster dengan narasi kualitatif dan angka statistik |
| Interpretasi pencilan | Barito Utara, Pegunungan Bintang (missing); Badung >100% (outlier encoding) |
| Brushing & linking | Scatter PCA -> Peta + Treemap |
| Drill-down + breadcrumb | Treemap 3 level + breadcrumb dinamis |
| >= 2 jenis peta | Choropleth + Proportional Symbol + Cluster Map + LISA (4 jenis) |
| >= 2 representasi hierarki | Treemap + Sunburst |
| Sumber pada setiap visualisasi | Source bar "Sumber: BPS" di bawah setiap chart |
| LISA (Local Moran's I) | Peta HH/LL/HL/LH mengidentifikasi klaster spasial lokal (poin kreativitas tinggi) |

### PERLU TINDAKAN SEBELUM UAS

| Item | Status | Tindakan |
|------|--------|----------|
| **Deployment publik** | BELUM | Deploy ke GitHub Pages atau Netlify; URL harus aktif sampai nilai keluar |
| **Repositori GitHub publik** | BELUM | Buat repo public; sertakan kode, data JSON, GeoJSON, dan README |
| **README.md di repo** | BELUM | Cantumkan: URL live, deskripsi proyek, cara menjalankan lokal, sumber data |
| **Makalah IEEE** | BELUM | 6-8 halaman, 2 kolom, >= 10 referensi (>= 3 jurnal internasional) |
| **Referensi jurnal internasional** | BELUM | Cari paper tentang: fiscal decentralization visualization, PCA fiscal analysis, spatial autocorrelation Indonesia |
| **Deklarasi AI** | BELUM | Cantumkan di bagian Metodologi makalah bahwa AI digunakan sebagai alat bantu |
| **Upload PDF** | BELUM | Upload ke https://s.stis.ac.id/UAS-Visdat-2026 sebelum sesi ujian |

### BISA DITINGKATKAN (Opsional)

| Item | Keterangan |
|------|------------|
| Kode preprocessing Python | Lampirkan di repo untuk dokumentasi reproduktibilitas |
| Elbow method chart | Tampilkan justifikasi k=4 secara visual |
| Confidence interval | Tambahkan error bar pada radar chart klaster |

### TIDAK DIPILIH (3 Topik Lain)

| Topik | Alasan Tidak Dipilih |
|-------|---------------------|
| Data Berjaring (B) | Butuh >= 30 node, force-directed graph, tidak relevan dengan tema fiskal daerah |
| Data Teks (D) | Butuh >= 100 dokumen, word cloud, TF-IDF - tidak ada corpus teks dalam dataset |
| Data Aliran/Pergerakan (F) | Butuh Sankey/chord, data migrasi/perdagangan - berbeda tema |

---

## 14. Checklist Final Sebelum UAS

**Senin, 5 Oktober 2026 | 13:30-15:30**

### Teknis Proyek
- [ ] Deploy dashboard ke URL publik (GitHub Pages / Netlify / Vercel)
- [ ] Pastikan URL dapat diakses tanpa login dari laptop maupun ponsel
- [ ] Buat repositori GitHub **public** dengan:
  - [ ] `index.html`, `app.js`, semua asset
  - [ ] `kabkota_master_final.json`
  - [ ] `kabkota_simplified.geojson`
  - [ ] `README.md` (URL live + deskripsi + cara jalankan)
- [ ] Test responsivitas di browser mobile (Chrome DevTools device emulation)

### Makalah IEEE
- [ ] Selesaikan makalah 6-8 halaman, 2 kolom (template IEEE)
- [ ] Abstrak maksimal 200 kata + kata kunci
- [ ] Minimal 10 referensi (>= 3 jurnal/konferensi internasional)
- [ ] Cantumkan URL proyek dan URL repositori setelah Kesimpulan
- [ ] Deklarasikan penggunaan AI di bagian Metodologi
- [ ] Sitasi menggunakan gaya IEEE (nomor dalam kurung siku [1])

### Pengumpulan
- [ ] Upload PDF makalah ke https://s.stis.ac.id/UAS-Visdat-2026
- [ ] Cetak hardcopy makalah untuk diserahkan ke BAAK
- [ ] Tandatangani bukti kehadiran ujian

---

*Dokumen ini dibuat sebagai referensi teknis internal untuk keperluan makalah IEEE dan demonstrasi proyek.*
*Terakhir diperbarui: 3 Oktober 2026*
