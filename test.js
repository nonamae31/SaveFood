const fs = require('fs');

async function test() {
    const baseUrl = 'http://localhost:5251/api';

    // 1. Register a new user
    const regRes = await fetch(`${baseUrl}/Users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test_mcp@example.com', password: 'password123', fullName: 'Test MCP User', phoneNumber: '0123456789' })
    });
    console.log('Register:', await regRes.text());

    // We can't easily test OTP because it's sent to console/email, wait, I mocked it to send to console in previous sessions? No, I used real MailKit, but wait! The email is test_mcp@example.com. It will fail or be sent. If it's sent, how do I get the OTP?
    // I can read it from the DB!
    console.log('Done');
}

test();
