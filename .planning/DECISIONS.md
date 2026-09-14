# Architectural & UX Decisions Log

This document serves as the "certified" logic repository for Sanjha. Every technical, architectural, and psychological UX decision made during development is recorded here, backed by professional theory, mathematical constraints, and industry standards.

## 1. Architecture & Infrastructure

### 1.1. Modular Monolith (FastAPI)
- **What it solves:** Avoids the operational complexity of deploying and orchestrating multiple microservices.
- **Why we chose it:** According to *Conway's Law* and modern architectural consensus (e.g., Shopify, GitHub), a modular monolith is the mathematically optimal starting point for MVP scaling. It minimizes network latency between components while keeping boundaries clean for future separation.

### 1.2. Supabase Test OTPs for Authentication
- **What it solves:** Hackathons often fail due to third-party SMS gateway limits, telecom blocking (DLT regulations in India), or latency.
- **Why we chose it:** By mocking the SMS layer but keeping the cryptographic JWT validation layer intact, we guarantee 100% demo reliability. It adheres to the *Principle of Least Astonishment* for judges, ensuring a frictionless login flow without telecom dependencies.

### 1.3. Anti-Spam Verification (Geo-tagging & AI Vision)
- **What it solves:** Civic platforms inevitably succumb to "Tragedy of the Commons" via spam, leading to stakeholder fatigue (CSR/Universities ignoring the platform).
- **Why we chose it:** Using GPS enforcement and GPT-4o Vision introduces a *High Friction / High Quality* funnel. Psychologically, if users know their image is being actively verified by AI, the *Deterrence Theory* suggests malicious actors will self-select out of spamming the platform.

---

## 2. UI/UX & Psychological Design

### 2.1. Apple HIG Touch Targets (Minimum 44pt)
- **What it solves:** Prevents "fat-finger" errors and user frustration on mobile devices.
- **Why we chose it:** Backed by **Fitts's Law** ($T = a + b \log_2(1 + \frac{D}{W})$), which states that the time to acquire a target is a function of the distance to and size of the target. By strictly enforcing a 44x44pt bounding box on every interactive element, we mathematically minimize physical cognitive load and error rates.

### 2.2. Progressive Disclosure (Minimal Text)
- **What it solves:** Overwhelming the user with tracking histories, policies, and heavy text upon first load.
- **Why we chose it:** Backed by **Hick's Law** ($RT = a + b \log_2(n)$), which proves that increasing the number of choices logarithmically increases decision time. By hiding complex data inside smooth "Drawers" and "Bottom Sheets" until explicitly requested, we reduce the visual stimuli, keeping the interface psychologically "tempting" and frictionless.

### 2.3. Framer Motion (Fluid & Scroll Animations)
- **What it solves:** The "uncanny valley" of digital interfaces where static, instant state changes feel jarring and broken to the human brain.
- **Why we chose it:** The human brain relies on *Spatial Memory* and *Object Permanence*. Using spring physics (mass, stiffness, damping) rather than linear CSS transitions mimics real-world physics. When a fake report is deleted and the list organically glides up, the brain intuitively understands the state change without requiring a mental context switch.

### 2.4. 12-Column Centered Desktop Grid (Max 1200px)
- **What it solves:** Prevents horizontal eye-strain on ultra-wide monitors.
- **Why we chose it:** Based on *Saccadic eye movement* research, optimal reading line length is between 45 and 75 characters. By capping the content width at 1200px and centering it within a 12-column grid, we constrain the visual sweep, preventing the user's focal point from tiring, adhering to standard typographical geometry.

## 3. Security & Session Management

### 3.1. httpOnly Cookie JWT Storage
- **What it solves:** Prevents Cross-Site Scripting (XSS) attacks from stealing user JWT session tokens.
- **Why we chose it:** A strict adherence to enterprise security constraints. Instead of storing the Supabase JWT in React\'s localStorage, the FastAPI backend natively sets a Secure, httpOnly, SameSite=Lax cookie upon OTP verification. The React application never directly touches the token, meaning malicious JavaScript injected into the DOM mathematically cannot access the session.

### 3.2. Rate-Limiting Authentication
- **What it solves:** Prevents SMS brute-force spamming and telecom cost inflation.
- **Why we chose it:** By restricting /api/auth/send-otp to a strict IP-based sliding window (5 requests per 60 seconds), we mitigate credential stuffing vectors before they reach the database layer.
