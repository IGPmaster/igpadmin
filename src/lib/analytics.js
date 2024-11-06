// src/lib/analytics.js
import { config } from './config';

export async function getCloudflareAnalytics(brandId) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
  
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/graphql`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.CF_IMAGES_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetZoneAnalytics($zoneTag: string, $since: string, $until: string) {
              viewer {
                zones(filter: { zoneTag: $zoneTag }) {
                  httpRequests1dGroups(
                    limit: 1
                    filter: { date_geq: $since, date_leq: $until }
                  ) {
                    sum {
                      requests
                      pageViews
                      threats
                      bytes
                    }
                    dimensions {
                      date
                    }
                  }
                }
              }
            }
          `,
          variables: {
            zoneTag: getBrandZoneId(brandId),
            since: thirtyDaysAgo.toISOString().split('T')[0],
            until: new Date().toISOString().split('T')[0],
          }
        })
      }
    );

    const data = await response.json();
    return formatAnalyticsData(data);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }
}

// Helper function to format analytics data
function formatAnalyticsData(data) {
  try {
    const analytics = data.data.viewer.zones[0].httpRequests1dGroups[0].sum;
    return {
      requests24h: formatNumber(analytics.requests),
      pageViews24h: formatNumber(analytics.pageViews),
      threats24h: analytics.threats,
      bandwidth: formatBytes(analytics.bytes),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error formatting analytics data:', error);
    return null;
  }
}

// Helper function to format large numbers
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Helper function to format bytes
function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
}

// Map brand IDs to Cloudflare zone IDs
function getBrandZoneId(brandId) {
  // You'll need to maintain this mapping
  const zoneMap = {
    '12': 'zone_id_for_hippozino',
    '239': 'zone_id_for_jazzyspins',
    // Add other brands...
  };
  return zoneMap[brandId];
}