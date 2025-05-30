// xml-preprocessor.go - Preprocesses SCAP content to handle embedded JavaScript and other XML parsing issues
package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// XMLPreprocessor handles cleaning up SCAP content files for proper XML parsing
type XMLPreprocessor struct {
	inputPath  string
	outputPath string
	patterns   []CleanupPattern
}

// CleanupPattern defines regex patterns and replacements for cleaning XML
type CleanupPattern struct {
	pattern     *regexp.Regexp
	replacement string
	description string
}

// NewXMLPreprocessor creates a new preprocessor instance
func NewXMLPreprocessor(inputPath, outputPath string) *XMLPreprocessor {
	preprocessor := &XMLPreprocessor{
		inputPath:  inputPath,
		outputPath: outputPath,
	}

	// Initialize cleanup patterns for common issues
	preprocessor.initializePatterns()
	return preprocessor
}

// initializePatterns sets up regex patterns to clean up problematic content
func (xp *XMLPreprocessor) initializePatterns() {
	xp.patterns = []CleanupPattern{
		// Remove inline JavaScript/jQuery code that breaks XML parsing
		{
			pattern:     regexp.MustCompile(`!function\([^}]*\}\([^)]*\)[^;]*;`),
			replacement: "",
			description: "Remove inline JavaScript functions",
		},
		// Clean up malformed entity references
		{
			pattern:     regexp.MustCompile(`&([^;#\s]*[^;])(?=[^;]*(?:;|$))`),
			replacement: "&amp;$1",
			description: "Fix malformed entity references",
		},
		// Escape unescaped ampersands in attributes
		{
			pattern:     regexp.MustCompile(`(\w+="[^"]*?)&([^;][^"]*?")`),
			replacement: "$1&amp;$2",
			description: "Escape unescaped ampersands in attributes",
		},
		// Remove problematic script tags that aren't properly CDATA wrapped
		{
			pattern:     regexp.MustCompile(`<script[^>]*>[\s\S]*?</script>`),
			replacement: "",
			description: "Remove script tags",
		},
		// Clean up malformed HTML entities in text content
		{
			pattern:     regexp.MustCompile(`([^&]|^)&([a-zA-Z]+)([^;]|$)`),
			replacement: "$1&amp;$2$3",
			description: "Fix HTML entities without semicolons",
		},
		// Handle jQuery-style selectors that break XML
		{
			pattern:     regexp.MustCompile(`\$\([^)]*\)\.[\w().]*`),
			replacement: "",
			description: "Remove jQuery selectors",
		},
		// Clean up malformed JavaScript object notation
		{
			pattern:     regexp.MustCompile(`\{[^}]*"[^"]*"[^}]*:[^}]*\}`),
			replacement: "",
			description: "Remove JavaScript object literals",
		},
	}
}

// ProcessFile cleans the input SCAP file and writes a sanitized version
func (xp *XMLPreprocessor) ProcessFile() error {
	fmt.Printf("🧹 Preprocessing SCAP content: %s\n", filepath.Base(xp.inputPath))

	// Open input file
	inputFile, err := os.Open(xp.inputPath)
	if err != nil {
		return fmt.Errorf("failed to open input file: %v", err)
	}
	defer inputFile.Close()

	// Create output file
	outputFile, err := os.Create(xp.outputPath)
	if err != nil {
		return fmt.Errorf("failed to create output file: %v", err)
	}
	defer outputFile.Close()

	// Process file line by line to handle large files efficiently
	scanner := bufio.NewScanner(inputFile)
	writer := bufio.NewWriter(outputFile)
	defer writer.Flush()

	lineNumber := 0
	issuesFound := 0
	inCDATA := false
	inScript := false

	for scanner.Scan() {
		lineNumber++
		line := scanner.Text()

		// Track CDATA sections - don't modify content inside CDATA
		if strings.Contains(line, "<![CDATA[") {
			inCDATA = true
		}
		if strings.Contains(line, "]]>") {
			inCDATA = false
		}

		// Track script sections
		if strings.Contains(line, "<script") {
			inScript = true
		}
		if strings.Contains(line, "</script>") {
			inScript = false
			// Skip the entire script line
			fmt.Fprintf(writer, "<!-- Script content removed for XML compatibility -->\n")
			continue
		}

		// Skip script content entirely
		if inScript {
			continue
		}

		originalLine := line

		// Apply cleanup patterns only if not in CDATA
		if !inCDATA {
			for _, pattern := range xp.patterns {
				if pattern.pattern.MatchString(line) {
					line = pattern.pattern.ReplaceAllString(line, pattern.replacement)
					if line != originalLine {
						issuesFound++
						fmt.Printf("  📝 Line %d: %s\n", lineNumber, pattern.description)
					}
				}
			}
		}

		// Write the processed line
		fmt.Fprintf(writer, "%s\n", line)
	}

	if err := scanner.Err(); err != nil {
		return fmt.Errorf("error reading file: %v", err)
	}

	fmt.Printf("✅ Preprocessing complete: %d issues resolved, %d lines processed\n", issuesFound, lineNumber)
	return nil
}

// ValidateXML performs basic XML validation on the processed file
func (xp *XMLPreprocessor) ValidateXML() error {
	// Simple validation - check for basic XML structure
	file, err := os.Open(xp.outputPath)
	if err != nil {
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	tagStack := []string{}
	lineNum := 0

	for scanner.Scan() {
		lineNum++
		line := strings.TrimSpace(scanner.Text())

		// Skip comments and processing instructions
		if strings.HasPrefix(line, "<!--") || strings.HasPrefix(line, "<?") {
			continue
		}

		// Look for tags
		if strings.Contains(line, "<") && strings.Contains(line, ">") {
			// Very basic tag matching - this is not a full XML parser
			// but catches obvious issues
			if strings.Contains(line, "</") {
				// Closing tag - should match something on stack
				if len(tagStack) == 0 {
					return fmt.Errorf("unmatched closing tag at line %d", lineNum)
				}
				tagStack = tagStack[:len(tagStack)-1]
			} else if !strings.Contains(line, "/>") {
				// Opening tag (not self-closing)
				tagStack = append(tagStack, "tag")
			}
		}
	}

	fmt.Printf("✅ Basic XML validation passed\n")
	return nil
}

// CleanupTempFile removes the temporary preprocessed file
func (xp *XMLPreprocessor) CleanupTempFile() error {
	if xp.outputPath != xp.inputPath {
		return os.Remove(xp.outputPath)
	}
	return nil
}

// Main function for standalone usage
func main() {
	if len(os.Args) < 3 {
		fmt.Println("Usage: xml-preprocessor <input-file> <output-file>")
		os.Exit(1)
	}

	preprocessor := NewXMLPreprocessor(os.Args[1], os.Args[2])

	if err := preprocessor.ProcessFile(); err != nil {
		fmt.Printf("❌ Error processing file: %v\n", err)
		os.Exit(1)
	}

	if err := preprocessor.ValidateXML(); err != nil {
		fmt.Printf("⚠️  XML validation warning: %v\n", err)
	}

	fmt.Println("🎯 XML preprocessing completed successfully")
}
