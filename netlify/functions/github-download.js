/**
 * Netlify Function: github-download
 * Handles image downloads from GitHub
 */

const fetch = require('node-fetch');

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
        const { imageId } = JSON.parse(event.body);
        
        if (!imageId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing imageId' })
            };
        }

        // Fetch metadata
        const metadataResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/metadata/${imageId}.json?ref=${GITHUB_BRANCH}`,
            {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3.raw'
                }
            }
        );

        if (!metadataResponse.ok) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Image not found' })
            };
        }

        const metadata = await metadataResponse.json();

        // Fetch actual image
        const imageResponse = await fetch(metadata.url, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`
            }
        });

        if (!imageResponse.ok) {
            throw new Error('Failed to fetch image');
        }

        const imageBuffer = await imageResponse.buffer();

        // Log download (optional - for analytics)
        console.log(`Image downloaded: ${metadata.title} (${imageId})`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': imageResponse.headers.get('content-type'),
                'Content-Disposition': `attachment; filename="${metadata.filename}"`,
                'Cache-Control': 'public, max-age=3600',
                'Access-Control-Allow-Origin': '*'
            },
            body: imageBuffer.toString('base64'),
            isBase64Encoded: true
        };
    } catch (error) {
        console.error('Download error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Download failed',
                message: error.message
            })
        };
    }
};