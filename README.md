# GridShatter 🛡️

GridShatter is an interactive cloud architecture visualizer and dynamic security threat simulation sandbox. It parses Terraform HCL code and CircleCI YAML pipelines right in the browser, instantly converting raw code blocks into dynamic, interactive layouts. 

Once generated, developers can run a **Threat Attack Simulation** to see active breach drills executed on the canvas, showing how an attacker exploits configuration vulnerabilities in real-time. It also includes a client-side **Static Security Scanner** and a **Practice Arcade** with 14 cloud challenges to learn DevSecOps hands-on.

---

## ⚡ Features

- **Instant HCL & YAML Parsing**: Convert HCL configurations and CircleCI files to SVG architecture diagrams client-side.
- **Dynamic Threat Simulation**: Watch targeted resource nodes turn red as chronological exploit paths are executed.
- **Global Security Auditor**: Scans the parsed Abstract Syntax Tree (AST) for S3 exposure, unencrypted databases, IMDSv1 compute hosts, insecure security group rules, and overly permissive IAM roles.
- **Practice Arcade**: Progressive sandbox arcade containing 14 challenges checking HCL compliance.
- **Landing Page & Return Nav**: Features a sleek glassmorphic landing page with smooth transitions.

---

## 🛠️ Technology Stack

- **Core**: HTML5, Vanilla JavaScript (ES Modules)
- **Styling**: CSS3 Custom Design System (HSL tokens, glassmorphism)
- **Build Server**: ViteJS
- **Visuals**: Scalable Vector Graphics (SVG)

---

## 🤖 Codex & GPT-5.6 AI Integration

This project was built with AI-assisted pair programming using **Codex** and **GPT-5.6**:

### 1. Codex — Code Generation & Layout Coordinates
*   **SVG Layout Coordinate Engine**: Codex was used to draft the coordinate placement algorithms, ensuring child resources (like servers and databases) are dynamically positioned inside their parent subnets and VPCs without overlapping paths.
*   **Regex AST Parser Rules**: Leveraged Codex to generate pattern-matching rules inside our client-side parser to extract nested attributes (e.g. inline security group rules and bucket notification structures).

### 2. GPT-5.6 — DevSecOps Architecture & Threat Modeling
*   **Security Scanning Rules**: GPT-5.6 designed the static audit rules running against the compiled AST, detailing the specific severity levels, descriptions, and HCL code remediation recommendations.
*   **Threat Narrative Scripts**: Used GPT-5.6 to generate chronologically ordered, realistic attack step logs (such as S3 public directory listing traversal, metadata harvesting, and lateral role escalation) that drive the simulation console.

---

## 🚀 Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser to `http://localhost:3000`.

---

## 📦 Production Build

Compile and minify the static assets to the `dist/` directory:
```bash
npm run build
```
