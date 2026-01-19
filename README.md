# Purchase Request & Approval Management System

![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-SAP%20BTP-blue)
![Frontend](https://img.shields.io/badge/frontend-Angular-red)
![Backend](https://img.shields.io/badge/backend-SAP%20CAP-brightgreen)

## TL;DR

A full-stack SAP BTP reference application demonstrating a **purchase request and approval workflow**, built with **SAP CAP (Node.js)** backend and **Angular frontend**. Ideal for learning SAP cloud-native development and showcasing in GitHub portfolio.

---

## Project Overview

The **Purchase Request & Approval Management System** demonstrates a complete purchase request workflow, from creation to approval, using **SAP CAP (Node.js)** for the backend and **Angular** for the frontend UI. It serves as a **production-like reference project** for SAP BTP developers.

---

## Features

- **Create and manage purchase requests:** Submit requests with multiple items and track status.
- **Approval workflow:** Managers can approve or reject requests based on business rules.
- **Role-based access control:** Implemented using SAP XSUAA; roles include `Requester` and `Approver`.
- **Angular UI:** Responsive interface for request creation, listing, and approval.

---

## Technology Stack

- **Backend:** SAP CAP (Node.js)
- **Frontend:** Angular
- **Database:** SQLite (for local development)
- **Platform Services:** XSUAA, Workflow, HTML5 Repository
- **OData V4 Services:** Exposing `PurchaseRequest` and `PurchaseItem` entities with actions (`approve()`, `reject()`)

---

## Purpose

Enterprises often handle purchase requests manually via emails or spreadsheets, leading to transparency and compliance issues. This project demonstrates a **secure, structured, and auditable process**, suitable for SAP S/4HANA integration while leveraging Angular for modern UI development.

---

## Getting Started

```bash
git clone https://github.com/sdtyn/sap-btp-purchase-approval.git
cd sap-btp-purchase-approval
npm install
cds watch
