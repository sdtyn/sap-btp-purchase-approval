# Purchase Approval Angular Frontend

Angular-Frontend für das Purchase Approval System mit SAP CAP Backend.

## Funktionen

- **Login**: Authentifizierung mit Basic Auth (katja oder markus)
- **Dashboard**: Übersicht mit Zugriff auf Bestellungen und Genehmigungen
- **Bestellanforderungen**: Liste aller Bestellungen des Benutzers
- **Genehmigungen**: Liste offener Genehmigungen (nur für Approver-Rolle)

## Benutzer und Rollen

- **Katja** (Requester): Kann nur Bestellungen erstellen
- **Markus** (Requester + Approver): Kann Bestellungen erstellen UND genehmigen (aber nicht seine eigenen)

## Projekt-Struktur

```
app/
├── src/
│   ├── app/
│   │   ├── core/                    # Kernfunktionalität
│   │   │   ├── guards/              # Route Guards (auth, role)
│   │   │   ├── interceptors/        # HTTP Interceptors (auth)
│   │   │   ├── models/              # TypeScript Interfaces
│   │   │   └── services/            # Services (auth, odata, purchase-request)
│   │   ├── features/                # Feature Modules
│   │   │   ├── auth/                # Login, Unauthorized
│   │   │   ├── dashboard/           # Dashboard
│   │   │   ├── purchase-requests/   # Bestellungen Liste
│   │   │   └── approvals/           # Genehmigungen Liste
│   │   ├── shared/                  # Shared Components
│   │   ├── app.routes.ts            # Routing Konfiguration
│   │   └── app.config.ts            # App Konfiguration
│   └── environments/                # Environment Konfiguration
├── proxy.conf.json                  # Proxy für Backend
└── package.json
```

## Installation und Start

### 1. Backend starten

Im Root-Verzeichnis:
```bash
cd d:\PROJECTS\sap\btp\sap-btp-purchase-approval
cds watch
```

Das Backend läuft auf http://localhost:4004

### 2. Frontend starten

Im app-Verzeichnis:
```bash
cd app
npm install  # Falls noch nicht geschehen
npm start
```

Das Frontend läuft auf http://localhost:4200

## Verwendung

1. Browser öffnen: http://localhost:4200
2. Anmelden mit:
   - **Katja**: Kann nur Bestellungen sehen
   - **Markus**: Kann Bestellungen sehen UND genehmigen (aber nicht eigene)

## Technologie-Stack

- **Angular 21.1** (Standalone Components)
- **Angular Material** (UI Components)
- **RxJS** (Reactive Programming)
- **TypeScript**
- **SCSS** (Styling)

## Wichtige Services

### AuthService
- Login/Logout
- Benutzer-Verwaltung
- Rollen-Prüfung
- Basic Auth Header

### ODataService
- Basis-Service für OData V4 Kommunikation
- GET, POST, PATCH, DELETE, Actions
- Auth Header Integration

### PurchaseRequestService
- Bestellanforderungen abrufen/erstellen
- Genehmigungen abrufen
- Approve/Reject Actions

## Guards

- **authGuard**: Prüft Authentifizierung
- **roleGuard**: Prüft erforderliche Rolle

## Routing

- `/login` - Login-Seite (öffentlich)
- `/` - Dashboard (authentifiziert)
- `/purchase-requests` - Bestellungen (Requester Rolle)
- `/approvals` - Genehmigungen (Approver Rolle)
- `/unauthorized` - Zugriff verweigert

## Development

### Neue Komponente erstellen
```bash
ng generate component features/my-feature/my-component --standalone
```

### Neue Service erstellen
```bash
ng generate service core/services/my-service
```

### Build für Produktion
```bash
npm run build
```

Die Build-Artefakte werden im `dist/` Verzeichnis gespeichert.

## Nächste Schritte

1. **Bestellungen erstellen**: Formular zum Erstellen neuer Bestellungen
2. **Detail-Ansichten**: Detail-Seiten für einzelne Bestellungen
3. **Items-Verwaltung**: Items zu Bestellungen hinzufügen/bearbeiten
4. **Kommentare**: Kommentare bei Approve/Reject hinzufügen
5. **Validierung**: Erweiterte Formular-Validierung
6. **Error Handling**: Globaler Error Handler
7. **Loading States**: Bessere Loading-Indikatoren
8. **Notifications**: Toast-Nachrichten für Aktionen

## Hinweise

- Das Backend muss laufen (Port 4004), damit das Frontend funktioniert
- Die Proxy-Konfiguration leitet `/odata` Requests zum Backend weiter
- Basic Auth Credentials werden im LocalStorage gespeichert
- Die Vier-Augen-Prinzip-Regel wird im Backend durchgesetzt
