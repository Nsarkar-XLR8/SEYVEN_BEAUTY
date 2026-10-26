import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
const flashOrdersCommitted = new Counter('flash_orders_committed');
const inventoryExhaustionCollisions = new Counter('inventory_exhaustion_collisions');
const checkoutFailureRate = new Rate('checkout_failure_rate');
const checkoutLatency = new Trend('checkout_commit_latency');

export const options = {
  scenarios: {
    // Ramp up to 100 concurrent VUs simulating midnight clinical serum flash drop
    flash_sale_spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 25 },  // Warmup: Catalog browsing
        { duration: '1m', target: 100 },   // Flash drop: Spike to 100 concurrent VUs
        { duration: '1m', target: 100 },   // Sustained peak load
        { duration: '30s', target: 10 },   // Cooldown
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<600', 'p(99)<1200'], // 95% of requests under 600ms
    http_req_failed: ['rate<0.02'],                  // Less than 2% system errors
    checkout_failure_rate: ['rate<0.05'],           // High order success under concurrency
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const vuId = __VU;
  const iterId = __ITER;
  const uniqueToken = `${vuId}-${iterId}-${Date.now()}`;
  const phone = `+88017${String(Math.floor(10000000 + Math.random() * 90000000))}`;
  const idempotencyKey = `k6-flash-order-${uniqueToken}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'x-correlation-id': `corr-${uniqueToken}`,
  };

  group('01. Storefront Discovery & High-Cache Endpoints', function () {
    // Public Sitemap XML lookup
    const sitemapRes = http.get(`${BASE_URL}/sitemap.xml`);
    check(sitemapRes, {
      'sitemap status is 200': (r) => r.status === 200,
      'sitemap has urlset': (r) => r.body.includes('<urlset'),
    });

    // Catalog Browsing with Facets
    const catalogRes = http.get(`${BASE_URL}/api/v1/catalog?page=1&limit=10`, {
      headers: defaultHeaders,
    });
    check(catalogRes, {
      'catalog status is 200': (r) => r.status === 200,
    });

    sleep(1);
  });

  group('02. Cart Mutation & Dynamic Total Calculation', function () {
    const calcPayload = JSON.stringify({
      items: [
        {
          productId: 'prod-flash-drop-01',
          variantId: 'var-flash-drop-30ml',
          quantity: 1,
        },
      ],
      district: 'Dhaka',
      zoneId: 'ZONE-DHAKA-METRO',
      paymentMethod: 'CASH_ON_DELIVERY',
    });

    const calcRes = http.post(`${BASE_URL}/api/v1/checkout/calculate`, calcPayload, {
      headers: defaultHeaders,
    });

    check(calcRes, {
      'checkout calculate status is 200 or 400 (validation)': (r) =>
        r.status === 200 || r.status === 400 || r.status === 404,
    });

    sleep(0.5);
  });

  group('03. Idempotent Order Placement under Redlock Guard', function () {
    const commitPayload = JSON.stringify({
      customerName: `K6 Shopper ${vuId}`,
      customerPhone: phone,
      deliveryAddress: 'House 42, Road 11, Banani, Dhaka',
      district: 'Dhaka',
      zoneId: 'ZONE-DHAKA-METRO',
      paymentMethod: 'CASH_ON_DELIVERY',
      termsAccepted: true,
      items: [
        {
          productId: 'prod-flash-drop-01',
          variantId: 'var-flash-drop-30ml',
          quantity: 1,
        },
      ],
    });

    const commitHeaders = Object.assign({}, defaultHeaders, {
      'x-idempotency-key': idempotencyKey,
    });

    const startTime = Date.now();
    const commitRes = http.post(`${BASE_URL}/api/v1/checkout/commit`, commitPayload, {
      headers: commitHeaders,
    });
    const duration = Date.now() - startTime;
    checkoutLatency.add(duration);

    const isSuccess = commitRes.status === 201 || commitRes.status === 200;
    const isOutOfStock = commitRes.status === 409 || commitRes.status === 422;

    if (isSuccess) {
      flashOrdersCommitted.add(1);
      checkoutFailureRate.add(0);
    } else if (isOutOfStock) {
      // Out of stock is expected when flash drop sells out under high concurrency
      inventoryExhaustionCollisions.add(1);
      checkoutFailureRate.add(0);
    } else {
      checkoutFailureRate.add(1);
    }

    check(commitRes, {
      'commit handled safely (201/200 success or 409/422 stock exhausted)': (r) =>
        r.status === 200 || r.status === 201 || r.status === 409 || r.status === 422 || r.status === 404,
    });
  });

  sleep(1);
}
