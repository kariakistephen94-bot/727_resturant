export interface SiteSettings {
  businessName: string;
  phone: string;
  siteTitle: string;
  siteDescription: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  openingTime: string;
  closingTime: string;
  minimumOrder: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export const defaultSiteSettings: SiteSettings = {
  businessName: '724 Restaurant And Bar',
  phone: '+234 813 841 7565',
  siteTitle: 'Good Food. Cold Drinks. Open 24/7.',
  siteDescription: 'From char-grilled fish with jollof to pounded yam with rich egusi and spicy isi ewu 724 Restaurant And Bar serves Agidingbi\'s favourite plates and chilled drinks round the clock, every single day.',
  address: 'NERDC Rd, Agidingbi',
  city: 'Ikeja',
  state: 'Lagos',
  zipCode: '101233',
  openingTime: '00:00',
  closingTime: '23:59',
  minimumOrder: 2000,
  maintenanceMode: false,
  maintenanceMessage: 'We are currently under maintenance. Please try again later.',
  bankName: 'OPay',
  accountName: '724 Restaurant And Bar',
  accountNumber: '123456789',
};

export interface SiteSettingsRow {
  id: number;
  business_name: string;
  phone: string;
  site_title: string;
  site_description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  opening_time: string;
  closing_time: string;
  delivery_fee: string | number;
  minimum_order: string | number;
  maintenance_mode: boolean;
  maintenance_message: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  updated_at: string;
}

export function mapSiteSettingsRow(row: Partial<SiteSettingsRow> | null): SiteSettings {
  if (!row) {
    return defaultSiteSettings;
  }

  return {
    businessName: row.business_name ?? defaultSiteSettings.businessName,
    phone: row.phone ?? defaultSiteSettings.phone,
    siteTitle: row.site_title ?? defaultSiteSettings.siteTitle,
    siteDescription: row.site_description ?? defaultSiteSettings.siteDescription,
    address: row.address ?? defaultSiteSettings.address,
    city: row.city ?? defaultSiteSettings.city,
    state: row.state ?? defaultSiteSettings.state,
    zipCode: row.zip_code ?? defaultSiteSettings.zipCode,
    openingTime: row.opening_time ?? defaultSiteSettings.openingTime,
    closingTime: row.closing_time ?? defaultSiteSettings.closingTime,
    minimumOrder: Number(row.minimum_order ?? defaultSiteSettings.minimumOrder),
    maintenanceMode: row.maintenance_mode ?? defaultSiteSettings.maintenanceMode,
    maintenanceMessage: row.maintenance_message ?? defaultSiteSettings.maintenanceMessage,
    bankName: row.bank_name ?? defaultSiteSettings.bankName,
    accountName: row.account_name ?? defaultSiteSettings.accountName,
    accountNumber: row.account_number ?? defaultSiteSettings.accountNumber,
  };
}

export function mapSiteSettingsToRow(settings: SiteSettings): Partial<SiteSettingsRow> {
  return {
    id: 1,
    business_name: settings.businessName,
    phone: settings.phone,
    site_title: settings.siteTitle,
    site_description: settings.siteDescription,
    address: settings.address,
    city: settings.city,
    state: settings.state,
    zip_code: settings.zipCode,
    opening_time: settings.openingTime,
    closing_time: settings.closingTime,
    minimum_order: settings.minimumOrder,
    maintenance_mode: settings.maintenanceMode,
    maintenance_message: settings.maintenanceMessage,
    bank_name: settings.bankName,
    account_name: settings.accountName,
    account_number: settings.accountNumber,
  };
}
