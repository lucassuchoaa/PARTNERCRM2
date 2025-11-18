#!/usr/bin/env node

/**
 * Test Upload Script
 * Tests file upload functionality end-to-end
 * Usage: node scripts/test-upload.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const UPLOAD_ENDPOINT = `${API_URL}/api/upload`;

async function createTestFile() {
  const testContent = `
# Test File for Upload
This is a test file created to verify the upload functionality.

## Details
- Created: ${new Date().toISOString()}
- Purpose: Testing Supabase Storage upload
- Size: Small test file

## Features Being Tested
- File upload to Supabase Storage
- Public URL generation
- Folder organization
- File metadata
  `.trim();

  const testFilePath = path.join(__dirname, 'test-upload.txt');
  fs.writeFileSync(testFilePath, testContent);

  return testFilePath;
}

async function testUpload() {
  console.log('🧪 Testing Upload Functionality\n');
  console.log('=================================\n');

  try {
    // Create test file
    console.log('📝 Creating test file...');
    const testFilePath = createTestFile();
    const fileStats = fs.statSync(testFilePath);
    console.log(`✅ Test file created: ${path.basename(testFilePath)} (${fileStats.size} bytes)\n`);

    // Prepare form data
    console.log('📦 Preparing upload...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('folder', 'test-uploads');

    // Upload file
    console.log('⬆️  Uploading to:', UPLOAD_ENDPOINT);
    const response = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    console.log('\n✅ Upload successful!\n');
    console.log('📊 Upload Result:');
    console.log('├─ File Name:', result.data.fileName);
    console.log('├─ Original Name:', result.data.originalName);
    console.log('├─ Path:', result.data.path);
    console.log('├─ Size:', result.data.size, 'bytes');
    console.log('├─ MIME Type:', result.data.mimeType);
    console.log('└─ Public URL:', result.data.url);

    // Test public URL accessibility
    console.log('\n🔗 Testing public URL accessibility...');
    const urlTest = await fetch(result.data.url);

    if (urlTest.ok) {
      console.log('✅ Public URL is accessible!\n');
    } else {
      console.log(`⚠️  Warning: Public URL returned status ${urlTest.status}\n`);
    }

    // Clean up test file
    console.log('🧹 Cleaning up test file...');
    fs.unlinkSync(testFilePath);
    console.log('✅ Cleanup complete\n');

    console.log('=================================');
    console.log('🎉 All tests passed successfully!');
    console.log('=================================\n');

    return result.data;

  } catch (error) {
    console.error('\n❌ Upload test failed!\n');
    console.error('Error:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Tip: Make sure the dev server is running:');
      console.error('   npm run dev\n');
    } else if (error.message.includes('Bucket not found')) {
      console.error('\n💡 Tip: Create the storage bucket in Supabase:');
      console.error('   1. Go to Supabase → Storage');
      console.error('   2. Create bucket: partner-files (PUBLIC)\n');
    } else if (error.message.includes('Supabase not configured')) {
      console.error('\n💡 Tip: Configure Supabase environment variables:');
      console.error('   SUPABASE_URL=your-project-url');
      console.error('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n');
    }

    process.exit(1);
  }
}

// Run test
testUpload();
