import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import QRCode from "qrcode";
import { config as loadEnv } from "dotenv";
import {
  createMember,
  deleteMember,
  getMember,
  getMemberByRollNumber,
  listMembers,
} from "./store";
import { MemberInput } from "./types";

loadEnv();

const app = express();
const port = process.env.PORT || 3000;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const BASE_URL =
  process.env.BASE_URL || `http://localhost:${String(port).trim()}`;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be set in env.");
}

app.use(cors());
app.use(bodyParser.json());

const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", "Basic realm=\"Admin Area\"");
    return res.status(401).send("Authentication required");
  }

  const base64Credentials = authHeader.slice("Basic ".length);
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const [username, password] = credentials.split(":", 2);

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(403).send("Forbidden");
  }

  next();
}

app.post(
  "/api/admin/members",
  requireAdmin,
  async (req, res) => {
  const { name, rollNumber, department, designation, session } =
    req.body as Partial<MemberInput>;

  if (!name || !rollNumber || !department || !designation || !session) {
    return res.status(400).json({ error: "All fields are required." });
  }

  let member;
  try {
    member = createMember({
      name,
      rollNumber,
      department,
      designation,
      session,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ROLL_NUMBER_EXISTS") {
      return res
        .status(409)
        .json({ error: "A member with this roll number already exists." });
    }
    throw error;
  }

  const normalizedBase = BASE_URL.replace(/\/+$/u, "");
  const qrUrl = `${normalizedBase}/verify/${encodeURIComponent(
    member.rollNumber.trim()
  )}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      scale: 6,
    });

    return res.status(201).json({ member, qrDataUrl, qrUrl });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to generate QR code.", details: String(error) });
  }
});

app.get("/api/admin/members", requireAdmin, (_req, res) => {
  const members = listMembers();
  res.json({ members });
});

app.delete("/api/admin/members/:id", requireAdmin, (req, res) => {
  const id = String(req.params.id);
  const removed = deleteMember(id);
  if (!removed) {
    return res.status(404).json({ error: "Member not found." });
  }
  res.status(204).send();
});

app.get("/api/members/:id", (req, res) => {
  const { id } = req.params;
  const member = getMember(id);
  if (!member) {
    return res.status(404).json({ error: "Member not found." });
  }
  res.json({ member });
});

app.get("/api/members/by-roll/:rollNumber", (req, res) => {
  const { rollNumber } = req.params;
  const member = getMemberByRollNumber(rollNumber);
  if (!member) {
    return res.status(404).json({ error: "Member not found." });
  }
  res.json({ member });
});

app.get("/verify/:rollNumber", (req, res) => {
  const { rollNumber } = req.params;
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
          <div class="member-card">
            <div class="member-card-header">
              <span class="member-card-label">Air University Cyber Security Society Multan</span>
              <span class="status-pill not-verified">Status: ❌ Not Verified</span>
            </div>
            <div class="member-card-body">
              <div class="member-card-photo-wrap placeholder"></div>
              <div class="member-card-details">
                <div class="code-card">
                  <div class="code-card-header">
                    <span class="code-dot red"></span>
                    <span class="code-dot yellow"></span>
                    <span class="code-dot green"></span>
                    <span class="code-card-title">Member Card.json</span>
                  </div>
                  <pre class="code-card-body">
<span class="code-key">"status"</span>: <span class="code-string">"not_verified"</span>,
<span class="code-key">"roll"</span>: <span class="code-null">null</span>,
<span class="code-key">"name"</span>: <span class="code-null">null</span>,
<span class="code-key">"department"</span>: <span class="code-null">null</span>,
<span class="code-key">"designation"</span>: <span class="code-null">null</span>,
<span class="code-key">"session"</span>: <span class="code-null">null</span>
</pre>
                </div>
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
          <div class="member-card">
            <div class="member-card-header">
              <span class="member-card-label">Air University Cyber Security Society Multan</span>
              <span class="status-pill verified">Status: ✅ Verified</span>
            </div>
            <div class="member-card-body">
              <div class="member-card-details">
                <div class="code-card">
                  <div class="code-card-header">
                    <span class="code-dot red"></span>
                    <span class="code-dot yellow"></span>
                    <span class="code-dot green"></span>
                    <span class="code-card-title">Member Card.json</span>
                  </div>
                  <pre class="code-card-body">
<span class="code-key">"status"</span>: <span class="code-string">"verified"</span>,
<span class="code-key">"roll"</span>: <span class="code-string">"${member.rollNumber}"</span>,
<span class="code-key">"name"</span>: <span class="code-string">"${member.name}"</span>,
<span class="code-key">"department"</span>: <span class="code-string">"${member.department}"</span>,
<span class="code-key">"designation"</span>: <span class="code-string">"${member.designation}"</span>,
<span class="code-key">"session"</span>: <span class="code-string">"${member.session}"</span>${
                    issuedText
                      ? `,
<span class="code-key">"issued_on"</span>: <span class="code-string">"${issuedText}"</span>`
                      : ""
                  }
</pre>
                </div>
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
});

app.get("/admin", requireAdmin, (_req, res) => {
  res.sendFile(path.join(publicDir, "admin.html"));
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`AU CSSM verification server listening on port ${port}`);
});

