/**
 * Netlify Function: github-list
 * Retrieves list of images from GitHub repository
 */

const fetch = require('node-fetch');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

exports.handler = async (event, context) => {
    try {
        // Fetch metadata from GitHub
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/metadata?ref=${GITHUB_BRANCH}`,
            {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const files = await response.json();
        
        // Filter JSON files and fetch each
        const imagePromises = files
            .filter(file => file.name.endsWith('.json'))
            .map(async (file) => {
                try {
                    const fileResponse = await fetch(file.download_url);
                    const metadata = await fileResponse.json();
                    return metadata;
                } catch (error) {
                    console.error(`Error fetching ${file.name}:`, error);
                    return null;
                }
            });

        const images = await Promise.all(imagePromises);
        const validImages = images.filter(img => img !== null);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=300' // 5 minute cache
            },
            body: JSON.stringify({
                success: true,
                count: validImages.length,
                images: validImages
            })
        };
    } catch (error) {
        console.error('List error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Failed to fetch images',
                message: error.message,
                images: []
            })
        };
    }
};