// French labels for invoice system
const FRENCH_LABELS = {
  // Invoice types
  invoiceTitle: 'FACTURE',
  standardInvoice: 'Facture standard',
  creditNote: 'Avoir',
  debitNote: 'Note de débit',
  proformaInvoice: 'Facture pro forma',
  depositInvoice: 'Facture d\'acompte',
  finalInvoice: 'Facture de solde',
  invoiceType: 'Type de facture',
  template: 'Modèle',

  // Company information
  seller: 'VENDEUR',
  billedTo: 'FACTURÉ À',
  destinataire: 'Destinataire',
  billingAddress: 'Adresse de facturation',
  deliveryAddress: 'Adresse de livraison',
  attentionOf: 'À l\'attention de',
  phone: 'Tél',
  email: 'Email',
  vatNumber: 'TVA',
  siren: 'SIREN',
  siret: 'SIRET',
  capital: 'Capital',
  rcs: 'RCS',
  naf: 'NAF',
  vatIntraCommunity: 'TVA intracommunautaire',
  defaultCompanyName: 'Société',

  // Invoice details
  invoiceDetails: 'DÉTAILS DE LA FACTURE',
  invoiceNumber: 'N° Facture',
  date: 'Date',
  dueDate: 'Échéance',
  orderNumber: 'N° Commande',
  contractNumber: 'N° Contrat',
  serviceDate: 'Date de prestation',
  deliveryDate: 'Date de livraison',

  // Table headers
  description: 'DESCRIPTION',
  quantity: 'QTÉ',
  unitPrice: 'PRIX UNIT.',
  vatRate: 'TVA',
  total: 'TOTAL',

  // Totals
  subtotal: 'Sous-total',
  vatAmount: 'TVA',
  totalAmount: 'TOTAL',
  vatExempt: 'TVA (Exonérée)',
  vatAutoLiquidation: 'TVA (Auto-liquidation)',

  // TVA status and declarations
  tvaExempt: 'Exonéré',
  autoLiquidation: 'Auto-liq.',
  tvaExemptStatus: 'TVA non applicable (art. 293 B du CGI)',
  tvaStatus: 'Statut TVA',
  tvaApplicableArticle256: 'TVA applicable selon l\'article 256 du Code général des impôts',
  tvaExemptArticle262: 'TVA Exonérée selon l\'article 262 ter I du Code général des impôts (CGI) - Livraisons intracommunautaires de biens',
  tvaAutoLiquidationB2B: 'Autoliquidation de la TVA par le preneur selon l\'article 283-1 du Code général des impôts (CGI) - Prestations de services B to B',
  vatIntraCommunityNumber: 'Numéro de TVA intracommunautaire',

  // Notes and legal
  notes: 'NOTES',
  legalDeclarations: 'DÉCLARATIONS LÉGALES',
  paymentTermsLabel: 'CONDITIONS DE PAIEMENT :',
  latePaymentPenalty: 'En cas de retard de paiement, des intérêts de retard seront appliqués au taux de refinancement de la BCE majoré de 10 points de pourcentage, ainsi qu\'un forfait de 40€ pour frais de recouvrement',

  // Payment terms
  paymentImmediate: 'Paiement à réception de la facture',
  payment15Days: 'Paiement à 15 jours',
  payment30Days: 'Paiement à 30 jours',
  payment45Days: 'Paiement à 45 jours',
  payment60Days: 'Paiement à 60 jours',
  paymentEndOfMonth: 'Paiement fin de mois',
  paymentEndOfMonthPlus30: 'Paiement fin de mois + 30 jours',
  paymentOnDue: 'Paiement à échéance',

  // Bank information
  bankInformation: 'INFORMATIONS BANCAIRES :',
  iban: 'IBAN',
  bic: 'BIC',
  bankAccount: 'Compte bancaire',
  bankName: 'Banque',

  // Notes section
  notes: 'Notes',
  additionalNotes: 'Notes supplémentaires',
  
  // Legal compliance
  tvaNotApplicableLabel: 'TVA NON APPLICABLE :',
  tvaNotApplicableText: 'TVA non applicable, art. 293 B du CGI (régime de la franchise en base).',
  tvaNotApplicableShort: 'TVA non applicable, art. 293 B du CGI',
  autoLiquidationLabel: 'AUTO-LIQUIDATION :',
  autoLiquidationText: 'Auto-liquidation de la TVA par le destinataire conformément à l\'article 283-1 du CGI.',
  autoLiquidationShort: 'Auto-liquidation de la TVA par le destinataire',
  legalComplianceLabel: 'CONFORMITÉ LÉGALE :',
  legalComplianceText: 'Selon les articles L.441-3 et L.441-6 du Code de commerce français, cette facture est conforme aux exigences légales françaises.',

  // Error messages
  fontNotFound: 'Police française non trouvée, utilisation de la police par défaut',
  fontRegistrationFailed: 'Échec de l\'enregistrement de la police française',

  // Additional labels for email templates
  from: 'de',
  totalVat: 'Total TVA',
  vatBreakdown: 'Détail TVA',
  legalMentions: 'MENTIONS LÉGALES',
  vatApplicable: 'TVA applicable selon les taux en vigueur.',
  vatDeductible: 'La TVA est déductible selon l\'article 278 du Code Général des Impôts français.',
  invoiceCompliance: 'Cette facture respecte les obligations légales françaises en matière de TVA.',
  vatSubject: 'Le prestataire est assujetti à la TVA et applique les taux réglementaires.',
  paymentDue: 'Paiement à échéance',
  latePaymentPenalty: 'En cas de retard de paiement, des intérêts de retard seront appliqués conformément à l\'article L441-6 du Code de commerce',
  notProvided: 'Non communiqué',
  apeCode: 'Code APE',
  paymentTerms: 'CONDITIONS DE PAIEMENT',
  latePayment: 'RETARD DE PAIEMENT',
  latePaymentInterest: 'Intérêts de retard selon conditions légales',
  thankYou: 'Merci de votre confiance',
  
  // VAT exemption labels
  vatExemption: 'EXONÉRATION DE TVA',
  vatExemptInvoice: 'Cette facture est exonérée de TVA conformément à la réglementation applicable.',
  vatExemptionApplies: 'L\'exonération de TVA s\'applique selon les dispositions légales en vigueur. Cette prestation peut être exonérée en vertu de l\'article 293 B du Code Général des Impôts ou d\'autres dispositions spécifiques selon la nature de l\'activité et la localisation du client.',
  responsibility: 'Responsabilité',
  providerCertifies: 'Le prestataire certifie que cette exonération est appliquée conformément à la législation fiscale française et européenne en vigueur.',
  
  // Auto-liquidation labels
  vatAutoLiquidation: 'AUTOLIQUIDATION DE LA TVA',
  vatChargeToClient: 'TVA à la charge du preneur conformément à l\'article 283-2 du CGI (auto-liquidation).',
  intraCommunityService: 'Dans le cadre de cette prestation intracommunautaire, la TVA est due par le preneur (client) dans son État membre conformément au mécanisme d\'autoliquidation prévu par la directive européenne 2006/112/CE et l\'article 283-2 du Code Général des Impôts français.',
  clientObligations: 'Obligations du client',
  clientMustDeclare: 'Le client est tenu de déclarer et de payer la TVA applicable dans son pays de résidence selon les taux et modalités en vigueur dans son État membre.',
  frenchProviderExempt: 'Le prestataire français est exonéré de TVA sur cette prestation, la responsabilité fiscale incombant entièrement au preneur établi dans l\'UE.',
  
  // Additional compliance fields
  companyPhone: 'Téléphone',
  companyEmail: 'Email',
  companyWebsite: 'Site web',
  professionalInsurance: 'Assurance responsabilité civile professionnelle',
  insuranceCompany: 'Compagnie d\'assurance',
  insurancePolicy: 'Police d\'assurance',
  insuranceCoverage: 'Couverture territoriale',
  
  // Client contact information
  clientPhone: 'Téléphone client',
  clientEmail: 'Email client',
  clientContact: 'Personne de contact',
  
  // Service details
  serviceCategory: 'Catégorie de service',
  serviceProvisionDate: 'Date de prestation',
  serviceLocation: 'Lieu de prestation',
  serviceDescription: 'Description détaillée du service',
  
  // Payment methods
  paymentMethod: 'Mode de paiement',
  paymentCash: 'Espèces',
  paymentCheck: 'Chèque',
  paymentTransfer: 'Virement bancaire',
  paymentCard: 'Carte bancaire',
  paymentOther: 'Autre',
  
  // Bank details
  bankDetails: 'Coordonnées bancaires',
  accountHolder: 'Titulaire du compte',
  
  // Legal compliance enhancements
  digitalSignature: 'Signature électronique',
  invoiceArchiving: 'Archivage de facture',
  archivingStatement: 'Cette facture est archivée conformément aux obligations légales françaises pour une durée de 10 ans.',
  complianceStatement: 'Facture conforme aux articles 289 et suivants du Code général des impôts.',
  
  // Advance payments
  advancePayment: 'Acompte versé',
  remainingAmount: 'Montant restant dû',
  
  // Technical format requirements
  invoiceFormat: 'Format de facture',
  electronicInvoice: 'Facture électronique',
  paperInvoice: 'Facture papier',
  
  // VAT status declarations
  vatNumberIntra: 'N° TVA intracommunautaire',
  vatExemptIntraEU: 'TVA exonérée - Livraison intracommunautaire',
  vatApplicableArticle256: 'TVA applicable selon l\'article 256 du CGI',
  
  // Professional activity codes
  nafCode: 'Code NAF',
  apeCodeFull: 'Code APE (Activité Principale Exercée)',
  
  // Additional legal mentions
  legalForm: 'Forme juridique',
  registrationNumber: 'Numéro d\'immatriculation',
  commercialCourt: 'Tribunal de commerce',
  
  // Penalty and interest rates
  penaltyRate: 'Taux de pénalité',
  interestRate: 'Taux d\'intérêt',
  fixedPenalty: 'Indemnité forfaitaire',
  
  // Invoice status
  invoiceStatus: 'Statut de la facture',
  invoicePaid: 'Payée',
  invoicePending: 'En attente',
  invoiceOverdue: 'En retard'
};

// Helper function to get French label
const getFrenchLabel = (key) => {
  return FRENCH_LABELS[key] || key;
};

module.exports = {
  FRENCH_LABELS,
  getFrenchLabel
};