package main

import (
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

type FileSummary struct {
	Path       string
	RelPath    string
	Language   string
	Signatures []string
	RawContent string
	Lines      int
}

var (
	ignoredDirs = map[string]bool{
		".git":         true,
		".idea":        true,
		".gradle":      true,
		"gradle":       true,
		"build":        true,
		"target":       true,
		"node_modules": true,
		"assets":       true,
		"bin":          true,
		"obj":          true,
		"res":          true, // UI layout xmls not needed for AST
	}

	binaryExts = map[string]bool{
		".apk":   true,
		".exe":   true,
		".jpg":   true,
		".jpeg":  true,
		".png":   true,
		".gif":   true,
		".ico":   true,
		".dll":   true,
		".so":    true,
		".dylib": true,
		".zip":   true,
		".tar":   true,
		".gz":    true,
		".lock":  true,
	}
)

var (
	rustSigRegex   = regexp.MustCompile(`(?m)^\s*(pub\s+)?(async\s+)?(fn|struct|enum|trait|type|impl)\s+.*$`)
	kotlinSigRegex = regexp.MustCompile(`(?m)^\s*(@\w+(\(.*\))?\s+)*(public\s+|private\s+|protected\s+|internal\s+|override\s+|open\s+|abstract\s+|suspend\s+|inline\s+)*(class|interface|object|fun|data class|enum class)\s+.*$`)
)

func extractSignatures(content string, lang string) []string {
	var results []string
	lines := strings.Split(content, "\n")
	var regex *regexp.Regexp

	switch lang {
	case "Rust":
		regex = rustSigRegex
	case "Kotlin":
		regex = kotlinSigRegex
	default:
		return nil
	}

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "//") || strings.HasPrefix(trimmed, "/*") || strings.HasPrefix(trimmed, "*") {
			continue
		}
		if regex.MatchString(line) {
			clean := strings.TrimRight(trimmed, "{;")
			if len(clean) > 0 {
				results = append(results, clean)
			}
		}
	}
	return results
}

func getLanguage(ext string) string {
	switch ext {
	case ".rs":
		return "Rust"
	case ".kt":
		return "Kotlin"
	case ".toml":
		return "TOML (Manifest)"
	case ".kts":
		return "Gradle (Manifest)"
	default:
		return "Other"
	}
}

func main() {
	repoDir := flag.String("repo", "D:/HF_challenge-1/temp_repos/Android-cam", "Path to repository to ingest")
	outputFile := flag.String("out", "scripts/ingester/ingested_repo.md", "Output markdown path")
	flag.Parse()

	absRepo, err := filepath.Abs(*repoDir)
	if err != nil {
		fmt.Printf("Error resolving repo path: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Ingesting repository: %s\n", absRepo)

	var treeLines []string
	var summaries []FileSummary
	totalFiles := 0
	totalLines := 0

	err = filepath.WalkDir(absRepo, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		rel, err := filepath.Rel(absRepo, path)
		if err != nil {
			return err
		}

		if d.IsDir() {
			base := d.Name()
			if ignoredDirs[base] {
				return filepath.SkipDir
			}
			depth := strings.Count(rel, string(filepath.Separator))
			if rel != "." {
				indent := strings.Repeat("  ", depth)
				treeLines = append(treeLines, fmt.Sprintf("%s📁 %s/", indent, base))
			}
			return nil
		}

		ext := strings.ToLower(filepath.Ext(path))
		if binaryExts[ext] {
			return nil
		}

		// Only inspect code & manifests
		lang := getLanguage(ext)
		if lang == "Other" && !strings.HasSuffix(path, ".md") {
			return nil
		}

		depth := strings.Count(rel, string(filepath.Separator))
		indent := strings.Repeat("  ", depth)
		treeLines = append(treeLines, fmt.Sprintf("%s📄 %s", indent, d.Name()))

		contentBytes, err := os.ReadFile(path)
		if err != nil {
			return nil
		}
		content := string(contentBytes)
		linesCount := strings.Count(content, "\n") + 1
		totalLines += linesCount
		totalFiles++

		summary := FileSummary{
			Path:     path,
			RelPath:  filepath.ToSlash(rel),
			Language: lang,
			Lines:    linesCount,
		}

		// Focus on key manifests
		if strings.HasSuffix(path, "Cargo.toml") || strings.HasSuffix(path, "app/build.gradle.kts") {
			summary.RawContent = content
		} else if lang == "Rust" || lang == "Kotlin" {
			summary.Signatures = extractSignatures(content, lang)
		}

		summaries = append(summaries, summary)
		return nil
	})

	if err != nil {
		fmt.Printf("Error walking repo: %v\n", err)
		os.Exit(1)
	}

	var out strings.Builder
	out.WriteString("# Codebase AST & Architecture Digest: Android-cam\n\n")

	out.WriteString("## 1. Directory Tree & Architecture Hierarchy\n```text\n")
	out.WriteString(strings.Join(treeLines, "\n"))
	out.WriteString("\n```\n\n")

	out.WriteString("## 2. Package Manifests (Dependencies & Libraries)\n\n")
	for _, s := range summaries {
		if s.RawContent != "" {
			out.WriteString(fmt.Sprintf("### `%s`\n```\n%s\n```\n\n", s.RelPath, strings.TrimSpace(s.RawContent)))
		}
	}

	out.WriteString("## 3. Extracted Code Structure & AST Signatures\n\n")
	for _, s := range summaries {
		if len(s.Signatures) > 0 {
			out.WriteString(fmt.Sprintf("### `%s` [%s - %d lines]\n```%s\n", s.RelPath, s.Language, s.Lines, strings.ToLower(s.Language)))
			for _, sig := range s.Signatures {
				out.WriteString(sig + "\n")
			}
			out.WriteString("```\n\n")
		}
	}

	outputContent := out.String()
	err = os.WriteFile(*outputFile, []byte(outputContent), 0644)
	if err != nil {
		fmt.Printf("Error writing output file: %v\n", err)
		os.Exit(1)
	}

	approxTokens := len(outputContent) / 4
	fmt.Printf("Ingestion Complete!\n")
	fmt.Printf("Scanned: %d files, %d total lines of code\n", totalFiles, totalLines)
	fmt.Printf("Output File: %s (%d bytes, ~%d estimated tokens)\n", *outputFile, len(outputContent), approxTokens)
}
