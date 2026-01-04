/**
 * Netlify Function: github-upload
 * Handles image uploads to GitHub repository
 */

const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse multipart form data
        const form = new FormData();
        const fields = event.body.split('\r\n');
        
        // Validate required fields
        if (!event.body.includes('image')) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'No image provided' })
            };
        }

        // Process image upload
        const timestamp = Date.now();
        const imageName = `${timestamp}-${Date.now()}.jpg`;
        const imageBase64 = Buffer.from(event.body).toString('base64');

        // Create GitHub API request
        const githubResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/images/${imageName}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `Add image: ${imageName}`,
                    content: imageBase64,
                    branch: GITHUB_BRANCH
                })
            }
        );

        if (!githubResponse.ok) {
            throw new Error('GitHub upload failed');
        }

        const githubData = await githubResponse.json();

        // Save metadata
        const metadata = {
            id: timestamp.toString(),
            filename: imageName,
            title: event.body.match(/title=([^\r\n]+)/)?.[1] || 'Untitled',
            description: event.body.match(/description=([^\r\n]+)/)?.[1] || '',
            tags: event.body.match(/tags=([^\r\n]+)/)?.[1]?.split(',') || [],
            category: event.body.match(/category=([^\r\n]+)/)?.[1] || 'other',
            aiTool: event.body.match(/aiTool=([^\r\n]+)/)?.[1] || '',
            license: event.body.match(/license=([^\r\n]+)/)?.[1] || 'cc0',
            date: new Date().toISOString(),
            url: `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/images/${imageName}`
        };

        // Save metadata to GitHub
        const metadataJson = JSON.stringify(metadata, null, 2);
        const metadataBase64 = Buffer.from(metadataJson).toString('base64');

        await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/metadata/${timestamp}.json`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Add metadata: ${timestamp}`,
                    content: metadataBase64,
                    branch: GITHUB_BRANCH
                })
            }
        );

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                imageId: metadata.id,
                message: 'Image uploaded successfully'
            })
        };
    } catch (error) {
        console.error('Upload error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Upload failed',
                message: error.message
            })
        };
    }
};