# THWS Beamer Template

## Introduction

This repository contains the **THWS Beamer Template**, a LaTeX package designed to create presentation slides in the **corporate design of the Technical University of Applied Sciences Würzburg-Schweinfurt (THWS)**. The template offers a consistent and professional layout with options to customize colors, logos, and bullet symbols. It also includes several pre-defined environments for different slide types, such as title slides, content slides, and literature references.

## How to Use the Template

1. **Install the package:**
   - Copy the `thwsbeamertheme.sty` file into your project directory.

2. **Include the package in your LaTeX document:**

   ```latex
   \documentclass{beamer}
   \usepackage{thwsbeamertheme}
   ```

3. **Set optional parameters if needed:**

   ```latex
   \usepackage[bs=\bullet, bc=thwsorange, titlebg=thwsblue, refbg=thwsgrey, thwslogoh=thws-logo_horiz_de_white.png, thwslogov=thws-logo_vert_de_orange-rgb.png]{thwsbeamertheme}
   ```

4. **Create your slides:**

   ```latex
   \begin{document}

   \begin{frame}
       \titlepage
   \end{frame}

   \begin{itemframe}{Key Points}
       \item Introduction to THWS Beamer Template
       \item Customization options
       \item Example usage
   \end{itemframe}

   \end{document}
   ```

## Customization Options

The template provides several options for customization:

### 1. Bullet Symbols (`bs`)

- **Description:** Customize the bullet symbol for itemize lists.
- **Default:** `\blacksquare`
- **Examples:**

  ```latex
  \usepackage[bs=\bullet]{thwsbeamertheme}    % Standard bullet
  \usepackage[bs=\blacktriangleright]{thwsbeamertheme}  % Triangle bullet
  \usepackage[bs=\bigstar]{thwsbeamertheme}   % Star bullet
  ```

### 2. Bullet Color (`bc`)

- **Description:** Define the color of bullet symbols.
- **Default:** `thwsorange`
- **Example:**

  ```latex
  \usepackage[bc=thwsblue]{thwsbeamertheme}  % Blue bullets
  ```

### 3. Title Slide Background (`titlebg`)

- **Description:** Customize the background color of the title slide.
- **Default:** `thwsblue`
- **Example:**

  ```latex
  \usepackage[titlebg=thwsgrey]{thwsbeamertheme}  % Grey title background
  ```

### 4. Literature Slide Background (`refbg`)

- **Description:** Define the background color for literature slides.
- **Default:** `thwsgrey`
- **Example:**

  ```latex
  \usepackage[refbg=thwsblue]{thwsbeamertheme}  % Blue literature background
  ```

### 5. Logos (`thwslogoh` and `thwslogov`)

- **Description:** Set custom file paths for horizontal and vertical THWS logos.
- **Defaults:**
  - Horizontal: `thws-logo_horiz_de_white.png`
  - Vertical: `thws-logo_vert_de_orange-rgb.png`
- **Example:**

  ```latex
  \usepackage[thwslogoh=mylogo.png, thwslogov=mylogo_vert.png]{thwsbeamertheme}
  ```

### 6. Title Color (`titlecolor`)

- **Description:** Set color for title on title page
- **Defaults:** `thwsorange`

### 7. Author Color (`authorcolor`)

- **Description:** Set color for author name on title page
- **Default:** `thwsorange`

### 8. Speaker Space (`speakerspace` and `nospekerspace`)

- **Description:** Define space for the speaker on the right slide of frames `contentsframe` and `itemframe`
- **Default:** `nospeakerspace`

## New Commands and Environments

### 1. `sectionframe` Environment

- **Purpose:** Creates a slide with a blue background and a large title for section separation.
- **Usage:**

  ```latex
  \begin{sectionframe}{Introduction}
      % Content here
  \end{sectionframe}
  ```

### 2. `speakersectionframe` Environment

- **Purpose:** Similar to `sectionframe` but includes space for speaker notes.
- **Usage:**

  ```latex
  \begin{speakersectionframe}{Overview}
      % Content here
  \end{speakersectionframe}
  ```

### 3. `contentsframe` Environment

- **Purpose:** For content slides with speaker notes on the right side.
- **Usage:**

  ```latex
  \begin{contentsframe}{Main Topics}
      \item Topic 1
      \item Topic 2
  \end{contentsframe}
  ```

### 4. `itemframe` Environment

- **Purpose:** Simplifies itemized lists on slides.
- **Usage:**

  ```latex
  \begin{itemframe}{Key Points}
      \item First point
      \item Second point
  \end{itemframe}
  ```

### 5. `fullframe` Environment

- **Purpose:** For slides that use the entire frame without speaker notes.
- **Usage:**

  ```latex
  \begin{fullframe}{Title}
      % Content here
  \end{fullframe}
  ```

### 6. `literature` Environment

- **Purpose:** For slides listing references with a custom background color.
- **Usage:**

  ```latex
  \begin{literature}{References}
      \item Reference 1
      \item Reference 2
  \end{literature}
  ```

### 7. `\vspacedef` Command

- **Purpose:** Adds vertical space in itemize lists.
- **Usage:**

  ```latex
  \item First point
  \vspacedef
  \item Second point
  ```

### 8. Source Code

This style file defines multiple custom environments for code listings using the listings package in LaTeX. Each environment is tailored for a specific programming language (e.g., java, bash, python, xml) with consistent formatting: line numbers, small font, framed boxes, and left indentation. Additionally, specialized environments like htmlcssjs support hybrid syntax highlighting for HTML, CSS, and JavaScript. This setup ensures readable, syntax-highlighted code blocks that integrate well into presentations, especially in Beamer.

## License

This template is provided under the **MIT License**. Feel free to modify and distribute it.

For any issues or suggestions, please open an **issue on GitHub**.

