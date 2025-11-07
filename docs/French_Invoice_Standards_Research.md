# French Invoice Formatting Standards & Requirements Research

## Executive Summary

This document provides comprehensive research on French invoice formatting standards, legal requirements, and best practices for 2025. It covers mandatory information, layout standards, and the Factur-X format requirements that will be mandatory for B2B transactions starting in 2026.

## Legal Framework & Timeline

### E-Invoicing Mandate Timeline
- **2025**: Pilot phase begins for B2B e-invoicing
- **2026**: Mandatory for large and medium businesses
- **2027**: Mandatory for all businesses
- **2030**: EU-wide mandatory electronic invoicing (Directive 516/2025)

### Regulatory Bodies
- **DGFiP** (Direction Générale des Finances Publiques): French tax authority
- **AFNOR**: French standardization body
- **VIES**: VAT Information Exchange System for cross-border transactions

## Mandatory Information Requirements

### Company Information (Seller)
1. **Business Name & Trade Name**
   - Complete legal name
   - Any trade names used

2. **Registration Numbers**
   - **SIREN**: Unique company identification number
   - **SIRET**: Unique establishment identification number
   - **RCS**: Trade and Companies Register number with location
   - Format: "123 123 123 00018 RCS Lyon"

3. **Legal Structure**
   - Company type: EURL, SARL, SAS, SA, SNC, etc.
   - Share capital amount: "SARL XYZ au capital de 2,000€"
   - Registered office address (not branch office)

4. **VAT Information**
   - VAT identification number (required for invoices > €150)
   - Intra-community VAT number for EU transactions
   - Special mentions:
     - "TVA non applicable, art. 293 B du CGI" (if VAT exempt)
     - "autoliquidation de la TVA" (for VAT reverse charge)

### Client Information
1. **Individual Clients**
   - Full name
   - Complete address

2. **Business Clients**
   - Company name
   - Complete address
   - SIRET number (if applicable)
   - Intra-community VAT number (for EU transactions)

### Invoice Details
1. **Invoice Numbering**
   - Unique chronological sequence
   - Continuous numbering without gaps
   - Cannot be reused or modified

2. **Dates**
   - Invoice date
   - Date of sale/service completion
   - Payment due date

3. **Transaction Details**
   - Detailed description of goods/services
   - Quantity and unit price (HT - before tax)
   - VAT rate for each item
   - Total amounts (HT and TTC - including tax)
   - Any discounts applied

### Payment Information
1. **Payment Terms**
   - Payment due date
   - Payment methods accepted
   - Late payment penalties rate
   - Recovery costs: "Indemnité forfaitaire de 40€ pour frais de recouvrement"

2. **Additional Legal Mentions**
   - 2-year legal guarantee of conformity for goods
   - Professional liability insurance details (if required)
   - 10-year insurance coverage (for certain professions)

## Factur-X Format Requirements

### Technical Specifications
- **Format**: Hybrid PDF with embedded XML
- **Standard**: Factur-X 1.07.3 (released May 2025)
- **Compliance**: EU standards aligned
- **Minimum Profile**: EN 16931 compliant

### Structure Requirements
1. **PDF Component**
   - Human-readable invoice
   - Standard PDF/A-3 format
   - Embedded XML file

2. **XML Component**
   - Structured invoice data
   - EN 16931 compliant
   - Minimum data requirements specified

### Accepted Formats (2025-2027)
- Factur-X (Franco-German standard)
- UBL (Universal Business Language)
- CII (Cross-Industry Invoice)

## Layout & Design Standards

### Traditional French Invoice Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    HEADER SECTION                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ COMPANY INFO (Top Left)                             │   │
│  │ • Company Name                                       │   │
│  │ • Legal Form + Capital                               │   │
│  │ • SIRET/SIREN Numbers                               │   │
│  │ • Complete Address                                  │   │
│  │ • VAT Number                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ CLIENT INFO (Top Right)                             │   │
│  │ • Client Name                                       │   │
│  │ • Client Address                                    │   │
│  │ • Client SIRET (if business)                        │   │
│  │ • VAT Number (if applicable)                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ INVOICE DETAILS (Center)                             │   │
│  │ • FACTURE / FACTURE N° [Number]                     │   │
│  │ • Date: [Invoice Date]                               │   │
│  │ • Échéance: [Due Date]                              │   │
│  │ • Référence: [Reference]                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ITEMS SECTION                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ TABLE HEADERS                                       │   │
│  │ • DÉSIGNATION (Description)                         │   │
│  │ • QTÉ (Quantity)                                    │   │
│  │ • PRIX UNIT. HT (Unit Price Before Tax)            │   │
│  │ • REMISE (Discount)                               │   │
│  │ • TVA (VAT Rate)                                    │   │
│  │ • TOTAL HT (Total Before Tax)                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Item rows with detailed information]                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    TOTALS SECTION                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ CALCULATION BREAKDOWN                               │   │
│  │ • Total HT: [Amount]                                 │   │
│  │ • TVA [Rate]%: [VAT Amount]                         │   │
│  │ • Total TTC: [Total Amount]                         │   │
│  │ • Arrondi: [Rounding] (if applicable)               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    FOOTER SECTION                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ PAYMENT TERMS                                       │   │
│  │ • Pénalités de retard: [Rate]%                    │   │
│  │ • Indemnité forfaitaire: 40€                      │   │
│  │ • Mode de paiement: [Payment Method]              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ LEGAL MENTIONS                                      │   │
│  │ • TVA non applicable (if exempt)                   │   │
│  │ • Garantie légale de conformité: 2 ans            │   │
│  │ • Assurance responsabilité (if required)          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Typography & Visual Standards
- **Primary Font**: Clean, professional sans-serif (Arial, Helvetica)
- **Header Font**: Bold, clear typography
- **Color Scheme**: Professional blue/black on white
- **Logo Placement**: Top left corner (company area)
- **Page Numbers**: "Page X of Y" if multi-page

### Language Requirements
- **Primary Language**: French (mandatory)
- **Bilingual**: French + English acceptable
- **Translation Requirement**: Must provide French translation to tax authorities upon request

## Compliance Best Practices

### Document Retention
- **Minimum Period**: 10 years
- **Format**: Must maintain integrity and readability
- **Storage**: Secure, organized system
- **Backup**: Regular backup procedures

### Audit Preparation
- **Numbering Consistency**: No gaps or duplicates
- **Date Accuracy**: All dates must be accurate and logical
- **Amount Verification**: Mathematical accuracy
- **Legal Compliance**: All required mentions present

### Common Compliance Issues
1. **Missing SIRET Numbers**
2. **Incorrect VAT Calculations**
3. **Incomplete Payment Terms**
4. **Missing Legal Mentions**
5. **Improper Numbering Sequences**

## Penalties for Non-Compliance

### Financial Penalties
- **Incomplete Invoices**: €75,000 (individuals) / €375,000 (companies)
- **Fraudulent Invoices**: Higher penalties possible
- **Late Payment**: Interest and additional fees

### Business Impact
- **Tax Audit Risk**: Increased scrutiny
- **Payment Delays**: Client payment issues
- **Legal Complications**: Contract disputes

## Implementation Recommendations

### Immediate Actions (2025)
1. **Audit Current Templates**: Review existing invoice formats
2. **Update Mandatory Fields**: Ensure all required information
3. **Implement Numbering System**: Sequential, gap-free numbering
4. **Train Staff**: Invoice creation and compliance requirements

### Medium-term Goals (2026)
1. **Factur-X Implementation**: Prepare for electronic invoicing
2. **System Integration**: Connect with accounting systems
3. **Automation**: Reduce manual errors
4. **Testing**: Validate with tax authorities

### Long-term Strategy (2027+)
1. **Full E-Invoicing**: Complete digital transformation
2. **Cross-border Integration**: EU-wide compliance
3. **Process Optimization**: Streamline workflows
4. **Regular Updates**: Stay current with regulations

## Technical Implementation Notes

### Current System Assessment
- Review existing PDF generation in `pdfServicePDFKit.js`
- Audit email templates in `reminderEmailService.js`
- Check invoice numbering system
- Validate date formatting and calculations

### Required Updates
1. **Header Section**: Company and client information layout
2. **Item Table**: French column headers and calculations
3. **Totals Section**: Proper VAT breakdown
4. **Footer**: Legal mentions and payment terms
5. **Numbering**: Sequential invoice numbering system

### Testing Strategy
1. **Compliance Check**: Verify all mandatory fields
2. **Format Validation**: Test PDF and email formats
3. **Calculation Accuracy**: Validate mathematical calculations
4. **Language Consistency**: Ensure French throughout
5. **Integration Testing**: End-to-end workflow testing

---

*This research document serves as the foundation for implementing French-compliant invoice formatting in the SaaS application. Regular updates should be made as regulations evolve.*