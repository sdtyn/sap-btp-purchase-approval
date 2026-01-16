# Hierarchisches Genehmigungs-System - Test-Szenarien

## Benutzer-Konfiguration

### Katja (Mitarbeiterin)
- **Rollen:** `Requester`
- **Kann:**
  - ✅ Bestellanforderungen erstellen
  - ✅ Eigene Anforderungen bearbeiten (Status = "New")
- **Kann NICHT:**
  - ❌ ApprovalService aufrufen
  - ❌ Bestellungen genehmigen/ablehnen

### Markus (Chef)
- **Rollen:** `Requester`, `Approver`
- **Kann:**
  - ✅ Bestellanforderungen erstellen (wie ein Requester)
  - ✅ ApprovalService aufrufen
  - ✅ Bestellungen ANDERER Personen genehmigen/ablehnen
- **Kann NICHT:**
  - ❌ Seine eigenen Bestellungen genehmigen/ablehnen

---

## Test-Szenarien

### Szenario 1: Katja erstellt Request und Markus genehmigt

#### Schritt 1: Katja erstellt Request
```bash
# Als Katja
POST http://katja@localhost:4004/odata/v4/purchase-request/PurchaseRequests
Content-Type: application/json

{
  "title": "Laptop Dell XPS 15",
  "totalAmount": 1500.00,
  "requester": "katja",
  "status": "New"
}
```

**Erwartet:** ✅ Request wird erstellt mit `requester = "katja"`, `status = "New"`

#### Schritt 2: Markus sieht Request im ApprovalService
```bash
# Als Markus
GET http://markus@localhost:4004/odata/v4/approval/PurchaseRequests?$filter=status eq 'Pending'
```

**Erwartet:** ✅ Markus sieht Katjas Request (wenn Status = "Pending")

#### Schritt 3: Markus genehmigt Request
```bash
# Als Markus
POST http://markus@localhost:4004/odata/v4/approval/PurchaseRequests(ID='xxx')/ApprovalService.approve
```

**Erwartet:** ✅ Request wird genehmigt, `status = "Approved"`

---

### Szenario 2: Markus erstellt Request und versucht selbst zu genehmigen

#### Schritt 1: Markus erstellt Request
```bash
# Als Markus
POST http://markus@localhost:4004/odata/v4/purchase-request/PurchaseRequests
Content-Type: application/json

{
  "title": "Firmen-Smartphone iPhone 15 Pro",
  "totalAmount": 1200.00,
  "requester": "markus",
  "status": "New"
}
```

**Erwartet:** ✅ Request wird erstellt mit `requester = "markus"`, `status = "New"`

#### Schritt 2: Markus sieht eigenen Request im ApprovalService
```bash
# Als Markus
GET http://markus@localhost:4004/odata/v4/approval/PurchaseRequests
```

**Erwartet:** ✅ Markus sieht seinen eigenen Request in der Liste

#### Schritt 3: Markus versucht eigenen Request zu genehmigen
```bash
# Als Markus
POST http://markus@localhost:4004/odata/v4/approval/PurchaseRequests(ID='xxx')/ApprovalService.approve
```

**Erwartet:** ❌ **FEHLER 403**
```json
{
  "error": {
    "code": "403",
    "message": "You cannot approve your own purchase request"
  }
}
```

---

### Szenario 3: Katja versucht ApprovalService aufzurufen

#### Katja versucht Approval-Liste zu sehen
```bash
# Als Katja
GET http://katja@localhost:4004/odata/v4/approval/PurchaseRequests
```

**Erwartet:** ❌ **FEHLER 403**
```json
{
  "error": {
    "code": "403",
    "message": "Access denied. User 'katja' requires Approver role for ApprovalService."
  }
}
```

---

## Geschäftsregeln - Zusammenfassung

### ✅ Erlaubte Aktionen

| Benutzer | Aktion | Service | Bedingung |
|----------|--------|---------|-----------|
| Katja | Request erstellen | PurchaseRequestService | - |
| Katja | Eigene Requests bearbeiten | PurchaseRequestService | Status = "New" |
| Markus | Request erstellen | PurchaseRequestService | - |
| Markus | Eigene Requests bearbeiten | PurchaseRequestService | Status = "New" |
| Markus | Fremde Requests genehmigen | ApprovalService | requester ≠ "markus" |
| Markus | Fremde Requests ablehnen | ApprovalService | requester ≠ "markus" |

### ❌ Verbotene Aktionen

| Benutzer | Aktion | Service | Grund |
|----------|--------|---------|-------|
| Katja | ApprovalService aufrufen | ApprovalService | Keine Approver-Rolle |
| Katja | Requests genehmigen | Beide | Keine Approver-Rolle |
| Markus | Eigene Requests genehmigen | ApprovalService | requester = "markus" |
| Markus | Eigene Requests ablehnen | ApprovalService | requester = "markus" |

---

## Code-Implementierung

### package.json - Benutzer-Rollen
```json
"users": {
  "katja": {
    "roles": ["Requester"]
  },
  "markus": {
    "roles": ["Requester", "Approver"]
  }
}
```

### srv/service.js - Selbst-Genehmigungs-Prüfung
```javascript
// In approve() Action:
if (request.requester === user) {
  req.error(403, 'You cannot approve your own purchase request');
}

// In reject() Action:
if (request.requester === user) {
  req.error(403, 'You cannot reject your own purchase request');
}
```

---

## Zukünftige Erweiterungen

### Option 1: Dritter Benutzer (Markus' Chef)
```json
"users": {
  "katja": { "roles": ["Requester"] },
  "markus": { "roles": ["Requester", "Approver"] },
  "hans": { "roles": ["Approver"] }  // Markus' Chef
}
```

### Option 2: Genehmigungs-Hierarchie
- Beträge < 1.000€: Jeder Approver kann genehmigen
- Beträge > 1.000€: Benötigt Senior-Approver
- Beträge > 10.000€: Benötigt 2 Genehmigungen

### Option 3: Automatische Zuweisung
```javascript
// Automatisch den richtigen Approver basierend auf Hierarchie wählen
const approver = findManagerFor(request.requester);
```

---

## Test-Befehle (PowerShell)

```powershell
# Server starten
cds watch

# Test 1: Katja erstellt Request
Invoke-RestMethod -Uri "http://katja@localhost:4004/odata/v4/purchase-request/PurchaseRequests" `
  -Method POST -ContentType "application/json" `
  -Body '{"title":"Laptop","totalAmount":1500,"requester":"katja","status":"New"}'

# Test 2: Markus sieht Requests
Invoke-RestMethod -Uri "http://markus@localhost:4004/odata/v4/approval/PurchaseRequests"

# Test 3: Markus genehmigt Katjas Request (OK)
Invoke-RestMethod -Uri "http://markus@localhost:4004/odata/v4/approval/PurchaseRequests(ID)/ApprovalService.approve" `
  -Method POST

# Test 4: Markus versucht eigenen Request zu genehmigen (FEHLER erwartet)
Invoke-RestMethod -Uri "http://markus@localhost:4004/odata/v4/approval/PurchaseRequests(ID)/ApprovalService.approve" `
  -Method POST
```

---

## Erfolg!

Das System implementiert jetzt ein **hierarchisches Genehmigungs-System** mit folgenden Kernprinzipien:

1. ✅ Approver können auch Requester sein
2. ✅ Niemand kann seine eigenen Requests genehmigen
3. ✅ Klare Rollentrennung und Zugriffskontrollen
4. ✅ Business-Logik erzwingt Vier-Augen-Prinzip
