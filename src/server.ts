import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { config as loadEnv } from "dotenv";
import { getMemberByRollNumber, listMembers } from "./store";

loadEnv();

const app = express();
const port = process.env.PORT || 3000;
const BASE_URL =
  process.env.BASE_URL || `http://localhost:${String(port).trim()}`;

app.use(cors());
app.use(bodyParser.json());

const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

app.get("/api/members", (_req, res) => {
  const members = listMembers();
  const normalizedBase = BASE_URL.replace(/\/+$/u, "");
  const membersWithLinks = members.map((m) => ({
    ...m,
    verifyUrl: `${normalizedBase}/${encodeURIComponent(m.rollNumber)}`,
  }));
  res.json({ members: membersWithLinks });
});

app.get("/api/members/by-roll/:rollNumber", (req, res) => {
  const { rollNumber } = req.params;
  const member = getMemberByRollNumber(rollNumber);
  if (!member) {
    return res.status(404).json({ error: "Member not found." });
  }
  res.json({ member });
});

app.get("/:rollNumber", (req, res) => {
  const { rollNumber } = req.params;
  if (!/^\d+$/u.test(rollNumber)) {
    return res.status(404).send("Not found");
  }
  const member = getMemberByRollNumber(rollNumber);
  const title = "AU CSSM Member Verification";

  if (!member) {
    return res
      .status(404)
      .send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <canvas id="bg-canvas"></canvas>
    <div class="page-wrap">
      <header class="site-header glass">
        <div class="brand">
          <img src="/logo.png" alt="AU CSSM Logo" class="logo" onerror="this.style.display='none'" />
          <div class="brand-text">
            <h1>Air University Cyber Security Society (MUL)</h1>
            <p>Member Card Verification</p>
          </div>
        </div>
      </header>
      <main class="content">
        <section class="card glass verify-card">
          <div class="verify-panel">
            <div class="verify-panel-header">
              <h2>Member Verification</h2>
              <span class="status-pill not-verified">Status: ❌ Not Verified</span>
            </div>
            <p class="subtitle">
              This roll number is not found in the official AU CSSM verified registry.
            </p>
            <div class="verify-grid">
              <div class="verify-item">
                <span class="verify-label">Roll Number</span>
                <span class="verify-value">Unavailable</span>
              </div>
              <div class="verify-item">
                <span class="verify-label">Name</span>
                <span class="verify-value">Unavailable</span>
              </div>
              <div class="verify-item">
                <span class="verify-label">Department</span>
                <span class="verify-value">Unavailable</span>
              </div>
              <div class="verify-item">
                <span class="verify-label">Designation</span>
                <span class="verify-value">Unavailable</span>
              </div>
              <div class="verify-item">
                <span class="verify-label">Session</span>
                <span class="verify-value">Unavailable</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer class="site-footer glass">
        <div class="footer-left">
          <p>
            Contact:
            <a href="mailto:ausccm.official@gmail.com">ausccm.official@gmail.com</a>
          </p>
        </div>
        <div class="footer-right">
          <a href="https://pk.linkedin.com/company/aucssm" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://www.instagram.com/aucssm" target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
      </footer>
    </div>
    <script src="/particles.js" type="module"></script>
  </body>
</html>`);
  }

  const issued = new Date(member.createdAt);
  const issuedText = Number.isNaN(issued.getTime())
    ? ""
    : issued.toLocaleString();

  return res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <canvas id="bg-canvas"></canvas>
    <div class="page-wrap">
      <header class="site-header glass">
        <div class="brand">
          <img src="/logo.png" alt="AU CSSM Logo" class="logo" onerror="this.style.display='none'" />
          <div class="brand-text">
            <h1>Air University Cyber Security Society (MUL)</h1>
            <p>Member Card Verification</p>
          </div>
        </div>
      </header>
      <main class="content">
        <section class="card glass verify-card">
          <div class="verify-panel">
            <div class="verify-panel-header">
              <h2>Member Verification</h2>
              <span class="status-pill verified">Status: ✅ Verified</span>
            </div>
            <p class="subtitle">This member is verified by Air University Cyber Security Society Multan.</p>
            <div class="verify-grid">
              <div class="verify-item">
                <span class="verify-label">Roll Number</span>
                <span class="verify-value">${member.rollNumber}</span>
              </div>
              <div class="verify-item">
                <span class="verify-label">Name</span>
                <span class="verify-value">${member.name}</span>
              </div>
              <div class="verify-item">
                <span class="verify-label">Department</span>
                <span class="verify-value">${member.department}</span>
              </div>
              <div class="verify-item">
                <span class="verify-label">Designation</span>
                <span class="verify-value">${member.designation}</span>
              </div>
              <div class="verify-item">
                <span class="verify-label">Session</span>
                <span class="verify-value">${member.session}</span>
              </div>
              ${
                issuedText
                  ? `<div class="verify-item">
                <span class="verify-label">Issued On</span>
                <span class="verify-value">${issuedText}</span>
              </div>`
                  : ""
              }
            </div>
          </div>
        </section>
      </main>
      <footer class="site-footer glass">
        <div class="footer-left">
          <p>
            Contact:
            <a href="mailto:ausccm.official@gmail.com">ausccm.official@gmail.com</a>
          </p>
        </div>
        <div class="footer-right">
          <a href="https://pk.linkedin.com/company/aucssm" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://www.instagram.com/aucssm" target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
      </footer>
    </div>
    <script src="/particles.js" type="module"></script>
  </body>
</html>`);
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`AU CSSM verification server listening on port ${port}`);
});

