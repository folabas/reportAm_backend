const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: data ? JSON.parse(data) : {} });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function testApi() {
    console.log('Starting API Verification...');
    let passed = true;

    // 1. Test Public Reports GET
    try {
        console.log('\nTesting GET /reports...');
        const res = await makeRequest(`${BASE_URL}/reports`);

        if (res.status === 200 && Array.isArray(res.data.reports)) {
            console.log('✅ GET /reports returned array');
            if (res.data.reports.length > 0) {
                const first = res.data.reports[0];
                console.log('Sample report:', JSON.stringify(first, null, 2));

                if (typeof first.lga === 'string' || first.lga === null || first.lga === undefined) {
                    console.log('✅ Report.lga is flat string (or null)');
                } else {
                    console.error('❌ Report.lga is NOT a string:', typeof first.lga, first.lga);
                    passed = false;
                }

                if (typeof first.state === 'string') {
                    console.log('✅ Report.state is flat string');
                } else {
                    console.error('❌ Report.state is NOT a string:', typeof first.state);
                    passed = false;
                }
            } else {
                console.log('⚠️ No reports found to verify structure');
            }
        } else {
            console.error('❌ GET /reports did not return reports array', res.status);
            passed = false;
        }
    } catch (e) {
        console.error('❌ Failed to fetch reports:', e.message);
        if (e.code === 'ECONNREFUSED') {
            console.error('Server possibly not running. Please start the server.');
            return;
        }
        passed = false;
    }

    // 2. Test Admin Comments Security
    try {
        console.log('\nTesting GET /admin/comments (Unauthorized)...');
        const res = await makeRequest(`${BASE_URL}/admin/comments`);
        if (res.status === 401) {
            console.log('✅ GET /admin/comments correctly returned 401 Unauthorized');
        } else {
            console.error(`❌ GET /admin/comments failed with unexpected status: ${res.status}`);
            passed = false;
        }
    } catch (e) {
        console.error('❌ Request failed:', e.message);
        passed = false;
    }

    // 3. Test Admin Stats Security
    try {
        console.log('\nTesting GET /admin/reports/stats (Unauthorized)...');
        const res = await makeRequest(`${BASE_URL}/admin/reports/stats`);
        if (res.status === 401) {
            console.log('✅ GET /admin/reports/stats correctly returned 401 Unauthorized');
        } else {
            console.error(`❌ GET /admin/reports/stats failed with unexpected status: ${res.status}`);
            passed = false;
        }
    } catch (e) {
        console.error('❌ Request failed:', e.message);
        passed = false;
    }

    if (passed) {
        console.log('\n✅ All verification tests passed!');
    } else {
        console.log('\n❌ Some verification tests failed.');
    }
}

testApi();
