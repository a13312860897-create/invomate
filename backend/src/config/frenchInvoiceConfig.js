/**
 * French Invoice Configuration
 * Based on 2025 French legal requirements for invoicing
 */

const FRENCH_INVOICE_CONFIG = {
  // Legal requirements for French invoices
  legalRequirements: {
    // Mandatory company information
    companyFields: [
      'companyName',
      'legalForm',           // Forme juridique (SARL, SAS, etc.)
      'shareCapital',        // Capital social
      'siret',               // SIRET number
      'siren',               // SIREN number (if different from SIRET)
      'vatNumber',           // Numéro de TVA intracommunautaire
      'rcsNumber',           // Numéro RCS (Registre du commerce et des sociétés)
      'nafCode',             // Code NAF (activité)
      'companyAddress',      // Registered address
      'postalCode',
      'city',
      'country'
    ],
    
    // Mandatory invoice fields
    invoiceFields: [
      'invoiceNumber',       // Must be sequential and unique
      'invoiceDate',         // Date of issue
      'dueDate',             // Payment due date
      'clientName',          // Client name
      'clientAddress',       // Client address
      'items',               // Detailed description of goods/services
      'unitPrices',          // Unit prices
      'quantities',          // Quantities
      'taxRates',            // TVA rates or exemption reasons
      'totalHT',            // Total before tax
      'totalTVA',           // Total TVA
      'totalTTC'            // Total including tax
    ],
    
    // Payment terms (required by French law)
    paymentTerms: {
      latePaymentRate: 'ECB rate + 10%',  // Taux d'intérêt de retard
      fixedRecoveryFee: 40,             // Forfait de 40€ pour frais de recouvrement
      legalBasis: 'Articles L.441-3 et L.441-6 du Code de commerce'
    }
  },

  // Template layouts for different French invoice types
  templates: {
    standard: {
      name: 'Standard French Invoice',
      description: 'Standard French commercial invoice with all legal requirements',
      layout: {
        // Header section
        header: {
          showLogo: true,
          showCompanyInfo: true,
          companyInfoPosition: 'left',
          invoiceTitle: 'FACTURE',
          invoiceNumberPosition: 'right'
        },
        
        // Company legal information section
        companyLegalSection: {
          position: 'below_header',
          fields: ['legalForm', 'shareCapital', 'siret', 'vatNumber', 'rcsNumber'],
          format: 'inline'  // or 'block'
        },
        
        // Client information
        clientSection: {
          title: 'FACTURÉ À',
          position: 'left',
          requiredFields: ['clientName', 'clientAddress']
        },
        
        // Invoice details
        invoiceDetails: {
          position: 'right',
          fields: ['invoiceNumber', 'invoiceDate', 'dueDate', 'totalTTC']
        },
        
        // Items table
        itemsTable: {
          columns: [
            { key: 'description', label: 'DESCRIPTION', width: '40%' },
            { key: 'quantity', label: 'QTÉ', width: '10%', align: 'right' },
            { key: 'unitPrice', label: 'PRIX UNIT. HT', width: '15%', align: 'right' },
            { key: 'taxRate', label: 'TVA', width: '10%', align: 'right' },
            { key: 'totalHT', label: 'TOTAL HT', width: '15%', align: 'right' },
            { key: 'totalTTC', label: 'TOTAL TTC', width: '15%', align: 'right' }
          ]
        },
        
        // Totals section
        totalsSection: {
          showSubtotal: true,
          showTaxBreakdown: true,
          showTotal: true,
          currencyFormat: 'EUR'
        },
        
        // Legal statements
        legalStatements: {
          position: 'footer',
          statements: [
            {
              title: 'DÉCLARATION LÉGALE',
              text: 'Conformément aux articles L.441-3 et L.441-6 du Code de commerce français, cette facture est conforme aux exigences légales françaises.',
              required: true
            },
            {
              title: 'CONDITIONS DE PAIEMENT',
              text: 'Paiement à échéance. En cas de retard de paiement, des intérêts de retard seront appliqués au taux de refinancement de la BCE majoré de 10 points de pourcentage, ainsi qu\'un forfait de 40€ pour frais de recouvrement.',
              required: true
            }
          ]
        }
      }
    },
    
    // Template for VAT-exempt businesses (art. 293 B CGI)
    vatExempt: {
      name: 'French VAT-Exempt Invoice',
      description: 'For businesses exempt from TVA under article 293 B of CGI',
      layout: {
        ...this.templates.standard.layout,
        itemsTable: {
          columns: [
            { key: 'description', label: 'DESCRIPTION', width: '50%' },
            { key: 'quantity', label: 'QTÉ', width: '15%', align: 'right' },
            { key: 'unitPrice', label: 'PRIX UNIT.', width: '20%', align: 'right' },
            { key: 'total', label: 'TOTAL', width: '15%', align: 'right' }
          ]
        },
        legalStatements: {
          statements: [
            {
              title: 'TVA NON APPLICABLE',
              text: 'TVA non applicable, art. 293 B du CGI (régime de la franchise en base).',
              required: true
            },
            ...this.templates.standard.layout.legalStatements.statements
          ]
        }
      }
    },
    
    // Auto-liquidation template (reverse charge)
    autoLiquidation: {
      name: 'French Auto-liquidation Invoice',
      description: 'For transactions requiring auto-liquidation de la TVA',
      layout: {
        ...this.templates.standard.layout,
        legalStatements: {
          statements: [
            {
              title: 'AUTO-LIQUIDATION',
              text: 'Auto-liquidation de la TVA par le destinataire conformément à l\'article 283-1 du CGI.',
              required: true
            },
            ...this.templates.standard.layout.legalStatements.statements
          ]
        }
      }
    }
  },

  // Validation rules for French invoices
  validationRules: {
    invoiceNumber: {
      pattern: /^[A-Z0-9]{1,20}$/,
      message: 'Invoice number must be alphanumeric and unique'
    },
    siret: {
      pattern: /^\d{14}$/,
      message: 'SIRET must be 14 digits'
    },
    vatNumber: {
      pattern: /^FR[A-Z0-9]{2}\d{9}$/,
      message: 'VAT number must be in format FRXX999999999',
      optional: true
    },
    dates: {
      invoiceDate: {
        maxDaysInFuture: 30,
        maxDaysInPast: 365
      },
      dueDate: {
        minDaysAfterInvoice: 1,
        maxDaysAfterInvoice: 365
      }
    }
  },

  // Formatting helpers
  formatters: {
    currency: {
      symbol: '€',
      position: 'after',
      decimalSeparator: ',',
      thousandSeparator: ' '
    },
    date: {
      format: 'fr-FR',
      pattern: 'DD/MM/YYYY'
    },
    number: {
      decimalSeparator: ',',
      thousandSeparator: ' '
    }
  }
};

module.exports = FRENCH_INVOICE_CONFIG;