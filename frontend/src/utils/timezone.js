// Timezone utilities

/**
 * Get the user's configured timezone.
 * @returns {string} Timezone string, e.g., 'Europe/Paris'
 */
export const getUserTimezone = () => {
  // Prefer user-defined timezone from local storage
  const userTimezone = localStorage.getItem('userTimezone');
  if (userTimezone) {
    return userTimezone;
  }
  
  // Fallback to stored user profile (if available)
  const userProfile = localStorage.getItem('userProfile');
  if (userProfile) {
    try {
      const profile = JSON.parse(userProfile);
      if (profile.timezone) {
        return profile.timezone;
      }
    } catch (error) {
      console.warn('Failed to parse user profile:', error);
    }
  }
  
  // Default to browser timezone or Europe/Paris
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';
};

/**
 * Set the user's timezone.
 * @param {string} timezone - Timezone string
 */
export const setUserTimezone = (timezone) => {
  localStorage.setItem('userTimezone', timezone);
};

/**
 * Convert a date to local time in a specified timezone.
 * @param {Date|string} date - Date object or ISO string
 * @param {string} timezone - Target timezone, defaults to user timezone
 * @returns {Date} Converted date
 */
export const convertToTimezone = (date, timezone = null) => {
  const targetTimezone = timezone || getUserTimezone();
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Get target timezone offset (minutes)
  const targetOffset = getTimezoneOffset(dateObj, targetTimezone);
  const utcOffset = dateObj.getTimezoneOffset();
  
  // Calculate difference (minutes)
  const offsetDiff = targetOffset - utcOffset;
  
  // Create new date object with offset applied
  const result = new Date(dateObj.getTime() + (offsetDiff * 60 * 1000));
  return result;
};

/**
 * Format a date as a localized string in a timezone.
 * @param {Date|string} date - Date object or ISO string
 * @param {Object} options - Formatting options
 * @param {string} options.timezone - Target timezone, defaults to user timezone
 * @param {string} options.format - Format type: 'date', 'datetime', 'time', 'full'
 * @param {boolean} options.includeSeconds - Include seconds in output
 * @returns {string} Formatted date string
 */
export const formatDateInTimezone = (date, options = {}) => {
  const {
    timezone = getUserTimezone(),
    format = 'date',
    includeSeconds = false
  } = options;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Use Intl.DateTimeFormat for locale-aware formatting
  let formatOptions = {};
  
  switch (format) {
    case 'date':
      formatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: timezone
      };
      break;
    case 'datetime':
      formatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      };
      if (includeSeconds) {
        formatOptions.second = '2-digit';
      }
      break;
    case 'time':
      formatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      };
      if (includeSeconds) {
        formatOptions.second = '2-digit';
      }
      break;
    case 'full':
      formatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      };
      break;
    default:
      formatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: timezone
      };
  }
  
  try {
    return new Intl.DateTimeFormat('en-US', formatOptions).format(dateObj);
  } catch (error) {
    console.warn('Date formatting failed:', error);
    // Fallback: simple local formatting
    return dateObj.toLocaleString('en-US');
  }
};

/**
 * Get timezone offset in minutes for a given timezone.
 * @param {Date} date - Date
 * @param {string} timezone - Timezone
 * @returns {number} Offset in minutes
 */
const getTimezoneOffset = (date, timezone) => {
  try {
    // Use Intl.DateTimeFormat to derive timezone offset
    const format = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    const parts = format.formatToParts(date);
    const tzDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                           parseInt(parts.find(p => p.type === 'hour')?.value || '0'),
                           parseInt(parts.find(p => p.type === 'minute')?.value || '0'),
                           parseInt(parts.find(p => p.type === 'second')?.value || '0'));
    
    return -tzDate.getTimezoneOffset();
  } catch (error) {
    console.warn('Failed to get timezone offset:', error);
    // Fallback: return 0 offset
    return 0;
  }
};

/**
 * Get common timezone options for UI selection.
 * @returns {Array} Timezone options list
 */
export const getCommonTimezones = () => {
  return [
    { value: 'Europe/Paris', label: 'Europe/Paris (UTC+1/+2)' },
    { value: 'Europe/London', label: 'Europe/London (UTC+0/+1)' },
    { value: 'America/New_York', label: 'America/New_York (UTC-5/-4)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (UTC-8/-7)' },
    { value: 'America/Chicago', label: 'America/Chicago (UTC-6/-5)' },
    { value: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+8)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (UTC+4)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC+8)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (UTC+10/+11)' },
    { value: 'Australia/Melbourne', label: 'Australia/Melbourne (UTC+10/+11)' },
    { value: 'Pacific/Auckland', label: 'Pacific/Auckland (UTC+12/+13)' },
    { value: 'UTC', label: 'Coordinated Universal Time (UTC+0)' }
  ];
};

export default {
  getUserTimezone,
  setUserTimezone,
  convertToTimezone,
  formatDateInTimezone,
  getCommonTimezones
};