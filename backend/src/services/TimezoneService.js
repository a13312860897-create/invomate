class TimezoneService {
  constructor() {
    this.defaultTimezone = 'UTC';
  }

  detectUserTimezone(options = {}) {
    const { timezoneHeader, user, clientTimezone, ip } = options;

    if (timezoneHeader && this.isValidTimezone(timezoneHeader)) {
      return timezoneHeader;
    }

    if (user && user.timezone && this.isValidTimezone(user.timezone)) {
      return user.timezone;
    }

    if (clientTimezone && this.isValidTimezone(clientTimezone)) {
      return clientTimezone;
    }

    if (ip) {
      const timezoneFromIP = this.getTimezoneFromIP(ip);
      if (timezoneFromIP) {
        return timezoneFromIP;
      }
    }

    return this.defaultTimezone;
  }

  isValidTimezone(timezone) {
    try {
      new Intl.DateTimeFormat('en', { timeZone: timezone });
      return true;
    } catch (error) {
      return false;
    }
  }

  getTimezoneFromIP(ip) {
    if (ip.startsWith('210.') || ip.startsWith('211.') || ip.startsWith('218.') || ip.startsWith('219.')) {
      return 'Asia/Shanghai';
    }
    if (ip.startsWith('8.') || ip.startsWith('17.') || ip.startsWith('35.')) {
      return 'America/New_York';
    }
    if (ip.startsWith('81.') || ip.startsWith('88.')) {
      return 'Europe/London';
    }
    return null;
  }

  getCurrentMonthForTimezone(timezone) {
    if (!this.isValidTimezone(timezone)) {
      timezone = this.defaultTimezone;
    }

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit'
    });

    const parts = formatter.formatToParts(now);
    const year = parts.find(part => part.type === 'year').value;
    const month = parts.find(part => part.type === 'month').value;

    return `${year}-${month}`;
  }

  getCommonTimezones() {
    return {
      'Asia': ['Asia/Shanghai', 'Asia/Tokyo', 'Asia/Singapore', 'Asia/Kolkata', 'Asia/Dubai'],
      'America': ['America/New_York', 'America/Los_Angeles', 'America/Chicago', 'America/Toronto', 'America/Sao_Paulo'],
      'Europe': ['Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Moscow'],
      'Pacific': ['Australia/Sydney', 'Pacific/Auckland'],
      'Africa': ['Africa/Cairo', 'Africa/Johannesburg'],
      'UTC': ['UTC']
    };
  }
}

module.exports = new TimezoneService();