/**
 * ForgeBoard Documentation Builder
 * 
 * This script:
 * - Uses marked as the core Markdown parser/renderer
 * - Adds marked-attributes plugin to support {.class} syntax
 * - Includes custom renderer to map inline styles to standard classes
 * - Processes all .md files in assets/documentation
 * - Outputs HTML files to dist/docs/
 */

import { marked } from 'marked';
import { glob } from 'glob';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Configure marked options
marked.setOptions({ 
  gfm: true,
  headerIds: true,
  mangle: false
});

// Add custom renderer to convert inline styles to standardized classes
const renderer = new marked.Renderer();

// Original renderer functions
const originalHeading = renderer.heading.bind(renderer);
const originalParagraph = renderer.paragraph.bind(renderer);
const originalLink = renderer.link.bind(renderer);
const originalHtml = renderer.html.bind(renderer);

// Style to class mapping
const styleToClassMap = {
  // Background colors
  'background-color:#002868': 'status-card blue',
  'background-color: #002868': 'status-card blue',
  'background-color:#BF0A30': 'status-card red',
  'background-color: #BF0A30': 'status-card red',
  'background-color:#F9C74F': 'status-card gold',
  'background-color: #F9C74F': 'status-card gold',
  'background-color:#90BE6D': 'status-card green',
  'background-color: #90BE6D': 'status-card green',
  'background-color:#FFFFFF': 'status-card white',
  'background-color: #FFFFFF': 'status-card white',
  'background-color:#F5F5F5': 'footer-container',
  'background-color: #F5F5F5': 'footer-container'
};

// Custom HTML renderer to convert style attributes to classes
renderer.html = (html) => {
  if (!html) return originalHtml(html);
  
  // Process any div with style attribute
  let processedHtml = html;
  
  // Find and replace style attributes with class names
  Object.entries(styleToClassMap).forEach(([stylePattern, className]) => {
    // Create a regex that matches the style pattern within a style attribute
    const styleRegex = new RegExp(`style="([^"]*${stylePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"]*)"`, 'gi');
    
    processedHtml = processedHtml.replace(styleRegex, (match, styleContent) => {
      // Remove the matched style from the style attribute
      const newStyleContent = styleContent.replace(stylePattern, '').trim();
      
      // If there are remaining styles, keep the style attribute with those
      const styleAttr = newStyleContent ? `style="${newStyleContent}"` : '';
      
      // Return with added class name
      return `class="${className}" ${styleAttr}`.trim();
    });
  });

  return originalHtml(processedHtml);
};

/**
 * Process a markdown file and convert to HTML
 */
async function processMarkdownFile(filePath) {
  try {
    console.log(`Processing: ${filePath}`);
    const markdown = await readFile(filePath, 'utf-8');
    
    // Parse markdown with custom renderer
    const html = marked.parse(markdown, { renderer });
    
    // Create output path
    const baseName = path.basename(filePath, '.md');
    const outputDir = 'dist/docs';
    const outputPath = path.join(outputDir, `${baseName}.html`);
    
    // Ensure output directory exists
    await mkdir(outputDir, { recursive: true });
    
    // Add HTML wrapper with proper styling
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ForgeBoard Documentation - ${baseName}</title>
  <style>
    :root {
      --primary-blue: #002868;
      --primary-red: #BF0A30;
      --accent-gold: #F9C74F;
      --accent-green: #90BE6D;
      --text-color: #333;
      --bg-color: #FFFFFF;
      --footer-bg: #F5F5F5;
      --border-color: #DDD;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: var(--text-color);
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }
    
    h1 img {
      vertical-align: middle;
      margin-right: 10px;
    }
    
    .status-card {
      padding: 8px 12px;
      border-radius: 6px;
      flex: 1;
      min-width: 150px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      margin-bottom: 10px;
      display: inline-block;
      margin-right: 10px;
    }
    
    .blue {
      background-color: var(--primary-blue);
      color: white;
    }
    
    .red {
      background-color: var(--primary-red);
      color: white;
    }
    
    .gold {
      background-color: var(--accent-gold);
      color: var(--text-color);
    }
    
    .green {
      background-color: var(--accent-green);
      color: var(--text-color);
    }
    
    .white {
      background-color: var(--bg-color);
      color: var(--text-color);
      border: 1px solid var(--border-color);
    }
    
    .footer-container {
      background-color: var(--footer-bg);
      padding: 15px;
      border-radius: 6px;
      margin-top: 30px;
      border-top: 3px solid var(--primary-red);
    }
    
    code {
      background-color: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
    }
    
    pre code {
      display: block;
      padding: 10px;
      overflow-x: auto;
      background-color: #f8f8f8;
      border: 1px solid #ddd;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 20px;
    }
    
    table, th, td {
      border: 1px solid #ddd;
    }
    
    th, td {
      padding: 10px;
      text-align: left;
    }
    
    th {
      background-color: #f5f5f5;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
    
    // Write HTML file
    await writeFile(outputPath, fullHtml);
    console.log(`Created: ${outputPath}`);
    return outputPath;
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
    return null;
  }
}

/**
 * Main function to process all markdown files
 */
async function buildDocs() {
  console.log('ForgeBoard Documentation Builder');
  console.log('================================');
  
  try {
    // Find all markdown files in documentation directory
    const files = await glob('assets/documentation/**/*.md');
    
    if (files.length === 0) {
      // Also check the frontend path
      const frontendFiles = await glob('forgeboard-frontend/src/assets/documentation/**/*.md');
      if (frontendFiles.length === 0) {
        console.log('No documentation files found!');
        return;
      }
      files.push(...frontendFiles);
    }
    
    console.log(`Found ${files.length} documentation files`);
    
    // Process each markdown file in parallel
    const results = await Promise.all(files.map(processMarkdownFile));
    
    // Filter out any null results (failed processing)
    const successfulFiles = results.filter(Boolean);
    
    console.log(`\nSuccessfully processed ${successfulFiles.length} files`);
    console.log(`Documentation available in the dist/docs/ directory`);
  } catch (err) {
    console.error('Error building documentation:', err);
    process.exit(1);
  }
}

// Execute main function
buildDocs().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
