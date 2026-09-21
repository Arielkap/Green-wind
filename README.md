# 🌀 WindPro • Pogoda & Profil Wiatru Huba i Dźwigu

Nowoczesna aplikacja webowa w stylu **Apple iOS 18 (Dark Glassmorphism)** zaprojektowana specjalnie dla **techników turbin wiatrowych, inżynierów O&M oraz operatorów żurawi/dźwigów** pracujących na farmach wiatrowych (onshore & offshore).

Wykorzystuje modele meteorologiczne o wysokiej rozdzielczości **Open-Meteo AGL & ECMWF** oraz automatyczną geolokalizację kaskadową (Cache ➔ IP ➔ Precyzyjny GPS).

---

## ⚡ Kluczowe Funkcje dla Sektora Energetyki Wiatrowej & Dźwigów

### 1. 🏗️ Wiatr na Wysokościach Huba i Dźwigu
* **160m (Szczyt wysięgnika dźwigu / Boom Tip):** Wiatr i porywy w strefie najwyższego punktu wysięgnika żurawia i rotora.
* **140m (Główny Hub / Hak dźwigu):** Główny punkt referencyjny prędkości wiatru na wysokości gondoli i pracy haka.
* **120m (Niższy Hub / Dźwig):** Odczyt dla niższych wież wiatrowych i sekcji montażowych.
* **10m (Baza dźwigu / Grunt):** Wiatr przygruntowy na stanowisku żurawia.
* **Gradient Wiatru (Wind Shear $\Delta v$):** Różnica prędkości między bazą a hubem (140m) – kluczowy wskaźnik kołysania zawieszonego ładunku.

### 2. 🚨 Wskaźnik Bezpieczeństwa Operacji Dźwigowych (Crane Lift Safety)
* 🟢 **WARUNKI W NORMIE (LIFTING DOZWOLONY):** Średnia 10-minutowa na hubie/haku (140m) < 10.5 m/s i porywy < 15.5 m/s.
* 🟡 **OSTRZEŻENIE / WARUNKI KRAŃCOWE:** Wiatr zbliża się do limitów (10.5 – 12.0 m/s avg 10-min lub 15.5 – 18.0 m/s w porywach).
* 🔴 **CRANE STOP / ZAKAZ PODNOSZENIA:** Średnia 10-min > 12.0 m/s LUB porywy > 18.0 m/s – natychmiastowe wstrzymanie prac dźwigowych.

### 3. ⏱️ 24-godzinny Timeline & 7-Dniowa Prognoza
* Wybór wysokości (**Hub 140m**, **Dźwig 160m**, **Hub 120m**, **Baza 10m**) automatycznie przelicza zarówno prognozę godzinową na 24h, jak i pełną prognozę na 7 dni.

### 5. 🔄 Przełącznik Jednostek (m/s ⟷ km/h)
* Jeden klik na górnym pasku przełącza całą telemetrię aplikacji pomiędzy standardem inżynierskim **m/s** a **km/h**.

### 6. 📱 Apple iOS 18 Design Language
* Matowe szkło (*Frosted Glassmorphism*), subtelne obramowania, typografia SF Pro / Plus Jakarta Sans.
* Zoptymalizowane pod kątem ekranów smartfonów (iPhone / Android) oraz tabletów i komputerów w dyspozytorni.

---

## 🚀 Uruchomienie lokalne

1. Otwórz terminal w folderze projektu:
   ```bash
   python3 run.py
   ```
2. Skrypt uruchomi lokalny serwer i otworzy aplikację w przeglądarce pod adresem `http://localhost:8000`.

---
*Bezpiecznych podnoszeń i stabilnych wiatrów na wysokości gondoli! 🌀*
