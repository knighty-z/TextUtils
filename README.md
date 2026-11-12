# TextUtils – Your Everyday Text Toolkit

> **Transform your text. Simplify your work.**

TextUtils is a lightweight, privacy-first web application for formatting, transforming, and analyzing text directly inside the browser. Built as a B.Tech Computer Science and Engineering Minor Project (MIP) using pure **HTML5**, **CSS3**, and **Vanilla JavaScript**, it requires no backend, no database, and no external APIs.

---

## Key Features

### Live Text Editor & Real-Time Statistics
- **Clean Textarea Editor** with status indicator (`Empty Editor` / `Text Loaded`) and quick word/character count.
- **Quick Toolbar**: Paste from clipboard, Undo previous transformations (up to 30 history states), Copy, and Clear (with one-click Undo in toast).
- **Live Statistics**:
  - Total Characters (Unicode & emoji-aware via `Intl.Segmenter`)
  - Characters (No Spaces)
  - Total Words (handles empty input, tabs, and multiple spaces accurately)
  - Total Sentences
  - Total Paragraphs

### 23 Functional Text Tools Across 4 Categories

1. **Case Conversion**
   - `UPPERCASE` – Converts all letters to uppercase.
   - `lowercase` – Converts all letters to lowercase.
   - `Title Case` – Capitalizes the first letter of each word.
   - `Sentence Case` – Capitalizes the first letter of each sentence.
   - `Capitalize Each Word` – Capitalizes every word boundary and lowercases remaining letters.

2. **Space and Separator Tools**
   - `Remove Extra Spaces` – Trims leading/trailing spaces, collapses consecutive spaces, and preserves paragraph breaks.
   - `Remove All Spaces` – Strips all whitespace characters.
   - `Replace Spaces With Underscores` – Converts spaces (` `) to underscores (`_`).
   - `Replace Spaces With Hyphens` – Converts spaces (` `) to hyphens (`-`).
   - `Replace Underscores With Spaces` – Converts underscores (`_`) back to spaces (` `).
   - `Add Spaces Between Characters` – Inserts spaces between characters (emoji/grapheme safe).
   - `Remove Line Breaks` – Joins lines into space-separated text.

3. **Text Manipulation**
   - `Reverse Text` – Reverses the entire text safely while preserving emojis and Unicode characters.
   - `Reverse Each Word` – Reverses individual words in place while preserving order.
   - `Remove Duplicate Lines` – Removes repeated lines while preserving original order.
   - `Sort Lines Alphabetically` – Sorts lines in ascending alphabetical order.
   - `Remove Empty Lines` – Removes blank and whitespace-only lines.
   - `Find and Replace` – Modal dialog with live match count, case-sensitive toggle, and safe literal matching.

4. **Text Utilities**
   - `Copy Text` – Copies editor text using the Clipboard API with an automatic fallback.
   - `Download Text` – Downloads editor content as `textutils-output.txt`.
   - `Clear Text` – Clears the editor safely with Undo support.
   - `Select All` – Highlights all text in the editor.
   - `Remove Punctuation` – Removes punctuation marks while keeping letters, numbers, and emojis intact.

### Additional UX Features
- **Searchable Tools & Category Filters**: Filter tools instantaneously by name, description, or keywords, with an empty state when no tools match.
- **Dark & Light Themes**: Dark theme by default with smooth transitions and `localStorage` persistence for the theme preference only (user text is never stored).
- **Responsive Design**: Adapts cleanly across desktop, laptop, tablet, and mobile screens.

---

## Project Structure

```text
TextUtils/
├── assets/
│   └── logo.svg        # Brand SVG logo & favicon
├── index.html          # Semantic HTML5 structure
├── style.css           # Responsive dark/light styling and components
├── script.js           # Modular Vanilla JavaScript logic
└── README.md           # Project documentation
```

---

## How to Run Locally

Because TextUtils runs entirely in the browser with zero external dependencies:

### Option 1: Open Directly
Double-click `index.html` (or open it in any modern browser such as Chrome, Edge, or Firefox).

### Option 2: Run with a Local Development Server (Recommended)
Using Python:
```bash
cd TextUtils
python -m http.server 8080
```
Then visit `http://localhost:8080` in your browser.

Or using VS Code:
1. Open the `TextUtils` folder in VS Code.
2. Right-click `index.html` and select **Open with Live Server**.

---

## Privacy & Security
- **100% Client-Side**: All text transformations run locally in browser memory.
- **No Network Calls**: No user text is ever sent to any server or third-party API.
- **Safe DOM Updates**: Uses `textContent` and safe DOM creation without `eval()` or unsafe HTML injection.

---

© 2026 TextUtils. All rights reserved.
