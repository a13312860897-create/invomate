# French Invoice Standards - Deep Research 2025

## Key Findings from Official Sources

### Mandatory Company Information
Based on official French government requirements:

1. **Complete Legal Identity**
   - Company name + legal form (SARL, SAS, SA, etc.)
   - Share capital amount (if applicable)
   - Example format: "SARL XYZ au capital de 2,000€"

2. **Registration Numbers**
   - SIRET (14 digits) - establishment identifier
   - SIREN (9 digits) - company identifier  
   - RCS registration with city
   - RM number for tradespeople

3. **VAT Information**
   - Intra-community VAT number (FR + 11 chars)
   - OR specific exemption text:
     - "TVA non applicable, art. 293 B du CGI"
     - "Exonération de TVA - Article 262 ter I du CGI"

### Payment Terms (Legally Required)
- Due date prominently displayed
- Late payment interest rate: ECB rate + 10%
- Fixed recovery fee: 40€
- Must state: "Pénalités de retard: taux d'intérêt légal + 10 points, indemnité forfaitaire de 40€"

### Layout Standards
- French language mandatory
- Two copies minimum
- 10-year retention
- Clear sections: Company info, Customer info, Items table, Totals, Payment terms

### 2025 Electronic Reform
- Pilot program starting 2025
- Full rollout 2026-2027
- Factur-X format (PDF + XML)
- Real-time transmission to tax authorities

## Concrete Examples from Research

### Header Layout Example:
```
[SARL ABC ENTREPRISE]                    FACTURE N° 2025-001
[Capital: 10,000€]                       Date: 15/01/2025
[SIRET: 12345678901234]                  Échéance: 15/02/2025
[RCS Paris B 123 456 789]
[TVA: FR12345678901]
```

### Legal Mentions Found:
- Company: "SARL XYZ au capital de 2,000€, 123 123 123 00018 RCS Lyon"
- VAT Exempt: "TVA non applicable, art. 293 B du CGI"
- Cross-border: "Auto-liquidation de la TVA"
- Payment: Includes 40€ fixed fee + interest rate

### Common Table Headers:
- Référence | Désignation | Quantité | Prix unitaire HT | Montant HT
- TVA breakdown by rate (5.5%, 10%, 20%)
- Total HT → Total TVA → Total TTC

This research confirms the specific legal requirements and provides concrete examples for implementation.