# Tokenization System - Setup Guide

## 📋 Overview

Dieses System ermöglicht es Usern, Tokenisierungsprozesse zu starten, abzubrechen und später fortzusetzen. Alle Daten werden in Supabase gespeichert mit user-spezifischen Storage Buckets.

## 🗄️ Datenbank Setup

### 1. SQL Migration ausführen

Öffne Supabase Dashboard → SQL Editor und führe die Datei aus:
```
supabase-tokenization-migration.sql
```

Diese erstellt:
- ✅ `tokenization_drafts` Tabelle mit allen Feldern
- ✅ Indexes für Performance
- ✅ RLS Policies für Security
- ✅ Helper Views
- ✅ Trigger für auto-update timestamps

### 2. Storage Buckets erstellen

Gehe zu: **Supabase Dashboard → Storage → Create new bucket**

#### Bucket 1: tokenization-images
- **Name:** `tokenization-images`
- **Public:** ✅ Yes (damit Bilder angezeigt werden können)
- **File size limit:** 10 MB
- **Allowed MIME types:**
  - `image/png`
  - `image/jpeg`
  - `image/jpg`
  - `image/svg+xml`
  - `image/webp`

#### Bucket 2: tokenization-documents
- **Name:** `tokenization-documents`
- **Public:** ❌ No (privat, nur mit Auth)
- **File size limit:** 50 MB
- **Allowed MIME types:**
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### 3. Storage Policies einrichten

Gehe zu: **Storage → Policies** und füge folgende Policies hinzu:

#### Für tokenization-images:

**SELECT Policy:**
```sql
CREATE POLICY "Users can read their own tokenization images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tokenization-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**INSERT Policy:**
```sql
CREATE POLICY "Users can upload their own tokenization images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tokenization-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**UPDATE Policy:**
```sql
CREATE POLICY "Users can update their own tokenization images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tokenization-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**DELETE Policy:**
```sql
CREATE POLICY "Users can delete their own tokenization images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tokenization-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Für tokenization-documents:

**SELECT Policy (User):**
```sql
CREATE POLICY "Users can read their own tokenization documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tokenization-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**SELECT Policy (Admin):**
```sql
CREATE POLICY "Admins can read all tokenization documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tokenization-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  )
);
```

**INSERT Policy:**
```sql
CREATE POLICY "Users can upload their own tokenization documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tokenization-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## 📁 File Structure

```
src/
├── services/
│   └── tokenizationService.ts         # Alle DB & Storage Operationen
├── components/
│   └── Landingpagenew/
│       ├── TokenizeAssetFlow.jsx      # Haupt-Tokenisierungs-Flow
│       ├── TokenizationDraftCard.jsx  # Draft Card Komponente
│       └── tokenized-assets-glassmorphic.jsx  # Dashboard
└── types/
    └── supabase.ts                    # TypeScript Types
```

## 🚀 Integration in Dashboard

### 1. Import der Services und Components

```jsx
import { getUserDrafts, deleteDraft, loadDraft } from '../../services/tokenizationService';
import TokenizationDraftCard from './TokenizationDraftCard';
```

### 2. Drafts laden und anzeigen

```jsx
// In tokenized-assets-glassmorphic.jsx

const [drafts, setDrafts] = useState([]);
const [selectedDraft, setSelectedDraft] = useState(null);

useEffect(() => {
  loadUserDrafts();
}, []);

const loadUserDrafts = async () => {
  const userId = 'current-user-id'; // Von Auth holen
  const result = await getUserDrafts(userId);
  if (result.success) {
    setDrafts(result.drafts);
  }
};

const handleContinueDraft = async (draft) => {
  setSelectedDraft(draft);
  setActiveCategory('tokenize');
};

const handleDeleteDraft = async (draftId) => {
  const userId = 'current-user-id';
  const result = await deleteDraft(draftId, userId);
  if (result.success) {
    loadUserDrafts(); // Refresh list
  }
};

// Render Drafts
{activeCategory === 'assets' && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
    {drafts.map((draft) => (
      <TokenizationDraftCard
        key={draft.id}
        draft={draft}
        onContinue={handleContinueDraft}
        onDelete={handleDeleteDraft}
      />
    ))}
  </div>
)}

// Tokenize Flow mit Draft laden
{activeCategory === 'tokenize' && (
  <TokenizeAssetFlow
    onBack={() => setActiveCategory('assets')}
    draftToLoad={selectedDraft}
  />
)}
```

## 💾 Auto-Save Funktionalität

Das System speichert automatisch bei:
- ✅ Jedem Schritt-Wechsel
- ✅ Wenn User auf "Back" klickt
- ✅ Alle 30 Sekunden (optional)

## 🔄 Flow

1. **User startet Tokenisierung**
   - Neuer Draft wird erstellt mit `status: 'draft'`
   - Current Step = 1

2. **User arbeitet am Flow**
   - Bei jedem Step-Wechsel wird Auto-Save getriggert
   - Files (Logo, Header) werden zu Storage hochgeladen
   - Draft wird in DB aktualisiert

3. **User bricht ab** (klickt auf Back/Close)
   - Aktueller Stand wird gespeichert
   - Draft erscheint in "Tokenized Assets" Liste

4. **User setzt fort**
   - Klickt auf "Continue" Button
   - Draft wird geladen
   - Flow startet bei gespeichertem Step

5. **User submitted**
   - Status wechselt zu `submitted`
   - `submitted_at` Timestamp wird gesetzt
   - Success Modal wird angezeigt

## 📝 TypeScript Types

Alle Types sind in `src/types/supabase.ts` definiert:

```typescript
type TokenizationDraft = Database['public']['Tables']['tokenization_drafts']['Row'];
type TokenizationDraftInsert = Database['public']['Tables']['tokenization_drafts']['Insert'];
type TokenizationDraftUpdate = Database['public']['Tables']['tokenization_drafts']['Update'];
```

## 🔒 Security

- ✅ RLS Policies aktiviert - User können nur ihre eigenen Drafts sehen/bearbeiten
- ✅ Admins können alle Drafts sehen
- ✅ Storage Buckets sind user-spezifisch (folder structure: `{user_id}/filename`)
- ✅ File Upload Validierung (MIME types, size limits)

## 📊 Datenbank Schema

### tokenization_drafts
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | FK zu users table |
| token_type | TEXT | 'utility' oder 'security' |
| current_step | INTEGER | Aktueller Schritt (1-6) |
| status | TEXT | 'draft', 'submitted', 'approved', 'rejected', 'cancelled' |
| asset_name | TEXT | Name des Assets |
| asset_value | DECIMAL | Wert des Assets |
| logo_url | TEXT | URL zum Logo (Storage) |
| header_image_url | TEXT | URL zum Header (Storage) |
| ... | ... | Alle anderen Form-Felder |
| form_data | JSONB | Backup des kompletten Form-States |
| created_at | TIMESTAMPTZ | Erstellungsdatum |
| updated_at | TIMESTAMPTZ | Letzte Änderung (auto-update) |
| submitted_at | TIMESTAMPTZ | Submission Datum |

## 🧪 Testing

### Test Draft erstellen:
```sql
INSERT INTO tokenization_drafts (user_id, token_type, asset_name, current_step)
VALUES (auth.uid(), 'security', 'Test Private Jet', 2);
```

### Drafts abrufen:
```sql
SELECT * FROM user_tokenization_assets WHERE user_id = auth.uid();
```

### Draft updaten:
```sql
UPDATE tokenization_drafts
SET current_step = 3, asset_value = 5000000
WHERE id = 'draft-id' AND user_id = auth.uid();
```

## ✅ Checklist

- [ ] SQL Migration in Supabase ausgeführt
- [ ] Storage Bucket `tokenization-images` erstellt (Public)
- [ ] Storage Bucket `tokenization-documents` erstellt (Private)
- [ ] Alle Storage Policies eingerichtet
- [ ] TypeScript types aktualisiert
- [ ] `tokenizationService.ts` importiert
- [ ] `TokenizationDraftCard.jsx` Component eingebunden
- [ ] Dashboard zeigt Drafts an
- [ ] "Continue" Button funktioniert
- [ ] Auto-Save beim Step-Wechsel aktiv
- [ ] Submit Flow funktioniert

## 🐛 Troubleshooting

**Problem:** "Permission denied" beim File Upload
- ✅ Check: Storage Policies korrekt eingerichtet?
- ✅ Check: User ist authenticated?
- ✅ Check: Folder name = user_id?

**Problem:** Drafts werden nicht angezeigt
- ✅ Check: RLS Policies aktiviert?
- ✅ Check: User ID korrekt?
- ✅ Check: SQL Migration erfolgreich?

**Problem:** Auto-Save funktioniert nicht
- ✅ Check: `saveDraft()` wird aufgerufen?
- ✅ Check: Console für Errors checken
- ✅ Check: Network Tab - API Calls erfolgreich?
