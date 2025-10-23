/**
 * Analytics Service
 * Track and analyze user behavior and patterns
 */

import { stateManager } from '../../core/state.js';
import { formatDate, isToday } from '../../shared/constants.js';

class AnalyticsService {
  /**
   * Get overall analytics
   */
  getOverallAnalytics() {
    const state = stateManager.getState();
    return state?.analytics || {};
  }

  /**
   * Get daily completion rate
   */
  getDailyCompletionRate() {
    const sites = stateManager.getSites();
    let totalCredentials = 0;
    let checkedCredentials = 0;

    sites.forEach(site => {
      site.credentials.forEach(credential => {
        totalCredentials++;
        if (credential.checkedInOn && isToday(credential.checkedInOn)) {
          checkedCredentials++;
        }
      });
    });

    const rate = totalCredentials > 0 
      ? (checkedCredentials / totalCredentials) * 100 
      : 0;

    return {
      total: totalCredentials,
      checked: checkedCredentials,
      pending: totalCredentials - checkedCredentials,
      rate: Math.round(rate)
    };
  }

  /**
   * Get check-in history for last N days
   */
  getCheckInHistory(days = 30) {
    const sites = stateManager.getSites();
    const history = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      let checkIns = 0;
      let total = 0;

      sites.forEach(site => {
        site.credentials.forEach(credential => {
          total++;
          if (credential.checkInHistory) {
            const hasCheckIn = credential.checkInHistory.some(entry => {
              const entryDate = new Date(entry.timestamp).toISOString().split('T')[0];
              return entryDate === dateString;
            });
            if (hasCheckIn) checkIns++;
          } else if (credential.checkedInOn) {
            const credDate = new Date(credential.checkedInOn).toISOString().split('T')[0];
            if (credDate === dateString) checkIns++;
          }
        });
      });

      history.unshift({
        date: dateString,
        checkIns,
        total,
        rate: total > 0 ? Math.round((checkIns / total) * 100) : 0
      });
    }

    return history;
  }

  /**
   * Get streak information
   */
  getStreakInfo() {
    const analytics = this.getOverallAnalytics();
    return {
      current: analytics.currentStreak || 0,
      longest: analytics.longestStreak || 0,
      lastCheckIn: analytics.lastCheckIn || null
    };
  }

  /**
   * Get category distribution
   */
  getCategoryDistribution() {
    const sites = stateManager.getSites();
    const categories = stateManager.getCategories();
    const distribution = {};

    // Initialize with all categories
    categories.forEach(cat => {
      distribution[cat.name] = {
        id: cat.id,
        count: 0,
        color: cat.color,
        icon: cat.icon
      };
    });

    // Add uncategorized
    distribution['Uncategorized'] = {
      id: null,
      count: 0,
      color: '#9ca3af',
      icon: '📦'
    };

    // Count sites per category
    sites.forEach(site => {
      const categoryId = site.category;
      if (categoryId) {
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          distribution[category.name].count++;
        } else {
          distribution['Uncategorized'].count++;
        }
      } else {
        distribution['Uncategorized'].count++;
      }
    });

    return distribution;
  }

  /**
   * Get most active times
   */
  getMostActiveTimes() {
    const sites = stateManager.getSites();
    const hourCounts = new Array(24).fill(0);

    sites.forEach(site => {
      site.credentials.forEach(credential => {
        if (credential.checkInHistory) {
          credential.checkInHistory.forEach(entry => {
            const hour = new Date(entry.timestamp).getHours();
            hourCounts[hour]++;
          });
        }
      });
    });

    return hourCounts.map((count, hour) => ({
      hour,
      count,
      label: this.formatHour(hour)
    }));
  }

  /**
   * Get weekly pattern
   */
  getWeeklyPattern() {
    const sites = stateManager.getSites();
    const dayCounts = new Array(7).fill(0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    sites.forEach(site => {
      site.credentials.forEach(credential => {
        if (credential.checkInHistory) {
          credential.checkInHistory.forEach(entry => {
            const day = new Date(entry.timestamp).getDay();
            dayCounts[day]++;
          });
        }
      });
    });

    return dayCounts.map((count, index) => ({
      day: dayNames[index],
      count
    }));
  }

  /**
   * Get password health overview
   */
  getPasswordHealthOverview() {
    const sites = stateManager.getSites();
    let strong = 0;
    let moderate = 0;
    let weak = 0;
    let total = 0;

    sites.forEach(site => {
      site.credentials.forEach(credential => {
        total++;
        const strength = credential.strength?.toLowerCase() || 'unknown';
        
        if (strength.includes('strong') || strength.includes('very strong')) {
          strong++;
        } else if (strength.includes('moderate') || strength.includes('good')) {
          moderate++;
        } else {
          weak++;
        }
      });
    });

    return {
      total,
      strong,
      moderate,
      weak,
      strongPercent: total > 0 ? Math.round((strong / total) * 100) : 0,
      moderatePercent: total > 0 ? Math.round((moderate / total) * 100) : 0,
      weakPercent: total > 0 ? Math.round((weak / total) * 100) : 0
    };
  }

  /**
   * Get top sites by usage
   */
  getTopSites(limit = 5) {
    const sites = stateManager.getSites();
    
    const sitesWithCheckIns = sites.map(site => {
      let totalCheckIns = 0;
      site.credentials.forEach(credential => {
        if (credential.checkInHistory) {
          totalCheckIns += credential.checkInHistory.length;
        }
      });

      return {
        id: site.id,
        name: site.name,
        checkIns: totalCheckIns,
        credentialCount: site.credentials.length
      };
    });

    return sitesWithCheckIns
      .sort((a, b) => b.checkIns - a.checkIns)
      .slice(0, limit);
  }

  /**
   * Get neglected sites (not checked in long time)
   */
  getNeglectedSites(days = 30) {
    const sites = stateManager.getSites();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return sites.filter(site => {
      if (!site.credentials || site.credentials.length === 0) return false;

      const lastCheckIn = site.credentials.reduce((latest, cred) => {
        if (!cred.checkedInOn) return latest;
        const credDate = new Date(cred.checkedInOn);
        return credDate > latest ? credDate : latest;
      }, new Date(0));

      return lastCheckIn < cutoffDate;
    }).map(site => ({
      id: site.id,
      name: site.name,
      lastCheckIn: this.getLastCheckInDate(site),
      daysSince: this.getDaysSince(this.getLastCheckInDate(site))
    }));
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const analytics = this.getOverallAnalytics();
    const completion = this.getDailyCompletionRate();

    return {
      totalSites: stateManager.getSites().length,
      totalCredentials: completion.total,
      totalCheckIns: analytics.totalCheckIns || 0,
      averageDaily: analytics.averageDaily || 0,
      currentStreak: analytics.currentStreak || 0,
      completionRate: completion.rate
    };
  }

  /**
   * Get monthly summary
   */
  getMonthlySummary() {
    const history = this.getCheckInHistory(30);
    const totalCheckIns = history.reduce((sum, day) => sum + day.checkIns, 0);
    const avgCheckIns = totalCheckIns / history.length;
    const bestDay = history.reduce((best, day) => 
      day.checkIns > best.checkIns ? day : best, 
      { checkIns: 0 }
    );

    return {
      totalCheckIns,
      avgCheckIns: Math.round(avgCheckIns),
      bestDay: bestDay.date,
      bestDayCheckIns: bestDay.checkIns,
      daysActive: history.filter(day => day.checkIns > 0).length
    };
  }

  /**
   * Export analytics data
   */
  exportAnalytics() {
    return {
      overall: this.getOverallAnalytics(),
      completion: this.getDailyCompletionRate(),
      history: this.getCheckInHistory(90),
      streak: this.getStreakInfo(),
      categories: this.getCategoryDistribution(),
      activeTimes: this.getMostActiveTimes(),
      weeklyPattern: this.getWeeklyPattern(),
      passwordHealth: this.getPasswordHealthOverview(),
      topSites: this.getTopSites(10),
      neglectedSites: this.getNeglectedSites(30),
      metrics: this.getPerformanceMetrics(),
      monthly: this.getMonthlySummary(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Helper: Format hour
   */
  formatHour(hour) {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  }

  /**
   * Helper: Get last check-in date for site
   */
  getLastCheckInDate(site) {
    if (!site.credentials || site.credentials.length === 0) return null;

    const lastCheckIn = site.credentials.reduce((latest, cred) => {
      if (!cred.checkedInOn) return latest;
      const credDate = new Date(cred.checkedInOn);
      return credDate > latest ? credDate : latest;
    }, new Date(0));

    return lastCheckIn.getTime() > 0 ? lastCheckIn.toISOString() : null;
  }

  /**
   * Helper: Get days since date
   */
  getDaysSince(dateString) {
    if (!dateString) return Infinity;
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();