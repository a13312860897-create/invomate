// 法语标签映射 - 统一管理发票系统中的所有法语文本
// French Labels Mapping - Centralized management of all French text in the invoice system

export const FRENCH_LABELS = {
  // 发票基本信息 / Invoice Basic Information
  invoice: 'Facture',
  invoiceNumber: 'Numéro de facture',
  invoiceDate: 'Date de facture',
  dueDate: 'Date d\'échéance',
  issueDate: 'Date d\'émission',
  serviceDate: 'Date de prestation',
  
  // 发票类型 / Invoice Types
  invoiceTypes: {
    standard: 'Facture standard',
    credit: 'Note de crédit',
    debit: 'Note de débit',
    proforma: 'Facture pro forma',
    advance: 'Facture d\'acompte',
    final: 'Facture de solde'
  },
  
  // 公司信息 / Company Information
  from: 'Émetteur',
  to: 'Destinataire',
  companyName: 'Raison sociale',
  address: 'Adresse',
  billingAddress: 'Adresse de facturation',
  deliveryAddress: 'Adresse de livraison',
  phone: 'Téléphone',
  email: 'Email',
  vatNumber: 'Numéro de TVA',
  sirenNumber: 'Numéro SIREN',
  siretNumber: 'Numéro SIRET',
  rcsNumber: 'RCS',
  nafCode: 'Code NAF',
  legalForm: 'Forme juridique',
  registeredCapital: 'Capital social',
  
  // 客户信息 / Client Information
  clientName: 'Nom du client',
  clientEmail: 'Email du client',
  clientPhone: 'Téléphone du client',
  clientAddress: 'Adresse du client',
  
  // 发票项目 / Invoice Items
  description: 'Description',
  quantity: 'Quantité',
  unitPrice: 'Prix unitaire',
  taxRate: 'Taux de TVA',
  amount: 'Montant',
  total: 'Total',
  
  // 计算金额 / Calculations
  subtotal: 'Sous-total HT',
  totalTax: 'Total TVA',
  grandTotal: 'Total TTC',
  totalHT: 'Total HT',
  totalTTC: 'Total TTC',
  
  // TVA 相关 / VAT Related
  tva: 'TVA',
  tvaExempt: 'Exonération de TVA',
  tvaExemptClause: 'Clause d\'exonération',
  autoLiquidation: 'Autoliquidation',
  vatApplicable: 'TVA applicable',
  vatExempt: 'TVA non applicable',
  
  // 模板相关 / Template Related
  template: 'Modèle',
  selectTemplate: 'Sélectionner un modèle',
  frenchTemplate: 'Modèle français',
  standardVAT: 'TVA standard',
  exemptVAT: 'TVA exonérée',
  autoLiquidationVAT: 'Autoliquidation TVA',
  
  // 操作按钮 / Action Buttons
  preview: 'Aperçu',
  download: 'Télécharger',
  print: 'Imprimer',
  send: 'Envoyer',
  save: 'Enregistrer',
  create: 'Créer',
  edit: 'Modifier',
  delete: 'Supprimer',
  cancel: 'Annuler',
  
  // 邮件相关 / Email Related
  sendEmail: 'Envoyer par email',
  emailSubject: 'Objet de l\'email',
  emailMessage: 'Message de l\'email',
  emailContent: 'Contenu de l\'email',
  sendingMethod: 'Méthode d\'envoi',
  
  // 状态信息 / Status Information
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
  
  // 表单验证 / Form Validation
  required: 'Champ obligatoire',
  invalidEmail: 'Email invalide',
  invalidNumber: 'Nombre invalide',
  itemsRequired: 'Au moins un article est requis',
  
  // 备注和条款 / Notes and Terms
  notes: 'Notes',
  
  // 法律条款 / Legal Terms
  legalTerms: 'Conditions légales',
  hiddenDefectsWarranty: 'Garantie des vices cachés',
  paymentConditions: 'Conditions de paiement',
  propertyReservation: 'Réserve de propriété',
  disputeResolution: 'Règlement des litiges',
  vatInformation: 'Information TVA',
  bankingDetails: 'Coordonnées bancaires',
  
  // 银行信息 / Banking Information
  iban: 'IBAN',
  bic: 'BIC/SWIFT',
  bank: 'Banque',
  accountHolder: 'Titulaire du compte',
  
  // 付款信息 / Payment Information
  paymentDue: 'Échéance de paiement',
  paymentMethod: 'Mode de paiement',
  earlyPaymentDiscount: 'Escompte pour paiement anticipé',
  latePenalties: 'Pénalités de retard',
  recoveryFee: 'Indemnité forfaitaire pour frais de recouvrement',
  
  // 通用文本 / Common Text
  yes: 'Oui',
  no: 'Non',
  none: 'Aucun',
  optional: 'Optionnel',
  loading: 'Chargement...',
  error: 'Erreur',
  success: 'Succès',
  
  // 地址相关 / Address Related
  city: 'Ville',
  postalCode: 'Code postal',
  country: 'Pays',
  sameAsBilling: 'Identique à l\'adresse de facturation',
  
  // 数量和单位 / Quantities and Units
  unit: 'Unité',
  hours: 'Heures',
  days: 'Jours',
  pieces: 'Pièces',
  
  // 货币 / Currency
  currency: 'Devise',
  euro: 'Euro',
  
  // 日期格式 / Date Format
  dateFormat: 'jj/mm/aaaa',
  
  // 消息文本 / Message Text
  defaultEmailSubject: 'Facture #{invoiceNumber}',
  defaultEmailMessage: 'Bonjour,\n\nVeuillez trouver ci-joint votre facture.\n\nCordialement,',
  
  // 成功/错误消息 / Success/Error Messages
  invoiceCreated: 'Facture créée avec succès',
  invoiceUpdated: 'Facture mise à jour avec succès',
  invoiceSent: 'Facture envoyée avec succès',
  invoiceDeleted: 'Facture supprimée avec succès',
  emailSent: 'Email envoyé avec succès',
  pdfGenerated: 'PDF généré avec succès',
  
  // 错误消息 / Error Messages
  createError: 'Erreur lors de la création de la facture',
  updateError: 'Erreur lors de la mise à jour de la facture',
  sendError: 'Erreur lors de l\'envoi de la facture',
  deleteError: 'Erreur lors de la suppression de la facture',
  emailError: 'Erreur lors de l\'envoi de l\'email',
  pdfError: 'Erreur lors de la génération du PDF',
  
  // 提示信息 / Hint Messages
  templateHint: 'Sélectionnez un modèle pour voir les changements dans l\'aperçu',
  invoiceTypeHint: 'Champ obligatoire pour les factures françaises',
  serviceDateHint: 'Date de prestation de service (obligatoire en France)',
  
  // 合规信息 / Compliance Information
  frenchCompliance: 'Conformité française',
  complianceAdded: 'Exigences de conformité française ajoutées',
  
  // TVA 状态文本 / VAT Status Text
  vatStatus: {
    standard: 'Statut TVA: TVA applicable selon l\'article 256 du Code général des impôts. Numéro de TVA intracommunautaire: {vatNumber}',
    exempt: 'Statut TVA: TVA Exonérée selon l\'article 262 ter I du Code général des impôts (CGI) - Livraisons intracommunautaires de biens',
    autoLiquidation: 'Statut TVA: Autoliquidation de la TVA par le preneur selon l\'article 283-1 du Code général des impôts (CGI) - Prestations de services B to B'
  }
};

// 获取法语标签的辅助函数
export const getFrenchLabel = (key, fallback = '') => {
  const keys = key.split('.');
  let value = FRENCH_LABELS;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return fallback || key;
    }
  }
  
  return value || fallback || key;
};

// 格式化法语消息的辅助函数
export const formatFrenchMessage = (template, variables = {}) => {
  let message = template;
  Object.keys(variables).forEach(key => {
    const placeholder = `{${key}}`;
    message = message.replace(new RegExp(placeholder, 'g'), variables[key]);
  });
  return message;
};