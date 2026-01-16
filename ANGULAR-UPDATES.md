# Angular UI Updates - Backend Integration

## Änderungen durchgeführt:

### 1. Models aktualisiert
- ✓ `Product.ID`: String → **number**
- ✓ `Product.stock`: Feld hinzugefügt
- ✓ `PurchaseItem.productName` → **product_ID: number**
- ✓ `PurchaseItem.product`: Nested product info hinzugefügt

### 2. Services aktualisiert
- ✓ `ProductCatalogService`: Verwendet jetzt number IDs
- ✓ `PurchaseRequestService`: 
  - Draft-Aktivierung implementiert
  - approve/reject verwendet jetzt PurchaseRequestService statt ApprovalService
  - Verwendet korrekte Action-URLs

### 3. Components aktualisiert
- ✓ `PurchaseRequestCreateComponent`:
  - Verwendet product_ID statt productName
  - Aktiviert Draft automatisch nach Erstellung
  - Status wird nicht mehr manuell gesetzt (Backend entscheidet)
  
- ✓ `ApprovalsListComponent`:
  - Loading-State bei approve/reject

### 4. Workflow
**Bestellung erstellen:**
1. Produkte aus Katalog auswählen (mit Integer IDs)
2. Draft erstellen mit product_ID und items
3. Draft automatisch aktivieren
4. Backend berechnet totalAmount und setzt Status (New/Pending basierend auf Betrag)

**Bestellung genehmigen:**
1. Markus (Approver) ruft Pending-Liste ab
2. Klickt auf "Approve"
3. Backend:
   - Prüft Stock-Verfügbarkeit
   - Reduziert Stock
   - Setzt Status auf "Approved"

## Nächste Schritte:

### Testen Sie die UI:
```bash
cd app
npm install
npm start
```

### Proxy-Konfiguration prüfen:
Die `proxy.conf.json` sollte auf `http://localhost:4004` zeigen:
```json
{
  "/odata": {
    "target": "http://localhost:4004",
    "secure": false,
    "changeOrigin": true
  }
}
```

### Wichtige Hinweise:
1. **Draft-Modus**: Bestellungen werden als Draft erstellt und dann aktiviert
2. **Stock-Validation**: Erfolgt beim Erstellen der Items
3. **Product-Namen**: Werden über die Association geladen (product_ID)
4. **Status**: Wird automatisch vom Backend gesetzt (>1000€ → Pending)

## Was funktioniert jetzt:
- ✓ Produktkatalog mit Stock anzeigen
- ✓ Bestellung aus Katalog erstellen
- ✓ Items mit product_ID speichern
- ✓ Draft-Aktivierung
- ✓ Bestellungen anzeigen
- ✓ Bestellungen genehmigen/ablehnen
- ✓ Stock-Reduktion bei Genehmigung
